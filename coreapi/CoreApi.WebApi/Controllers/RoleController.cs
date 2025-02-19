using CoreApi.WebApi.Common;
using Microsoft.AspNetCore.Authorization;

namespace CoreApi.WebApi.Controllers;

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Models;

[ApiController]
[Route("api/role")]
public class RoleController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;

    public RoleController(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet("")]
    [Authorize]
    public async Task<IActionResult> Role()
    {
        var user = _userManager.Users.FirstOrDefault(u =>
            User.Identity != null && u.UserName == User.Identity.Name
        );
        if (user is null)
        {
            return Unauthorized();
        }

        var role = (await _userManager.GetRolesAsync(user)).FirstOrDefault();
        if (role is null)
        {
            return Unauthorized();
        }

        return Ok(new { username = user.UserName, role });
    }

    [HttpGet("init")]
    [Authorize]
    public async Task<IActionResult> SetRoles()
    {
        var permission = await Permissions.ConfirmAdmin(_userManager, User);
        if (permission != PermissionResult.Ok)
        {
            return permission switch
            {
                PermissionResult.Unauthorized => Unauthorized(),
                PermissionResult.Forbidden => Forbid(),
                _ => BadRequest(),
            };
        }

        var users = _userManager.Users.ToList();
        foreach (var u in users)
        {
            var userRole = (await _userManager.GetRolesAsync(u)).FirstOrDefault();
            if (userRole != null)
            {
                continue;
            }

            await _userManager.AddToRoleAsync(u, RoleConstants.NewUser);
        }

        return Ok(new { message = "roles set" });
    }
}
