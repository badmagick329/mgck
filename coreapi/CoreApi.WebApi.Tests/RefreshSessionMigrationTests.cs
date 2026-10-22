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
    public async Task Legacy_tokens_are_backfilled_and_session_data_survives_legacy_column_removal()
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
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        // Seed the predecessor schema directly: the current model no longer owns these fields.
        await context.Database.ExecuteSqlInterpolatedAsync(
            $"""
            UPDATE "AspNetUsers"
            SET "RefreshToken" = {rawToken}, "RefreshTokenExpiryTime" = {expiresAt}
            WHERE "Id" = {user.Id}
            """
        );

        // The migration uses the database clock; the Docker host clock can differ.
        var beforeMigration = await context.Database.SqlQueryRaw<DateTime>("SELECT clock_timestamp() AS \"Value\"").SingleAsync();
        await migrator.MigrateAsync("20260717125653_AddRefreshSessions");

        var session = await context.RefreshSessions.SingleAsync();
        Assert.Equal(user.Id, session.UserId);
        Assert.Equal(Hash(rawToken), session.TokenHash);
        Assert.InRange(
            session.ExpiresAt,
            expiresAt.AddMilliseconds(-1),
            expiresAt.AddMilliseconds(1)
        );
        var afterMigration = await context.Database.SqlQueryRaw<DateTime>("SELECT clock_timestamp() AS \"Value\"").SingleAsync();
        Assert.InRange(session.CreatedAt, beforeMigration, afterMigration);
        Assert.Equal(
            rawToken,
            await context.Database.SqlQuery<string>(
                $"""SELECT "RefreshToken" AS "Value" FROM "AspNetUsers" WHERE "Id" = {user.Id}"""
            ).SingleAsync()
        );

        var createdAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        context.RefreshSessions.AddRange(
            new RefreshSession
            {
                UserId = user.Id,
                TokenHash = Hash("other-active-device"),
                CreatedAt = createdAt,
                ExpiresAt = createdAt.AddYears(5),
                LastUsedAt = createdAt.AddHours(1),
            },
            new RefreshSession
            {
                UserId = user.Id,
                TokenHash = Hash("expired-device"),
                CreatedAt = createdAt,
                ExpiresAt = createdAt.AddDays(1),
                LastUsedAt = createdAt.AddHours(2),
            },
            new RefreshSession
            {
                UserId = user.Id,
                TokenHash = Hash("revoked-device"),
                CreatedAt = createdAt,
                ExpiresAt = createdAt.AddYears(5),
                LastUsedAt = createdAt.AddHours(3),
                RevokedAt = createdAt.AddHours(4),
            }
        );
        await context.SaveChangesAsync();
        var sessions = context.RefreshSessions.AsNoTracking().OrderBy(item => item.Id)
            .Select(item => new
            {
                item.Id,
                item.UserId,
                item.TokenHash,
                item.CreatedAt,
                item.ExpiresAt,
                item.LastUsedAt,
                item.RevokedAt,
            });
        var expectedSessions = await sessions.ToArrayAsync();

        await migrator.MigrateAsync();

        Assert.Equal(expectedSessions, await sessions.ToArrayAsync());
        Assert.Equal(
            0,
            await context.Database.SqlQueryRaw<int>(
                """
                SELECT COUNT(*)::int AS "Value"
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'AspNetUsers'
                  AND column_name IN ('RefreshToken', 'RefreshTokenExpiryTime')
                """
            ).SingleAsync()
        );
    }

    private static string Hash(string token)
    {
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)))
            .ToLowerInvariant();
    }
}
