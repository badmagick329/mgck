using Microsoft.AspNetCore.RateLimiting;

namespace CoreApi.WebApi.Common;

public static class FeedbackRateLimiting
{
    public const string CreationPolicy = "feedback-create";

    public static IServiceCollection AddFeedbackRateLimits(this IServiceCollection services)
    {
        return services.AddRateLimiter(options =>
            // Next supplies shared client/aggregate admission. Core also bounds
            // anonymous writes independently of forwarding headers per process.
            options.AddSlidingWindowLimiter(CreationPolicy, limiter =>
            {
                limiter.PermitLimit = 30;
                limiter.Window = TimeSpan.FromMinutes(30);
                limiter.SegmentsPerWindow = 6;
                limiter.QueueLimit = 0;
            }));
    }
}
