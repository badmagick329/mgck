using System.Security.Cryptography;
using System.Text;
using CoreApi.WebApi.Infrastructure;
using CoreApi.WebApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Testcontainers.PostgreSql;
using Xunit;

namespace CoreApi.WebApi.Tests;

public class RefreshSessionMigrationTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _database = new PostgreSqlBuilder()
        .WithImage("postgres:15-alpine")
        .Build();

    public Task InitializeAsync() => _database.StartAsync();

    public Task DisposeAsync() => _database.DisposeAsync().AsTask();

    [Fact]
    public async Task Existing_refresh_tokens_are_backfilled_without_removing_legacy_data()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(_database.GetConnectionString())
            .Options;
        await using var context = new ApplicationDbContext(options);
        var migrator = context.Database.GetService<IMigrator>();
        await migrator.MigrateAsync("20260716013524_AddFollowedArtists");

        const string rawToken = "legacy-refresh-token";
        var expiresAt = DateTime.UtcNow.AddDays(3);
        var user = new AppUser
        {
            Id = Guid.NewGuid().ToString(),
            UserName = "legacy-user",
            NormalizedUserName = "LEGACY-USER",
            RefreshToken = rawToken,
            RefreshTokenExpiryTime = expiresAt,
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var beforeMigration = DateTime.UtcNow;
        await migrator.MigrateAsync();

        var session = await context.RefreshSessions.SingleAsync();
        Assert.Equal(user.Id, session.UserId);
        Assert.Equal(Hash(rawToken), session.TokenHash);
        Assert.InRange(
            session.ExpiresAt,
            expiresAt.AddMilliseconds(-1),
            expiresAt.AddMilliseconds(1)
        );
        Assert.InRange(session.CreatedAt, beforeMigration, DateTime.UtcNow);
        Assert.Equal(rawToken, (await context.Users.SingleAsync()).RefreshToken);
    }

    private static string Hash(string token)
    {
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)))
            .ToLowerInvariant();
    }
}
