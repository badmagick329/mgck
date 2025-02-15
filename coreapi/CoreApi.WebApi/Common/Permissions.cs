using System.Security.Claims;
using CoreApi.WebApi.Models;
using Microsoft.AspNetCore.Identity;

namespace CoreApi.WebApi.Common;

public static class Permissions
{
    public static async Task<PermissionResult> ConfirmAdmin(UserManager<AppUser> userManager,
        ClaimsPrincipal claimsPrincipal)
    {
        var user = userManager.Users.FirstOrDefault(u =>
            claimsPrincipal.Identity != null && u.UserName == claimsPrincipal.Identity.Name);
        if (user is null)
        {
            return PermissionResult.Unauthorized;
        }


        var role = (await userManager.GetRolesAsync(user)).FirstOrDefault();
        if (role is null)
        {
            return PermissionResult.Unauthorized;
        }

        if (role != RoleConstants.Admin)
        {
            return PermissionResult.Forbidden;
        }

        return PermissionResult.Ok;
    }
}

public enum PermissionResult
{
    Unauthorized,
    Forbidden,
    Ok
}