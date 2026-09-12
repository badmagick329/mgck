using CoreApi.WebApi.Common;
using CoreApi.WebApi.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace CoreApi.WebApi.Controllers;

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Models;

[ApiController]
[Authorize(Policy = RoleConstants.Admin)]
[Route("api/users")]
public class UserController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;

    public UserController(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet("")]
    public async Task<IActionResult> Users()
    {
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
    public async Task<IActionResult> ApproveUser([FromBody] UsernameDto model)
    {
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
    public async Task<IActionResult> UnApproveUser([FromBody] UsernameDto model)
    {
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
    public async Task<IActionResult> DeleteUser()
    {
        var newUsers = await _userManager.GetUsersInRoleAsync(RoleConstants.NewUser);

        foreach (var newUser in newUsers)
        {
            await _userManager.DeleteAsync(newUser);
        }

        return Ok(new { message = "User deleted" });
    }
}

record UserAndRole(string Username, string Role);
