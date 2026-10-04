using CoreApi.WebApi.Common;
using CoreApi.WebApi.Dtos;
using CoreApi.WebApi.Infrastructure;
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
    private readonly ApplicationDbContext _database;

    public UserController(UserManager<AppUser> userManager, ApplicationDbContext database)
    {
        _userManager = userManager;
        _database = database;
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
        return await ChangeApproval(model.Username, RoleConstants.NewUser, RoleConstants.AcceptedUser, "User approved");
    }

    [HttpPost("manage/unapprove")]
    public async Task<IActionResult> UnApproveUser([FromBody] UsernameDto model)
    {
        return await ChangeApproval(model.Username, RoleConstants.AcceptedUser, RoleConstants.NewUser, "User unapproved");
    }

    private async Task<IActionResult> ChangeApproval(string username, string previousRole, string nextRole, string message)
    {
        // Identity saves each role operation separately; roll back the removal if adding fails.
        await using var transaction = await _database.Database.BeginTransactionAsync();
        var user = await _userManager.FindByNameAsync(username);
        if (user is null)
        {
            return BadRequest("User not found");
        }

        var roles = await _userManager.GetRolesAsync(user);
        // Approval manages ordinary users only. Mixed roles require explicit repair.
        if (roles.Count != 1 || roles[0] != previousRole)
        {
            return Conflict(new[]
            {
                new IdentityError
                {
                    Code = "ApprovalStateConflict",
                    Description = "User is not in the expected approval state. Admin and mixed-role accounts cannot be changed here.",
                },
            });
        }

        var removeResult = await _userManager.RemoveFromRoleAsync(user, previousRole);
        if (!removeResult.Succeeded)
        {
            return Conflict(removeResult.Errors);
        }
        var addResult = await _userManager.AddToRoleAsync(user, nextRole);
        if (!addResult.Succeeded)
        {
            return Conflict(addResult.Errors);
        }

        await transaction.CommitAsync();
        return Ok(new { message });
    }

    [HttpPost("manage/delete")]
    public async Task<IActionResult> DeleteUser()
    {
        await using var transaction = await _database.Database.BeginTransactionAsync();
        var newUsers = await _userManager.GetUsersInRoleAsync(RoleConstants.NewUser);

        foreach (var newUser in newUsers)
        {
            var roles = await _userManager.GetRolesAsync(newUser);
            // Never interpret an administrator or another mixed-role account as disposable.
            if (roles.Count != 1 || roles[0] != RoleConstants.NewUser)
            {
                continue;
            }
            var result = await _userManager.DeleteAsync(newUser);
            if (!result.Succeeded)
            {
                return Conflict(result.Errors);
            }
        }

        await transaction.CommitAsync();
        return Ok(new { message = "User deleted" });
    }
}

record UserAndRole(string Username, string Role);
