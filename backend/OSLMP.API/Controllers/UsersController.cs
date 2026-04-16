using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OSLMP.API.Data;
using OSLMP.API.Models;
using OSLMP.API.Requests;
using OSLMP.API.Services;

namespace OSLMP.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "admin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly PasswordService _passwordService;

    public UsersController(AppDbContext db, PasswordService passwordService)
    {
        _db = db;
        _passwordService = passwordService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _db.Users
            .OrderBy(u => u.Username)
            .Select(u => new { u.Id, u.Username, u.Role, u.CreatedAt })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Username and password are required." });

        var username = request.Username.Trim().ToLower();

        if (username == "admin")
            return Conflict(new { message = "The username 'admin' is reserved." });

        if (await _db.Users.AnyAsync(u => u.Username == username))
            return Conflict(new { message = $"User '{username}' already exists." });

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            PasswordHash = _passwordService.Hash(request.Password),
            Role = string.IsNullOrWhiteSpace(request.Role) ? "member" : request.Role.Trim().ToLower(),
            CreatedAt = DateTime.UtcNow,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { }, new
        {
            user.Id,
            user.Username,
            user.Role,
            user.CreatedAt,
        });
    }

    [HttpPut("{id:guid}/password")]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters." });

        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        user.PasswordHash = _passwordService.Hash(request.NewPassword);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        var currentUsername = User.Identity?.Name;
        if (user.Username == currentUsername)
            return BadRequest(new { message = "You cannot delete your own account." });

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
