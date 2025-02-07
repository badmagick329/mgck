using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using CoreApi.WebApi.Dtos;
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
    private readonly int _jwtTokenDurationInMinutes;
    private readonly int _refreshTokenDurationInDays;

    public AuthController(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _jwtTokenDurationInMinutes = int.Parse(_configuration["JWT:JWTTokenDurationInMinutes"] ?? "");
        _refreshTokenDurationInDays = int.Parse(_configuration["JWT:RefreshTokenDurationInDays"] ?? "");
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto model)
    {
        var user = new AppUser { UserName = model.Username };
        var result = await _userManager.CreateAsync(user, model.Password);

        if (result.Succeeded)
        {
            return Ok(new { message = "Registration successful" });
        }

        return BadRequest(result.Errors);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        var user = await _userManager.FindByNameAsync(model.Username);
        if (user is null)
        {
            var errorResponse = new CredentialsErrorResponse("Invalid Credentials", "Credentials are invalid.");
            return Unauthorized(new[] { errorResponse });
        }

        var signInResult = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);
        if (!signInResult.Succeeded)
        {
            var errorResponse = new CredentialsErrorResponse("Invalid Credentials", "Credentials are invalid.");
            return Unauthorized(new[] { errorResponse });
        }

        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();
        user.RefreshToken = refreshToken.Token;
        user.RefreshTokenExpiryTime = refreshToken.ExpiryTime;
        await _userManager.UpdateAsync(user);

        return Ok(new { token, refreshToken = user.RefreshToken });
    }

    [HttpPost("status")]
    [Authorize]
    public IActionResult Status()
    {
        return Ok(new { message = "User is logged in." });
    }

    private string GenerateJwtToken(AppUser user)
    {
        Console.WriteLine($"Generating new token for user {user.UserName}");
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

        Console.WriteLine($"Expires at {token.ValidTo}");
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenDto model)
    {
        Console.WriteLine($"Got dto with refresh token {model.RefreshToken}");
        var modelRefreshToken = model.RefreshToken;

        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.RefreshToken == modelRefreshToken);

        if (user?.RefreshToken == null ||
            (await IsRefreshTokenExpired(user.RefreshToken)))
        {
            return Unauthorized(new { message = "Invalid refresh token." });
        }

        Console.WriteLine($"Refreshing token for user {user.UserName}");

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