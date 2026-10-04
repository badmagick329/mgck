using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using CoreApi.WebApi.Common;
using CoreApi.WebApi.Dtos;
using CoreApi.WebApi.Infrastructure;
using CoreApi.WebApi.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
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
    public async Task Health_check_is_public_without_exposing_feedback()
    {
        using var client = _factory.CreateClient();
        using var health = await client.GetAsync("/healthz");
        Assert.Equal(HttpStatusCode.OK, health.StatusCode);
        Assert.Equal("ok", (await health.Content.ReadFromJsonAsync<Dictionary<string, string>>())!["status"]);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/feedback")).StatusCode);
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

    [Fact]
    public async Task Invalid_feedback_is_rejected_before_persistence_and_exact_limits_work()
    {
        using var client = _factory.CreateClient();
        foreach (var payload in new object[]
        {
            new { comment = "", originPath = "/", createdBy = "name" },
            new { comment = "   ", originPath = "/", createdBy = "name" },
            new { comment = new string('x', 4001), originPath = "/", createdBy = "name" },
            new { comment = "valid", originPath = new string('x', 2049), createdBy = "name" },
            new { comment = "valid", originPath = "/", createdBy = new string('x', 201) },
            new { comment = "valid", originPath = "   ", createdBy = "name" },
            new { comment = (string?)null, originPath = "/", createdBy = "name" },
        })
        {
            using var response = await client.PostAsJsonAsync("/api/feedback", payload);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
        using var scope = _factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.Equal(0, await database.FeedbackComments.CountAsync());

        using var valid = await client.PostAsJsonAsync("/api/feedback", new
        {
            comment = new string('x', 4000), originPath = new string('x', 2048), createdBy = new string('x', 200),
        });
        Assert.Equal(HttpStatusCode.Created, valid.StatusCode);
        Assert.Equal(1, await database.FeedbackComments.CountAsync());
    }

    [Fact]
    public async Task Admin_pages_are_bounded_and_cursor_survives_deletions_and_new_arrivals()
    {
        using var client = _factory.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var admin = new AppUser { UserName = "paging-admin" };
        Assert.True((await users.CreateAsync(admin, "password1")).Succeeded);
        Assert.True((await users.AddToRoleAsync(admin, RoleConstants.Admin)).Succeeded);
        using var login = await client.PostAsJsonAsync("/api/auth/login", new { username = "paging-admin", password = "password1" });
        var tokens = (await login.Content.ReadFromJsonAsync<Dictionary<string, string>>())!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokens["token"]);

        var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var records = Enumerable.Range(0, 105).Select(i => new FeedbackComment
        {
            Comment = $"Message {i}", CreatedBy = "Anonymous", OriginPath = "/", CreatedAt = DateTime.UtcNow.Date,
        }).ToList();
        database.FeedbackComments.AddRange(records);
        await database.SaveChangesAsync();
        var first = (await client.GetFromJsonAsync<FeedbackPageResponseDto>("/api/feedback"))!;
        Assert.Equal(50, first.Feedbacks.Count);
        Assert.Equal(records.Skip(55).Reverse().Select(r => r.Id), first.Feedbacks.Select(r => r.Id));
        Assert.Equal(first.Feedbacks[^1].Id, first.NextCursor);

        // Delete an already-loaded row and add a new row above the cursor.
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync("/api/feedback/delete", new { id = first.Feedbacks[0].Id })).StatusCode);
        (await client.PostAsJsonAsync("/api/feedback", new { comment = "New arrival", originPath = "/" })).EnsureSuccessStatusCode();
        var second = (await client.GetFromJsonAsync<FeedbackPageResponseDto>($"/api/feedback?beforeId={first.NextCursor}"))!;
        var third = (await client.GetFromJsonAsync<FeedbackPageResponseDto>($"/api/feedback?beforeId={second.NextCursor}"))!;
        Assert.Equal(50, second.Feedbacks.Count);
        Assert.Equal(5, third.Feedbacks.Count);
        Assert.Null(third.NextCursor);
        Assert.Equal(records.AsEnumerable().Reverse().Select(r => r.Id),
            first.Feedbacks.Concat(second.Feedbacks).Concat(third.Feedbacks).Select(r => r.Id));
        foreach (var invalid in new[] { "0", "-1", "bad", "2147483648" })
            Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync($"/api/feedback?beforeId={invalid}")).StatusCode);
    }

    [Fact]
    public async Task Feedback_creation_cap_ignores_forged_peer_headers_and_keeps_health_available()
    {
        using var client = _factory.CreateClient();
        for (var i = 0; i < 30; i++)
        {
            client.DefaultRequestHeaders.Remove("X-Forwarded-For");
            client.DefaultRequestHeaders.Add("X-Forwarded-For", $"198.51.100.{i + 1}");
            Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/feedback", new { comment = $"Message {i}", originPath = "/" })).StatusCode);
        }
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.PostAsJsonAsync("/api/feedback", new { comment = "Overflow", originPath = "/" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/healthz")).StatusCode);
        using var scope = _factory.Services.CreateScope();
        Assert.Equal(30, await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().FeedbackComments.CountAsync());
    }

    private sealed class FeedbackApiFactory(string connectionString) : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
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
