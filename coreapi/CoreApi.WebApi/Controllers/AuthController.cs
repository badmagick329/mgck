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

using Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

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

    public AuthController(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager,
        IConfiguration configuration, ApplicationDbContext context)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _context = context;
        _jwtTokenDurationInMinutes = int.Parse(_configuration["JWT:JWTTokenDurationInMinutes"] ?? "");
        _refreshTokenDurationInDays = int.Parse(_configuration["JWT:RefreshTokenDurationInDays"] ?? "");
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto model)
    {
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
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        var user = await _userManager.FindByNameAsync(model.Username);
        Console.WriteLine($"Attempted login by {model.Username}");
        if (user is null)
        {
            Console.WriteLine($"User {model.Username} not found");
            var errorResponse = new CredentialsErrorResponse("Invalid Credentials", "Credentials are invalid.");
            return Unauthorized(new[] { errorResponse });
        }

        Console.WriteLine($"User {model.Username} found. signing in");
        var signInResult = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);
        if (!signInResult.Succeeded)
        {
            Console.WriteLine($"User {model.Username} could not sign in");
            var errorResponse = new CredentialsErrorResponse("Invalid Credentials", "Credentials are invalid.");
            return Unauthorized(new[] { errorResponse });
        }

        Console.WriteLine($"User {model.Username} signed in successfully. generating token");
        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();
        user.RefreshToken = refreshToken.Token;
        user.RefreshTokenExpiryTime = refreshToken.ExpiryTime;
        Console.WriteLine($"User {model.Username} token generated. updating user");
        await _userManager.UpdateAsync(user);
        Console.WriteLine($"User {model.Username} updated. returning token");

        return Ok(new { token, refreshToken = user.RefreshToken });
    }

    [HttpPost("status")]
    [Authorize]
    public IActionResult Status()
    {
        return Ok(new { message = "User is logged in." });
    }

    [HttpGet("role")]
    [Authorize]
    public async Task<IActionResult> Role()
    {
        var user = _userManager.Users.FirstOrDefault(u => User.Identity != null && u.UserName == User.Identity.Name);
        if (user is null)
        {
            return Unauthorized();
        }


        var role = (await _userManager.GetRolesAsync(user)).FirstOrDefault();
        if (role is null)
        {
            return Unauthorized();
        }


        return Ok(new { username = user.UserName, role });
    }

    [HttpGet("setroles")]
    [Authorize]
    public async Task<IActionResult> SetRoles()
    {
        var user = _userManager.Users.FirstOrDefault(u => User.Identity != null && u.UserName == User.Identity.Name);
        if (user is null)
        {
            return Unauthorized();
        }

        var role = (await _userManager.GetRolesAsync(user)).FirstOrDefault();
        if (role is null)
        {
            return Unauthorized();
        }

        if (role != RoleConstants.Admin)
        {
            return Forbid();
        }

        var users = _userManager.Users.ToList();
        foreach (var u in users)
        {
            var userRole = (await _userManager.GetRolesAsync(u)).FirstOrDefault();
            if (userRole != null)
            {
                continue;
            }

            await _userManager.AddToRoleAsync(u, RoleConstants.NewUser);
        }

        return Ok(new { message = "roles set" });
    }

    private string GenerateJwtToken(AppUser user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:SigningKey"]));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName),
        };

        var token = new JwtSecurityToken(_configuration["JWT:Issuer"],
            _configuration["JWT:Audience"],
            claims,
            expires: DateTime.Now.AddMinutes(_jwtTokenDurationInMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenDto model)
    {
        var modelRefreshToken = model.RefreshToken;

        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.RefreshToken == modelRefreshToken);

        if (user?.RefreshToken == null ||
            (await IsRefreshTokenExpired(user.RefreshToken)))
        {
            return Unauthorized(new { message = "Invalid refresh token." });
        }


        var newJwtToken = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();
        user.RefreshToken = refreshToken.Token;
        user.RefreshTokenExpiryTime = refreshToken.ExpiryTime;
        await _userManager.UpdateAsync(user);

        return Ok(new { token = newJwtToken, refreshToken = user.RefreshToken });
    }

    private async Task<bool> IsRefreshTokenExpired(string refreshToken)
    {
        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);
        if (user?.RefreshTokenExpiryTime == null)
        {
            return true;
        }

        return user.RefreshTokenExpiryTime < DateTime.UtcNow;
    }

    private RefreshToken GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomNumber);
        }

        return new RefreshToken
        {
            Token = Convert.ToBase64String(randomNumber),
            ExpiryTime = DateTime.UtcNow.AddDays(_refreshTokenDurationInDays)
        };
    }
}

class RefreshToken
{
    public required string Token { get; set; }
    public required DateTime ExpiryTime { get; set; }
}

record CredentialsErrorResponse(string Code, string Description);