using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OSLMP.API.Data;
using OSLMP.API.Models;
using OSLMP.API.Requests;
using OSLMP.API.Services;

namespace OSLMP.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly AppDbContext _db;
    private readonly TokenService _tokenService;
    private readonly PasswordService _passwordService;

    public AuthController(
        IConfiguration configuration,
        AppDbContext db,
        TokenService tokenService,
        PasswordService passwordService)
    {
        _configuration = configuration;
        _db = db;
        _tokenService = tokenService;
        _passwordService = passwordService;
    }

    /// <summary>
    /// Authenticate and receive a JWT. The admin account configured in appsettings
    /// is always accepted; other accounts are looked up from the database.
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Username and password are required." });

        var adminPassword = _configuration["Admin:Password"]!;

        if (string.Equals(request.Username, "admin", StringComparison.OrdinalIgnoreCase)
            && request.Password == adminPassword)
        {
            var adminToken = _tokenService.GenerateToken("admin", "admin", "admin");
            return Ok(new { token = adminToken });
        }

        var user = await _db.Users.FirstOrDefaultAsync(
            u => u.Username == request.Username.Trim().ToLower());

        if (user is null || !_passwordService.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid credentials." });

        var token = _tokenService.GenerateToken(user.Id.ToString(), user.Username, user.Role);
        return Ok(new { token });
    }

    /// <summary>
    /// Returns the identity of the currently authenticated user.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        return Ok(new
        {
            id = User.FindFirstValue(ClaimTypes.NameIdentifier),
            username = User.FindFirstValue(ClaimTypes.Name),
            role = User.FindFirstValue(ClaimTypes.Role),
        });
    }

    /// <summary>
    /// Allows a database user to change their own password.
    /// The built-in admin account cannot use this endpoint.
    /// </summary>
    [HttpPut("password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);

        if (string.Equals(username, "admin", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "The admin account password must be changed in configuration." });

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            return BadRequest(new { message = "New password must be at least 6 characters." });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null) return NotFound();

        if (!_passwordService.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Current password is incorrect." });

        user.PasswordHash = _passwordService.Hash(request.NewPassword);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
