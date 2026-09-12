using CoreApi.WebApi.Common;
using CoreApi.WebApi.Dtos;
using CoreApi.WebApi.Infrastructure;
using CoreApi.WebApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CoreApi.WebApi.Controllers;

[ApiController]
[Authorize(Policy = RoleConstants.Admin)]
[Route("api/feedback")]
public class FeedbackController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public FeedbackController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("")]
    public async Task<IActionResult> GetFeedbacks()
    {
        var feedbacks = await _context
            .FeedbackComments.OrderByDescending(f => f.CreatedAt)
            .Select(f => new FeedbackCommentResponseDto
            {
                Id = f.Id,
                Comment = f.Comment,
                CreatedBy = f.CreatedBy,
                OriginPath = f.OriginPath,
                CreatedAt = f.CreatedAt,
            })
            .ToListAsync();

        return Ok(feedbacks);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetFeedback(int id)
    {
        var feedback = await _context.FeedbackComments.FindAsync(id);

        if (feedback == null)
        {
            return NotFound();
        }

        var response = new FeedbackCommentResponseDto
        {
            Id = feedback.Id,
            Comment = feedback.Comment,
            CreatedBy = feedback.CreatedBy,
            OriginPath = feedback.OriginPath,
            CreatedAt = feedback.CreatedAt,
        };

        return Ok(response);
    }

    [HttpPost("")]
    [AllowAnonymous]
    public async Task<IActionResult> CreateFeedback([FromBody] FeedbackCommentDto feedbackDto)
    {
        if (string.IsNullOrWhiteSpace(feedbackDto.Comment))
        {
            return BadRequest(new { errors = new[] { "Comment is required" } });
        }

        var feedback = new FeedbackComment
        {
            Comment = feedbackDto.Comment,
            CreatedBy = string.IsNullOrWhiteSpace(feedbackDto.CreatedBy)
                ? "Anonymous"
                : feedbackDto.CreatedBy,
            OriginPath = feedbackDto.OriginPath,
            CreatedAt = DateTime.UtcNow,
        };

        _context.FeedbackComments.Add(feedback);
        await _context.SaveChangesAsync();

        var response = new FeedbackCommentResponseDto
        {
            Id = feedback.Id,
            Comment = feedback.Comment,
            OriginPath = feedback.OriginPath,
            CreatedBy = feedback.CreatedBy,
            CreatedAt = feedback.CreatedAt,
        };

        return CreatedAtAction(nameof(GetFeedback), new { id = feedback.Id }, response);
    }

    [HttpPost("delete")]
    public async Task<IActionResult> DeleteFeedback(
        [FromBody] FeedbackCommentIdDto feedbackCommentIdDto
    )
    {
        var feedback = await _context.FeedbackComments.FindAsync(feedbackCommentIdDto.Id);

        if (feedback == null)
        {
            return NotFound();
        }

        _context.FeedbackComments.Remove(feedback);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
