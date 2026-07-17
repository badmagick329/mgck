using System.ComponentModel.DataAnnotations;

namespace CoreApi.WebApi.Dtos;

public class RefreshTokenDto
{
    [Required]
    [StringLength(256, MinimumLength = 1)]
    public required string RefreshToken { get; set; }
}
