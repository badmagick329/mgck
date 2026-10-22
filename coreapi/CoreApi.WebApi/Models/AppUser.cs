using Microsoft.AspNetCore.Identity;

namespace CoreApi.WebApi.Models;

public class AppUser : IdentityUser
{
    public ICollection<RefreshSession> RefreshSessions { get; set; } = [];
}
