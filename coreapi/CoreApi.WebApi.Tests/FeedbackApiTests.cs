using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using CoreApi.WebApi.Common;
using CoreApi.WebApi.Dtos;
using CoreApi.WebApi.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;
using Xunit;

namespace CoreApi.WebApi.Tests;

public class FeedbackApiTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();
    private WebApplicationFactory<Program> _factory = null!;

    public async Task InitializeAsync()
    {
        await _database.StartAsync();
        _factory = new FeedbackApiFactory(_database.GetConnectionString());
    }

    public async Task DisposeAsync()
    {
        _factory.Dispose();
        await _database.DisposeAsync();
    }

    [Fact]
    public async Task Malformed_login_bodies_return_bad_request()
    {
        using var client = _factory.CreateClient();
        foreach (var body in new[] { "{broken", "null", "[]", "{\"username\":42}" })
        {
            using var content = new StringContent(body, Encoding.UTF8, "application/json");
            using var response = await client.PostAsync("/api/auth/login", content);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
    }

    [Fact]
    public async Task Feedback_creation_is_public_but_reading_and_deletion_require_current_admin_access()
    {
        using var client = _factory.CreateClient();
        using var created = await client.PostAsJsonAsync("/api/feedback", new
        {
            comment = "A useful suggestion",
            originPath = "/",
        });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var feedback = (await created.Content.ReadFromJsonAsync<FeedbackCommentResponseDto>())!;
        var detailUrl = $"/api/feedback/{feedback.Id}";

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/feedback")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync(detailUrl)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.PostAsJsonAsync("/api/feedback/delete", new { feedback.Id })).StatusCode);

        const string username = "feedback-user";
        const string password = "password1";
        (await client.PostAsJsonAsync("/api/auth/register", new { username, password }))
            .EnsureSuccessStatusCode();
        using var login = await client.PostAsJsonAsync("/api/auth/login", new { username, password });
        login.EnsureSuccessStatusCode();
        var tokens = (await login.Content.ReadFromJsonAsync<Dictionary<string, string>>())!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokens["token"]);

        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/feedback")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync(detailUrl)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden,
            (await client.PostAsJsonAsync("/api/feedback/delete", new { feedback.Id })).StatusCode);

        using var scope = _factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var user = (await userManager.FindByNameAsync(username))!;
        Assert.True((await userManager.AddToRoleAsync(user, RoleConstants.Admin)).Succeeded);

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/feedback")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync(detailUrl)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/users")).StatusCode);

        Assert.True((await userManager.RemoveFromRoleAsync(user, RoleConstants.Admin)).Succeeded);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/feedback")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/users")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/role/init")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden,
            (await client.PostAsJsonAsync("/api/feedback/delete", new { feedback.Id })).StatusCode);

        Assert.True((await userManager.AddToRoleAsync(user, RoleConstants.Admin)).Succeeded);
        Assert.Equal(HttpStatusCode.NoContent,
            (await client.PostAsJsonAsync("/api/feedback/delete", new { feedback.Id })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync(detailUrl)).StatusCode);
    }

    private sealed class FeedbackApiFactory(string connectionString) : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.ConfigureTestServices(services =>
                services.Configure<TestServerOptions>(options => options.AllowSynchronousIO = true)
            );
            builder.ConfigureAppConfiguration(configuration =>
                configuration.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:DefaultConnection"] = connectionString,
                    ["JWT:Issuer"] = "http://localhost:5010",
                    ["JWT:Audience"] = "http://localhost:5010",
                    ["JWT:SigningKey"] = "test-signing-key-test-signing-key-test-signing-key-1234",
                    ["JWT:JWTTokenDurationInMinutes"] = "30",
                    ["JWT:RefreshTokenDurationInDays"] = "7",
                })
            );
        }
    }
}
