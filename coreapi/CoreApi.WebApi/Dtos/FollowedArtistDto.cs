using System.ComponentModel.DataAnnotations;

namespace CoreApi.WebApi.Dtos;

public class FollowedArtistRequestDto
{
    public Guid ArtistPublicId { get; set; }

    [Required]
    [StringLength(255, MinimumLength = 1)]
    public required string DisplayName { get; set; }
}

public class FollowedArtistsMergeDto
{
    [Required]
    [MaxLength(250)]
    public required List<FollowedArtistRequestDto> Artists { get; set; }
}

public record FollowedArtistResponseDto(
    Guid ArtistPublicId,
    string DisplayName,
    DateTime CreatedAt
);

public record FollowedArtistsResponseDto(
    string UserId,
    List<FollowedArtistResponseDto> Artists
);
