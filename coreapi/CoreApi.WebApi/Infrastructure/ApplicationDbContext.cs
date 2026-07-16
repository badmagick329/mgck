using CoreApi.WebApi.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CoreApi.WebApi.Infrastructure;

public class ApplicationDbContext : IdentityDbContext<AppUser>
{
    public ApplicationDbContext(DbContextOptions dbContextOptions)
        : base(dbContextOptions) { }

    public DbSet<FeedbackComment> FeedbackComments { get; set; }
    public DbSet<FollowedArtist> FollowedArtists { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<FollowedArtist>(entity =>
        {
            entity.Property(followedArtist => followedArtist.DisplayName).HasMaxLength(255);
            entity.HasIndex(followedArtist => new
            {
                followedArtist.UserId,
                followedArtist.ArtistPublicId,
            }).IsUnique();
            entity.HasOne(followedArtist => followedArtist.User)
                .WithMany()
                .HasForeignKey(followedArtist => followedArtist.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
