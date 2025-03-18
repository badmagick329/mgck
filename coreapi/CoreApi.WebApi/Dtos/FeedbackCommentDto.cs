namespace CoreApi.WebApi.Dtos;

public class FeedbackCommentDto
{
    public required string Comment { get; set; }
    public string? CreatedBy { get; set; } // Optional, can be anonymous
}

public class FeedbackCommentResponseDto
{
    public int Id { get; set; }
    public string Comment { get; set; }
    public string CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}
