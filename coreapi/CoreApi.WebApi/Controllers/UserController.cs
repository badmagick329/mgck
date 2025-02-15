using CoreApi.WebApi.Common;
using CoreApi.WebApi.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace CoreApi.WebApi.Controllers;

using Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/users")]
public class UserController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;

    public UserController(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet("")]
    [Authorize]
    public async Task<IActionResult> Users()
    {
        var unauthorized = await UserUnauthorizedResult();
        if (unauthorized is not null)
        {
            return unauthorized;
        }

        var users = await _userManager.Users.OrderBy(u => u.UserName).ToListAsync();
        var usersAndRoles = new List<UserAndRole>();
        foreach (var u in users)
        {
            var r = (await _userManager.GetRolesAsync(u)).FirstOrDefault();
            if (u.UserName is null || r is null)
            {
                continue;
            }

            usersAndRoles.Add(new UserAndRole(u.UserName, r));
        }


        return Ok(usersAndRoles);
    }

    [HttpPost("manage/approve")]
    [Authorize]
    public async Task<IActionResult> ApproveUser([FromBody] UsernameDto model)
    {
        var unauthorized = await UserUnauthorizedResult();
        if (unauthorized is not null)
        {
            return unauthorized;
        }

        var user = await _userManager.FindByNameAsync(model.Username);
        if (user is null)
        {
            return BadRequest("User not found");
        }

        var removeResult = await _userManager.RemoveFromRoleAsync(user, RoleConstants.NewUser);
        var addResult = await _userManager.AddToRoleAsync(user, RoleConstants.AcceptedUser);

        if (!addResult.Succeeded)
        {
            return BadRequest(addResult.Errors);
        }


        return Ok(new { message = "User approved" });
    }

    [HttpPost("manage/unapprove")]
    [Authorize]
    public async Task<IActionResult> UnApproveUser([FromBody] UsernameDto model)
    {
        var unauthorized = await UserUnauthorizedResult();
        if (unauthorized is not null)
        {
            return unauthorized;
        }

        var user = await _userManager.FindByNameAsync(model.Username);
        if (user is null)
        {
            return BadRequest("User not found");
        }

        var removeResult = await _userManager.RemoveFromRoleAsync(user, RoleConstants.AcceptedUser);
        var addResult = await _userManager.AddToRoleAsync(user, RoleConstants.NewUser);
        if (!addResult.Succeeded)
        {
            return BadRequest(addResult.Errors);
        }

        return Ok(new { message = "User unapproved" });
    }

    [HttpPost("manage/delete")]
    [Authorize]
    public async Task<IActionResult> DeleteUser()
    {
        var unauthorized = await UserUnauthorizedResult();
        if (unauthorized is not null)
        {
            return unauthorized;
        }

        var newUsers = await _userManager.GetUsersInRoleAsync(RoleConstants.NewUser);

        foreach (var newUser in newUsers)
        {
            await _userManager.DeleteAsync(newUser);
        }

        return Ok(new { message = "User deleted" });
    }

    private async Task<IActionResult?> UserUnauthorizedResult()
    {
        var permission = await Permissions.ConfirmAdmin(_userManager, User);
        if (permission != PermissionResult.Ok)
        {
            return permission switch
            {
                PermissionResult.Unauthorized => Unauthorized(),
                PermissionResult.Forbidden => Forbid(),
                _ => BadRequest()
            };
        }

        return null;
    }
}

record UserAndRole(string Username, string Role);