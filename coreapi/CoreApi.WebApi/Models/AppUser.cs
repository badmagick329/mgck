using Microsoft.AspNetCore.Identity;

namespace CoreApi.WebApi.Models;

public class AppUser : IdentityUser
{
    // Retained temporarily so the refresh-session migration can be rolled back
    // without immediately invalidating sessions that existed before deployment.
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }

    public ICollection<RefreshSession> RefreshSessions { get; set; } = [];
}
