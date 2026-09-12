using CoreApi.WebApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace CoreApi.WebApi.Common;

public sealed class AdminRequirement : IAuthorizationRequirement { }

/// <summary>Check current membership so revoking admin access takes effect before tokens expire.</summary>
public sealed class AdminAuthorizationHandler(UserManager<AppUser> userManager)
    : AuthorizationHandler<AdminRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        AdminRequirement requirement
    )
    {
        var user = await userManager.GetUserAsync(context.User);
        if (user is not null && await userManager.IsInRoleAsync(user, RoleConstants.Admin))
        {
            context.Succeed(requirement);
        }
    }
}
