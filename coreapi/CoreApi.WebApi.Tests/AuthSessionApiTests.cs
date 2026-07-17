using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using CoreApi.WebApi.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;
using Xunit;

namespace CoreApi.WebApi.Tests;

public class AuthSessionApiTests : IAsyncLifetime
{
    private const string Password = "password1";
    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder()
        .WithImage("postgres:15-alpine")
        .Build();
    private AuthApiFactory? _factory;

    public async Task InitializeAsync()
    {
        await _database.StartAsync();
        _factory = new AuthApiFactory(_database.GetConnectionString());
        _ = _factory.CreateClient();
    }

    public async Task DisposeAsync()
    {
        _factory?.Dispose();
        await _database.DisposeAsync();
    }

    [Fact]
    public async Task Two_logins_refresh_independently_and_store_only_hashes()
    {
        var username = await RegisterUser();
        var desktop = await Login(username);
        var phone = await Login(username);

        Assert.NotEqual(desktop.RefreshToken, phone.RefreshToken);
        Assert.Equal(desktop.RefreshToken, (await Refresh(desktop.RefreshToken)).RefreshToken);
        Assert.Equal(phone.RefreshToken, (await Refresh(phone.RefreshToken)).RefreshToken);

        await using var scope = _factory!.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var sessions = context.RefreshSessions.Where(session => session.User!.UserName == username).ToList();
        Assert.Equal(2, sessions.Count);
        Assert.Contains(sessions, session => session.TokenHash == Hash(desktop.RefreshToken));
        Assert.Contains(sessions, session => session.TokenHash == Hash(phone.RefreshToken));
        Assert.DoesNotContain(sessions, session => session.TokenHash == desktop.RefreshToken);
    }

    [Fact]
    public async Task Concurrent_refreshes_for_one_session_all_succeed()
    {
        var username = await RegisterUser();
        var login = await Login(username);
        var client = _factory!.CreateClient();

        var responses = await Task.WhenAll(
            Enumerable.Range(0, 5).Select(_ =>
                client.PostAsJsonAsync(
                    "/api/auth/refresh",
                    new { refreshToken = login.RefreshToken }
                )
            )
        );

        Assert.All(responses, response => Assert.Equal(HttpStatusCode.OK, response.StatusCode));
        foreach (var response in responses)
        {
            var tokens = await ReadTokens(response);
            Assert.Equal(login.RefreshToken, tokens.RefreshToken);
        }
    }

    [Fact]
    public async Task Logout_revokes_only_the_current_session_and_is_idempotent()
    {
        var username = await RegisterUser();
        var desktop = await Login(username);
        var phone = await Login(username);
        var otherUsername = await RegisterUser();
        var otherUser = await Login(otherUsername);
        var desktopClient = _factory!.CreateClient();
        desktopClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            desktop.Token
        );

        var logout = await desktopClient.PostAsJsonAsync(
            "/api/auth/logout",
            new { refreshToken = desktop.RefreshToken }
        );
        var repeatedLogout = await desktopClient.PostAsJsonAsync(
            "/api/auth/logout",
            new { refreshToken = desktop.RefreshToken }
        );
        var wrongOwnerLogout = await desktopClient.PostAsJsonAsync(
            "/api/auth/logout",
            new { refreshToken = otherUser.RefreshToken }
        );
        var desktopRefresh = await _factory.CreateClient().PostAsJsonAsync(
            "/api/auth/refresh",
            new { refreshToken = desktop.RefreshToken }
        );

