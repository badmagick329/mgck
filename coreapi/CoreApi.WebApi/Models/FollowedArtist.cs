namespace CoreApi.WebApi.Models;

public class FollowedArtist
{
    public long Id { get; set; }
    public required string UserId { get; set; }
    public Guid ArtistPublicId { get; set; }
    public required string DisplayName { get; set; }
    public DateTime CreatedAt { get; set; }

    public AppUser? User { get; set; }
}
