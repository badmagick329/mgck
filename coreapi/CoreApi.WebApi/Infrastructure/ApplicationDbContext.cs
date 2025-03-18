using CoreApi.WebApi.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CoreApi.WebApi.Infrastructure;

public class ApplicationDbContext : IdentityDbContext<AppUser>
{
    public ApplicationDbContext(DbContextOptions dbContextOptions)
        : base(dbContextOptions) { }

    public DbSet<FeedbackComment> FeedbackComments { get; set; }
}
