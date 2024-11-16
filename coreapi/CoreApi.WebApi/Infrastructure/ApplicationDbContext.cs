using CoreApi.WebApi.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CoreApi.WebApi.Infrastructure;

public class ApplicationDbContext : IdentityDbContext<AppUser>
{
    public ApplicationDbContext(DbContextOptions dbContextOptions) : base(dbContextOptions)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        List<IdentityRole> roles =
        [
            new IdentityRole
            {
                Name = "Admin",
                NormalizedName = "ADMIN"
            },

            new IdentityRole
            {
                Name = "NewUser",
                NormalizedName = "NEWUSER"
            }
        ];
        builder.Entity<IdentityRole>().HasData(roles);
    }
}