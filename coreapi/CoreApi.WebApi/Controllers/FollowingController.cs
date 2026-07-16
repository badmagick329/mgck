using CoreApi.WebApi.Dtos;
using CoreApi.WebApi.Infrastructure;
using CoreApi.WebApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CoreApi.WebApi.Controllers;

[ApiController]
[Authorize]
[Route("api/kpop/following")]
public class FollowingController : ControllerBase
{
    private const int MaxFollowedArtists = 250;
    private readonly ApplicationDbContext _context;
    private readonly UserManager<AppUser> _userManager;

    public FollowingController(
        ApplicationDbContext context,
        UserManager<AppUser> userManager
    )
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetFollowing()
    {
        var user = await CurrentUser();
        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(await ResponseFor(user.Id));
    }

    [HttpPost]
    public async Task<IActionResult> Follow([FromBody] FollowedArtistRequestDto artist)
    {
        var user = await CurrentUser();
        if (user is null)
        {
            return Unauthorized();
        }
        if (!IsValidArtist(artist))
        {
            return BadRequest(new { error = "Invalid artist." });
        }

        var existing = await _context.FollowedArtists.SingleOrDefaultAsync(f =>
            f.UserId == user.Id && f.ArtistPublicId == artist.ArtistPublicId
        );
        if (existing is not null)
        {
            existing.DisplayName = artist.DisplayName.Trim();
            await _context.SaveChangesAsync();
            return Ok(await ResponseFor(user.Id));
        }

        var count = await _context.FollowedArtists.CountAsync(f => f.UserId == user.Id);
        if (count >= MaxFollowedArtists)
        {
            return Conflict(new { error = "Follow limit reached." });
        }

        var followedArtist = new FollowedArtist
        {
            UserId = user.Id,
            ArtistPublicId = artist.ArtistPublicId,
            DisplayName = artist.DisplayName.Trim(),
            CreatedAt = DateTime.UtcNow,
        };
        _context.FollowedArtists.Add(followedArtist);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetFollowing), await ResponseFor(user.Id));
    }

    [HttpDelete("{artistPublicId:guid}")]
    public async Task<IActionResult> Unfollow(Guid artistPublicId)
    {
        var user = await CurrentUser();
        if (user is null)
        {
            return Unauthorized();
        }

        var followedArtist = await _context.FollowedArtists.SingleOrDefaultAsync(f =>
            f.UserId == user.Id && f.ArtistPublicId == artistPublicId
        );
        if (followedArtist is not null)
        {
            _context.FollowedArtists.Remove(followedArtist);
            await _context.SaveChangesAsync();
        }
        return NoContent();
    }

    [HttpPost("merge")]
    public async Task<IActionResult> Merge([FromBody] FollowedArtistsMergeDto request)
    {
        var user = await CurrentUser();
        if (user is null)
        {
            return Unauthorized();
        }
        if (request.Artists is null || request.Artists.Any(artist => !IsValidArtist(artist)))
        {
            return BadRequest(new { error = "Invalid artists." });
        }

        var incoming = request.Artists
            .GroupBy(artist => artist.ArtistPublicId)
            .Select(group => group.Last())
            .ToList();
        var existing = await _context
            .FollowedArtists.Where(followedArtist => followedArtist.UserId == user.Id)
            .ToListAsync();
        if (existing.Count + incoming.Count(artist =>
                existing.All(current => current.ArtistPublicId != artist.ArtistPublicId)
            ) > MaxFollowedArtists)
        {
            return Conflict(new { error = "Follow limit reached." });
        }

        var now = DateTime.UtcNow;
        foreach (var artist in incoming)
        {
            var current = existing.SingleOrDefault(followedArtist =>
                followedArtist.ArtistPublicId == artist.ArtistPublicId
            );
            if (current is null)
            {
                _context.FollowedArtists.Add(
                    new FollowedArtist
                    {
                        UserId = user.Id,
                        ArtistPublicId = artist.ArtistPublicId,
                        DisplayName = artist.DisplayName.Trim(),
                        CreatedAt = now,
                    }
                );
            }
            else
            {
                current.DisplayName = artist.DisplayName.Trim();
            }
        }
        await _context.SaveChangesAsync();
        return Ok(await ResponseFor(user.Id));
    }

    private async Task<AppUser?> CurrentUser() => await _userManager.GetUserAsync(User);

    private async Task<FollowedArtistsResponseDto> ResponseFor(string userId)
    {
        var artists = await _context
            .FollowedArtists.Where(followedArtist => followedArtist.UserId == userId)
            .OrderBy(followedArtist => followedArtist.CreatedAt)
            .Select(followedArtist => ToResponse(followedArtist))
            .ToListAsync();
        return new FollowedArtistsResponseDto(userId, artists);
    }

    private static bool IsValidArtist(FollowedArtistRequestDto artist) =>
        artist.ArtistPublicId != Guid.Empty && !string.IsNullOrWhiteSpace(artist.DisplayName);

    private static FollowedArtistResponseDto ToResponse(FollowedArtist artist) =>
        new(artist.ArtistPublicId, artist.DisplayName, artist.CreatedAt);
}
