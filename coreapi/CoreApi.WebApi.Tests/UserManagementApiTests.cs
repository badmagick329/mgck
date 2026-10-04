using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using CoreApi.WebApi.Common;
using CoreApi.WebApi.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Testcontainers.PostgreSql;
using Xunit;

namespace CoreApi.WebApi.Tests;

public class UserManagementApiTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine").Build();
    private readonly FailurePlan _failures = new();
    private WebApplicationFactory<Program> _factory = null!;

    public async Task InitializeAsync()
    {
        await _database.StartAsync();
        _factory = new UserApiFactory(_database.GetConnectionString(), _failures);
    }

    public async Task DisposeAsync()
    {
        _factory.Dispose();
        await _database.DisposeAsync();
    }

    private async Task CreateUser(string name, params string[] roles)
    {
        using var scope = _factory.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var user = new AppUser { UserName = name };
        Assert.True((await users.CreateAsync(user, "password1")).Succeeded);
        foreach (var role in roles)
            Assert.True((await users.AddToRoleAsync(user, role)).Succeeded);
    }

    private async Task<HttpClient> Login(string name)
    {
        var client = _factory.CreateClient();
        using var login = await client.PostAsJsonAsync("/api/auth/login", new { username = name, password = "password1" });
        login.EnsureSuccessStatusCode();
        var tokens = (await login.Content.ReadFromJsonAsync<Dictionary<string, string>>())!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokens["token"]);
        return client;
    }

    private async Task<HttpClient> AdminClient()
    {
        await CreateUser("operator", RoleConstants.Admin);
        return await Login("operator");
    }

    private async Task AssertRoles(string name, params string[] expected)
    {
        // Read in a new scope so rolled-back tracked entities cannot hide persistence bugs.
        using var scope = _factory.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var user = await users.FindByNameAsync(name);
        Assert.NotNull(user);
        Assert.Equal(expected.Order(), (await users.GetRolesAsync(user)).Order());
    }

    [Fact]
    public async Task Approval_transitions_require_the_expected_state_and_preserve_accounts()
    {
        using var client = await AdminClient();
        await CreateUser("candidate", RoleConstants.NewUser);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/users/manage/approve", new { username = "candidate" })).StatusCode);
        await AssertRoles("candidate", RoleConstants.AcceptedUser);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/api/users/manage/approve", new { username = "candidate" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/users/manage/unapprove", new { username = "candidate" })).StatusCode);
        await AssertRoles("candidate", RoleConstants.NewUser);
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync("/api/users/manage/unapprove", new { username = "candidate" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/users/manage/approve", new { username = "missing" })).StatusCode);
    }

    [Theory]
    [InlineData(RoleConstants.Admin)]
    [InlineData(RoleConstants.Admin, RoleConstants.NewUser)]
    [InlineData(RoleConstants.Admin, RoleConstants.AcceptedUser)]
    [InlineData(RoleConstants.NewUser, RoleConstants.AcceptedUser)]
    [InlineData()]
    public async Task Approval_cannot_modify_admin_mixed_or_roleless_accounts(params string[] roles)
    {
        using var client = await AdminClient();
        await CreateUser("protected", roles);
        foreach (var action in new[] { "approve", "unapprove" })
        {
            Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync($"/api/users/manage/{action}", new { username = "protected" })).StatusCode);
            await AssertRoles("protected", roles);
        }
    }

    [Theory]
    [InlineData("approve", "remove")]
    [InlineData("approve", "add")]
    [InlineData("unapprove", "remove")]
    [InlineData("unapprove", "add")]
    public async Task Failed_role_operations_roll_back_every_change(string action, string operation)
    {
        using var client = await AdminClient();
        var original = action == "approve" ? RoleConstants.NewUser : RoleConstants.AcceptedUser;
        await CreateUser("candidate", original);
        _failures.Operation = operation;
        _failures.Username = "candidate";
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsJsonAsync($"/api/users/manage/{action}", new { username = "candidate" })).StatusCode);
        await AssertRoles("candidate", original);
    }

    [Fact]
    public async Task Cleanup_deletes_only_accounts_with_the_single_new_user_role()
    {
        using var client = await AdminClient();
        await CreateUser("ordinary-new", RoleConstants.NewUser);
        await CreateUser("mixed-admin", RoleConstants.Admin, RoleConstants.NewUser);
        await CreateUser("mixed-accepted", RoleConstants.AcceptedUser, RoleConstants.NewUser);
        await CreateUser("accepted", RoleConstants.AcceptedUser);
        await CreateUser("roleless");
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsync("/api/users/manage/delete", null)).StatusCode);
        await AssertRoles("operator", RoleConstants.Admin);
        await AssertRoles("mixed-admin", RoleConstants.Admin, RoleConstants.NewUser);
        await AssertRoles("mixed-accepted", RoleConstants.AcceptedUser, RoleConstants.NewUser);
        await AssertRoles("accepted", RoleConstants.AcceptedUser);
        await AssertRoles("roleless");
        using var scope = _factory.Services.CreateScope();
        Assert.Null(await scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>().FindByNameAsync("ordinary-new"));
    }

    [Fact]
    public async Task Failed_cleanup_rolls_back_accounts_already_deleted_in_the_batch()
    {
        using var client = await AdminClient();
        await CreateUser("first", RoleConstants.NewUser);
        await CreateUser("second", RoleConstants.NewUser);
        _failures.Operation = "delete-second";
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsync("/api/users/manage/delete", null)).StatusCode);
        Assert.Equal(2, _failures.DeleteCalls);
        await AssertRoles("first", RoleConstants.NewUser);
        await AssertRoles("second", RoleConstants.NewUser);
    }

    [Fact]
    public async Task Cleanup_rejects_a_concurrent_admin_promotion_instead_of_deleting_the_account()
    {
        using var client = await AdminClient();
        await CreateUser("candidate", RoleConstants.NewUser);
        _failures.Operation = "promote-before-delete";
        _failures.Username = "candidate";
        Assert.Equal(HttpStatusCode.Conflict, (await client.PostAsync("/api/users/manage/delete", null)).StatusCode);
        await AssertRoles("candidate", RoleConstants.NewUser, RoleConstants.Admin);
    }

    [Fact]
    public async Task Mutations_require_current_admin_membership_even_with_an_issued_admin_token()
    {
        using var client = await AdminClient();
        await CreateUser("candidate", RoleConstants.NewUser);
        using (var scope = _factory.Services.CreateScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
            Assert.True((await users.RemoveFromRoleAsync((await users.FindByNameAsync("operator"))!, RoleConstants.Admin)).Succeeded);
        }
        foreach (var action in new[] { "approve", "unapprove", "delete" })
            Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync($"/api/users/manage/{action}", new { username = "candidate" })).StatusCode);
        await AssertRoles("candidate", RoleConstants.NewUser);
        using var anonymous = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PostAsync("/api/users/manage/delete", null)).StatusCode);
    }

    private sealed class FailurePlan
    {
        public string? Operation { get; set; }
        public string? Username { get; set; }
        public int DeleteCalls { get; set; }
    }

    // Inject failure after a real write, exercising database rollback rather than a no-op mock.
    private sealed class FaultingUserManager(
        IUserStore<AppUser> store, IOptions<IdentityOptions> options, IPasswordHasher<AppUser> hasher,
        IEnumerable<IUserValidator<AppUser>> userValidators, IEnumerable<IPasswordValidator<AppUser>> passwordValidators,
        ILookupNormalizer normalizer, IdentityErrorDescriber errors, IServiceProvider services,
        ILogger<UserManager<AppUser>> logger, FailurePlan failures, IServiceScopeFactory scopes)
        : UserManager<AppUser>(store, options, hasher, userValidators, passwordValidators, normalizer, errors, services, logger)
    {
        private static IdentityResult Failure() => IdentityResult.Failed(new IdentityError { Code = "InjectedFailure", Description = "Injected persistence failure" });

        public override async Task<IdentityResult> RemoveFromRoleAsync(AppUser user, string role)
        {
            var result = await base.RemoveFromRoleAsync(user, role);
            return result.Succeeded && failures.Operation == "remove" && failures.Username == user.UserName ? Failure() : result;
        }

        public override async Task<IdentityResult> AddToRoleAsync(AppUser user, string role)
        {
            var result = await base.AddToRoleAsync(user, role);
            return result.Succeeded && failures.Operation == "add" && failures.Username == user.UserName ? Failure() : result;
        }

        public override async Task<IdentityResult> DeleteAsync(AppUser user)
        {
            if (failures.Operation == "promote-before-delete" && failures.Username == user.UserName)
            {
                // Another writer commits after eligibility was read, before Identity's delete.
                using var scope = scopes.CreateScope();
                var otherUsers = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
                var otherUser = (await otherUsers.FindByNameAsync(user.UserName!))!;
                Assert.True((await otherUsers.AddToRoleAsync(otherUser, RoleConstants.Admin)).Succeeded);
            }
            var result = await base.DeleteAsync(user);
            if (failures.Operation == "delete-second" && ++failures.DeleteCalls == 2 && result.Succeeded)
                return Failure();
            return result;
        }
    }

    private sealed class UserApiFactory(string connectionString, FailurePlan failures) : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.ConfigureAppConfiguration(configuration => configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = connectionString,
                ["JWT:Issuer"] = "http://localhost:5010",
                ["JWT:Audience"] = "http://localhost:5010",
                ["JWT:SigningKey"] = "test-signing-key-test-signing-key-test-signing-key-1234",
                ["JWT:JWTTokenDurationInMinutes"] = "30",
                ["JWT:RefreshTokenDurationInDays"] = "7",
            }));
            builder.ConfigureServices(services =>
            {
                services.AddSingleton(failures);
                services.AddScoped<UserManager<AppUser>, FaultingUserManager>();
            });
        }
    }
}
