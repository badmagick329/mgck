namespace CoreApi.WebApi.Dtos;

public class FeedbackCommentDto
{
    public required string Comment { get; set; }
    public required string OriginPath { get; set; }
    public string? CreatedBy { get; set; }
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
