using System.Net;
using System.Net.Http.Json;
using CoreApi.WebApi.Common;
using CoreApi.WebApi.Controllers;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace CoreApi.WebApi.Tests;

public class AuthRateLimitTests
{
    private static TestServer CreateServer(Func<Task>? work = null)
    {
        return new TestServer(new WebHostBuilder()
            .ConfigureServices(services =>
            {
                services.AddRouting();
                services.AddAuthenticationRateLimits();
            })
            .Configure(app =>
            {
                app.UseRouting();
                app.UseRateLimiter();
                app.UseEndpoints(endpoints =>
                {
                    foreach (var method in new[] { "Login", "Register" })
                    {
                        // Use the real controller's policy metadata so missing/wrong wiring fails.
                        var policy = (EnableRateLimitingAttribute)Attribute.GetCustomAttribute(
                            typeof(AuthController).GetMethod(method)!, typeof(EnableRateLimitingAttribute))!;
                        endpoints.MapPost($"/api/auth/{method.ToLowerInvariant()}", async context =>
                        {
                            if (work is not null) await work();
                            await context.Response.WriteAsync("admitted");
                        })
                            .WithMetadata(policy);
                    }
                });
            }));
    }

    [Fact]
    public async Task Fresh_usernames_and_spoofed_forwarding_headers_cannot_bypass_registration_cap()
    {
        using var server = CreateServer();
        using var client = server.CreateClient();
        for (var index = 0; index < 10; index++)
        {
            client.DefaultRequestHeaders.Remove("X-Forwarded-For");
            client.DefaultRequestHeaders.Add("X-Forwarded-For", $"198.51.100.{index + 1}");
            Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/auth/register", new { username = $"new-{index}" })).StatusCode);
        }
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.PostAsJsonAsync("/api/auth/register", new { username = "another-new-name" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/auth/login", new { username = "existing-account" })).StatusCode);
    }

    [Fact]
    public async Task Login_has_an_aggregate_cap_independent_of_username()
    {
        using var server = CreateServer();
        using var client = server.CreateClient();
        for (var index = 0; index < 60; index++)
            Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/auth/login", new { username = $"name-{index}" })).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.PostAsJsonAsync("/api/auth/login", new { username = "unused-name" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/auth/register", new { username = "new-user" })).StatusCode);
    }

    [Fact]
    public async Task Login_and_registration_share_a_bounded_concurrency_budget()
    {
        var release = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var allEntered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var entered = 0;
        using var server = CreateServer(async () =>
        {
            if (Interlocked.Increment(ref entered) == 4) allEntered.SetResult();
            await release.Task;
        });
        using var client = server.CreateClient();
        var requests = Enumerable.Range(0, 4).Select(_ => client.PostAsJsonAsync("/api/auth/login", new { username = "user" })).ToArray();
        try
        {
            await allEntered.Task.WaitAsync(TimeSpan.FromSeconds(5));
            Assert.Equal(HttpStatusCode.TooManyRequests, (await client.PostAsJsonAsync("/api/auth/register", new { username = "fresh" })).StatusCode);
        }
        finally { release.SetResult(); }
        Assert.All(await Task.WhenAll(requests), response => Assert.Equal(HttpStatusCode.OK, response.StatusCode));
    }
}
