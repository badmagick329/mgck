using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;
using Xunit;

namespace CoreApi.WebApi.Tests;

public class FollowingApiTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();
    private FollowingApiFactory? _factory;

    public async Task InitializeAsync()
    {
        await _database.StartAsync();
        _factory = new FollowingApiFactory(_database.GetConnectionString());
        _ = _factory.CreateClient();
    }

    public async Task DisposeAsync()
    {
        _factory?.Dispose();
        await _database.DisposeAsync();
    }

    [Fact]
    public async Task Follows_are_idempotent_and_private_to_the_current_user()
    {
        using var firstUser = await AuthenticatedClient();
        using var secondUser = await AuthenticatedClient();
        var artistId = Guid.NewGuid();

        var firstAdd = await firstUser.PostAsJsonAsync(
            "/api/kpop/following",
            new { artistPublicId = artistId, displayName = "Example Artist" }
        );
        var duplicateAdd = await firstUser.PostAsJsonAsync(
            "/api/kpop/following",
            new { artistPublicId = artistId, displayName = "Renamed Artist" }
        );

        Assert.Equal(HttpStatusCode.Created, firstAdd.StatusCode);
        Assert.Equal(HttpStatusCode.OK, duplicateAdd.StatusCode);
        Assert.Equal(0, (await FollowingCount(secondUser)));
        Assert.Equal(1, await FollowingCount(firstUser));

        var delete = await firstUser.DeleteAsync($"/api/kpop/following/{artistId}");
        var duplicateDelete = await firstUser.DeleteAsync($"/api/kpop/following/{artistId}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, duplicateDelete.StatusCode);
    }

    [Fact]
    public async Task Merge_unions_follows_and_rejects_an_over_limit_change_atomically()
    {
        using var client = await AuthenticatedClient();
        var artists = Enumerable.Range(0, 250)
            .Select(index => new { artistPublicId = Guid.NewGuid(), displayName = $"Artist {index}" })
            .ToList();

        var merge = await client.PostAsJsonAsync("/api/kpop/following/merge", new { artists });
        var overLimit = await client.PostAsJsonAsync(
            "/api/kpop/following",
            new { artistPublicId = Guid.NewGuid(), displayName = "One Too Many" }
        );

        Assert.Equal(HttpStatusCode.OK, merge.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, overLimit.StatusCode);
        Assert.Equal(250, await FollowingCount(client));
    }

    private async Task<HttpClient> AuthenticatedClient()
    {
        var client = _factory!.CreateClient();
        var username = $"user-{Guid.NewGuid():N}";
        const string password = "password1";
        var register = await client.PostAsJsonAsync(
            "/api/auth/register",
            new { username, password }
        );
        Assert.True(register.IsSuccessStatusCode, await register.Content.ReadAsStringAsync());
        var login = await client.PostAsJsonAsync("/api/auth/login", new { username, password });
        login.EnsureSuccessStatusCode();
        using var payload = JsonDocument.Parse(await login.Content.ReadAsStringAsync());
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            payload.RootElement.GetProperty("token").GetString()
        );
        return client;
    }

    private static async Task<int> FollowingCount(HttpClient client)
    {
        using var response = await client.GetAsync("/api/kpop/following");
        response.EnsureSuccessStatusCode();
        using var payload = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return payload.RootElement.GetProperty("artists").GetArrayLength();
    }

    private sealed class FollowingApiFactory : WebApplicationFactory<Program>
    {
        private readonly string _connectionString;

        public FollowingApiFactory(string connectionString)
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
                        ["JWT:SigningKey"] = "test-signing-key-test-signing-key-test-signing-key-1234",
                        ["JWT:JWTTokenDurationInMinutes"] = "30",
                        ["JWT:RefreshTokenDurationInDays"] = "7",
                    }
                )
            );
        }
    }
}
