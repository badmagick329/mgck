namespace CoreApi.WebApi.Models;

public class FeedbackComment
{
    public int Id { get; set; }
    public required string Comment { get; set; }
    public required string CreatedBy { get; set; }
    public required string OriginPath { get; set; }
    public DateTime CreatedAt { get; set; }
}
