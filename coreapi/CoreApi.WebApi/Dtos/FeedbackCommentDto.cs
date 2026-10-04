using System.ComponentModel.DataAnnotations;

namespace CoreApi.WebApi.Dtos;

public class FeedbackCommentDto
{
    [Required, StringLength(4000)]
    public required string Comment { get; set; }
    [Required, StringLength(2048)]
    public required string OriginPath { get; set; }
    [StringLength(200)]
    public string? CreatedBy { get; set; }
}

public class FeedbackPageQuery
{
    [Range(1, int.MaxValue)]
    public int? BeforeId { get; set; }
}

public class FeedbackPageResponseDto
{
    public required List<FeedbackCommentResponseDto> Feedbacks { get; set; }
    public int? NextCursor { get; set; }
}

public class FeedbackCommentResponseDto
{
    public int Id { get; set; }
    public string Comment { get; set; }
    public string CreatedBy { get; set; }
    public string OriginPath { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class FeedbackCommentIdDto
{
    public int Id { get; set; }
}
