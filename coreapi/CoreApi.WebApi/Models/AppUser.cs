using Microsoft.AspNetCore.Identity;

namespace CoreApi.WebApi.Models;

public class AppUser : IdentityUser
{
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
}