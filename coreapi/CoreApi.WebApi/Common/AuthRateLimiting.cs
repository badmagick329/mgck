using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace CoreApi.WebApi.Common;

public static class AuthRateLimiting
{
    public const string LoginPolicy = "auth-login";
    public const string RegistrationPolicy = "auth-registration";

    public static IServiceCollection AddAuthenticationRateLimits(this IServiceCollection services)
    {
        return services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            // Core's caller is Next, not the browser. Bound expensive work independently
            // of usernames and forwarding headers; client admission happens in Next.
            options.AddSlidingWindowLimiter(LoginPolicy, limiter =>
            {
                limiter.PermitLimit = 60;
                limiter.Window = TimeSpan.FromMinutes(1);
                limiter.SegmentsPerWindow = 6;
                limiter.QueueLimit = 0;
            });
            options.AddSlidingWindowLimiter(RegistrationPolicy, limiter =>
            {
                limiter.PermitLimit = 10;
                limiter.Window = TimeSpan.FromHours(1);
                limiter.SegmentsPerWindow = 6;
                limiter.QueueLimit = 0;
            });
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            {
                var policy = context.GetEndpoint()?.Metadata.GetMetadata<EnableRateLimitingAttribute>()?.PolicyName;
                return policy is LoginPolicy or RegistrationPolicy
                    ? RateLimitPartition.GetConcurrencyLimiter("auth", _ => new ConcurrencyLimiterOptions
                    {
                        PermitLimit = 4,
                        QueueLimit = 0,
                    })
                    : RateLimitPartition.GetNoLimiter("other");
            });
        });
    }
}
