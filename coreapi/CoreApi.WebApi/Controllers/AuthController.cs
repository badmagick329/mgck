using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using CoreApi.WebApi.Common;
using CoreApi.WebApi.Dtos;
using CoreApi.WebApi.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace CoreApi.WebApi.Controllers;

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Models;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;
    private readonly int _jwtTokenDurationInMinutes;
    private readonly int _refreshTokenDurationInDays;

    public AuthController(
        UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager,
        IConfiguration configuration,
        ApplicationDbContext context
    )
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _context = context;
        _jwtTokenDurationInMinutes = int.Parse(
            _configuration["JWT:JWTTokenDurationInMinutes"] ?? ""
        );
        _refreshTokenDurationInDays = int.Parse(
            _configuration["JWT:RefreshTokenDurationInDays"] ?? ""
        );
    }

    [HttpPost("register")]
    [EnableRateLimiting("login-limiter")]
    public async Task<IActionResult> Register([FromBody] RegisterDto model)
    {
        if (model.Username.Length < 3)
        {
            return BadRequest("Username must be at least 3 characters long.");
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();

        var user = new AppUser { UserName = model.Username };
        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        try
        {
            var addRoleResult = await _userManager.AddToRoleAsync(user, RoleConstants.NewUser);
            if (!addRoleResult.Succeeded)
            {
                await transaction.RollbackAsync();
                return BadRequest("Could not assign new user role");
            }
        }
        catch (InvalidOperationException)
        {
            await transaction.RollbackAsync();
            return BadRequest("Role not found");
        }

        await transaction.CommitAsync();
        return Ok(new { message = "Registration successful" });
    }

    [HttpPost("login")]
    [EnableRateLimiting("login-limiter")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        var user = await _userManager.FindByNameAsync(model.Username);
        if (user is null)
        {
            var errorResponse = new CredentialsErrorResponse(
                "Invalid Credentials",
                "Credentials are invalid."
            );
            return Unauthorized(new[] { errorResponse });
        }

        var signInResult = await _signInManager.CheckPasswordSignInAsync(
            user,
            model.Password,
            false
        );
        if (!signInResult.Succeeded)
        {
            var errorResponse = new CredentialsErrorResponse(
                "Invalid Credentials",
                "Credentials are invalid."
            );
            return Unauthorized(new[] { errorResponse });
        }

        var userRole = (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? "";
        var token = GenerateJwtToken(user, userRole);
        var refreshToken = GenerateRefreshToken();

        var now = DateTime.UtcNow;
        await _context.RefreshSessions
            .Where(session =>
                session.UserId == user.Id
                && (session.ExpiresAt <= now || session.RevokedAt != null)
            )
            .ExecuteDeleteAsync();
        if (
            user.RefreshToken is not null
            && (user.RefreshTokenExpiryTime is null || user.RefreshTokenExpiryTime <= now)
        )
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
        }
        _context.RefreshSessions.Add(
            new RefreshSession
            {
                UserId = user.Id,
                TokenHash = HashRefreshToken(refreshToken.Token),
                CreatedAt = now,
                ExpiresAt = refreshToken.ExpiryTime,
            }
        );
        await _context.SaveChangesAsync();

        return Ok(new { token, refreshToken = refreshToken.Token });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenDto model)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            return BadRequest("User not found");
        }

        var tokenHash = HashRefreshToken(model.RefreshToken);
        var session = await _context.RefreshSessions.FirstOrDefaultAsync(session =>
            session.UserId == user.Id && session.TokenHash == tokenHash
        );
        if (session is not null && session.RevokedAt is null)
        {
            session.RevokedAt = DateTime.UtcNow;
        }
        ClearMatchingLegacyRefreshToken(user, tokenHash);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User logged out" });
    }

    [HttpPost("status")]
    [Authorize]
    [EnableRateLimiting("login-limiter")]
    public IActionResult Status()
    {
        return Ok(new { message = "User is logged in." });
    }

    private string GenerateJwtToken(AppUser user, string userRole)
    {
        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["JWT:SigningKey"])
        );
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim("role", userRole),
        };

        var token = new JwtSecurityToken(
            _configuration["JWT:Issuer"],
            _configuration["JWT:Audience"],
            claims,
            expires: DateTime.Now.AddMinutes(_jwtTokenDurationInMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenDto model)
    {
        var modelRefreshToken = model.RefreshToken;
        var tokenHash = HashRefreshToken(modelRefreshToken);
        var session = await _context.RefreshSessions
            .Include(refreshSession => refreshSession.User)
            .FirstOrDefaultAsync(refreshSession => refreshSession.TokenHash == tokenHash);
        if (session is null)
        {
            return Unauthorized(new { message = "Invalid refresh token." });
        }

        var now = DateTime.UtcNow;
        if (session.RevokedAt is not null || session.ExpiresAt <= now || session.User is null)
        {
            if (session.User is not null)
            {
                ClearMatchingLegacyRefreshToken(session.User, tokenHash);
            }
            _context.RefreshSessions.Remove(session);
            await _context.SaveChangesAsync();
            return Unauthorized(new { message = "Invalid refresh token." });
        }

        session.LastUsedAt = now;
        await _context.SaveChangesAsync();

        var userRole =
            (await _userManager.GetRolesAsync(session.User)).FirstOrDefault() ?? "";
        var newJwtToken = GenerateJwtToken(session.User, userRole);

        return Ok(new { token = newJwtToken, refreshToken = modelRefreshToken });
    }

    private static string HashRefreshToken(string refreshToken)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static void ClearMatchingLegacyRefreshToken(AppUser user, string tokenHash)
    {
        if (
            user.RefreshToken is not null
            && HashRefreshToken(user.RefreshToken) == tokenHash
        )
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
        }
    }

    private RefreshToken GenerateRefreshToken()
    {
        var randomNumber = RandomNumberGenerator.GetBytes(64);

        return new RefreshToken
        {
            Token = Convert.ToBase64String(randomNumber),
            ExpiryTime = DateTime.UtcNow.AddDays(_refreshTokenDurationInDays),
        };
    }
}

class RefreshToken
{
    public required string Token { get; set; }
    public required DateTime ExpiryTime { get; set; }
}

record CredentialsErrorResponse(string Code, string Description);
