using CoreApi.WebApi.Common;
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
                Name = RoleConstants.Admin,
                NormalizedName = RoleConstants.Admin.ToUpper()
            },

            new IdentityRole
            {
                Name = RoleConstants.NewUser,
                NormalizedName = RoleConstants.NewUser.ToUpper()
            },

            new IdentityRole
            {
                Name = RoleConstants.AcceptedUser,
                NormalizedName = RoleConstants.AcceptedUser.ToUpper()
            }
        ];
        builder.Entity<IdentityRole>().HasData(roles);
    }
}