        Assert.Equal(HttpStatusCode.OK, logout.StatusCode);
        Assert.Equal(HttpStatusCode.OK, repeatedLogout.StatusCode);
        Assert.Equal(HttpStatusCode.OK, wrongOwnerLogout.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, desktopRefresh.StatusCode);
        Assert.Equal(phone.RefreshToken, (await Refresh(phone.RefreshToken)).RefreshToken);
        Assert.Equal(
            otherUser.RefreshToken,
            (await Refresh(otherUser.RefreshToken)).RefreshToken
        );
    }

    [Fact]
    public async Task Invalid_and_expired_sessions_fail_closed()
    {
        var username = await RegisterUser();
        var login = await Login(username);

        await using (var scope = _factory!.Services.CreateAsyncScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var session = context.RefreshSessions.Single(item =>
                item.TokenHash == Hash(login.RefreshToken)
            );
            session.ExpiresAt = DateTime.UtcNow.AddMinutes(-1);
            await context.SaveChangesAsync();
        }

        var client = _factory!.CreateClient();
        var expired = await client.PostAsJsonAsync(
            "/api/auth/refresh",
            new { refreshToken = login.RefreshToken }
        );
        var unknown = await client.PostAsJsonAsync(
            "/api/auth/refresh",
            new { refreshToken = "unknown-token" }
        );
        var oversized = await client.PostAsJsonAsync(
            "/api/auth/refresh",
            new { refreshToken = new string('x', 257) }
        );

        Assert.Equal(HttpStatusCode.Unauthorized, expired.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, unknown.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, oversized.StatusCode);

        await using var verificationScope = _factory.Services.CreateAsyncScope();
        var verificationContext =
            verificationScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.DoesNotContain(
            verificationContext.RefreshSessions,
            item => item.TokenHash == Hash(login.RefreshToken)
        );
    }

    [Fact]
    public async Task Login_cleans_inactive_sessions_without_affecting_active_sessions()
    {
        var username = await RegisterUser();
        var expired = await Login(username);
        var active = await Login(username);

        await using (var scope = _factory!.Services.CreateAsyncScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            context.RefreshSessions.Single(item => item.TokenHash == Hash(expired.RefreshToken)).RevokedAt =
                DateTime.UtcNow;
            await context.SaveChangesAsync();
        }

        var latest = await Login(username);

        await using var verificationScope = _factory!.Services.CreateAsyncScope();
        var verificationContext =
            verificationScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var hashes = verificationContext.RefreshSessions
            .Where(session => session.User!.UserName == username)
            .Select(session => session.TokenHash)
            .ToList();
        Assert.Equal(2, hashes.Count);
        Assert.Contains(Hash(active.RefreshToken), hashes);
        Assert.Contains(Hash(latest.RefreshToken), hashes);
        Assert.DoesNotContain(Hash(expired.RefreshToken), hashes);
    }

    private async Task<string> RegisterUser()
    {
        var username = $"user-{Guid.NewGuid():N}";
        var response = await _factory!.CreateClient().PostAsJsonAsync(
            "/api/auth/register",
            new { username, password = Password }
        );
        response.EnsureSuccessStatusCode();
        return username;
    }

    private async Task<AuthTokens> Login(string username)
    {
        var response = await _factory!.CreateClient().PostAsJsonAsync(
            "/api/auth/login",
            new { username, password = Password }
        );
        response.EnsureSuccessStatusCode();
        return await ReadTokens(response);
    }

    private async Task<AuthTokens> Refresh(string refreshToken)
    {
        var response = await _factory!.CreateClient().PostAsJsonAsync(
            "/api/auth/refresh",
            new { refreshToken }
        );
        response.EnsureSuccessStatusCode();
        return await ReadTokens(response);
    }

    private static async Task<AuthTokens> ReadTokens(HttpResponseMessage response)
    {
        using var payload = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return new AuthTokens(
            payload.RootElement.GetProperty("token").GetString()!,
            payload.RootElement.GetProperty("refreshToken").GetString()!
        );
    }

    private static string Hash(string token)
    {
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)))
            .ToLowerInvariant();
    }

    private sealed record AuthTokens(string Token, string RefreshToken);

    private sealed class AuthApiFactory : WebApplicationFactory<Program>
    {
        private readonly string _connectionString;

        public AuthApiFactory(string connectionString)
        {
            _connectionString = connectionString;
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.ConfigureTestServices(services =>
                services.Configure<TestServerOptions>(options => options.AllowSynchronousIO = true)
            );
            builder.ConfigureAppConfiguration(configuration =>
                configuration.AddInMemoryCollection(
                    new Dictionary<string, string?>
                    {
                        ["ConnectionStrings:DefaultConnection"] = _connectionString,
                        ["JWT:Issuer"] = "http://localhost:5010",
                        ["JWT:Audience"] = "http://localhost:5010",
                        ["JWT:SigningKey"] =
                            "test-signing-key-test-signing-key-test-signing-key-1234",
                        ["JWT:JWTTokenDurationInMinutes"] = "30",
                        ["JWT:RefreshTokenDurationInDays"] = "7",
                    }
                )
            );
        }
    }
}
