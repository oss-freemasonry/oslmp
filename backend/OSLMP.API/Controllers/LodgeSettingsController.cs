using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OSLMP.API.Data;
using OSLMP.API.Requests;

namespace OSLMP.API.Controllers;

[ApiController]
[Route("api/lodge-settings")]
public class LodgeSettingsController : ControllerBase
{
    private readonly AppDbContext _db;

    public LodgeSettingsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Get()
    {
        var settings = await _db.LodgeSettings.FirstOrDefaultAsync();
        if (settings is null) return NotFound();

        return Ok(new
        {
            settings.LodgeName,
            settings.LogoUrl,
            settings.Summary,
            settings.ConsecratedAt,
            settings.ThemePrimaryColor,
            settings.ThemeSecondaryColor,
            settings.ThemeAccentColor,
            settings.ThemeFont,
        });
    }

    [HttpPut]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update([FromBody] UpdateLodgeSettingsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.LodgeName))
            return BadRequest(new { message = "Lodge name is required." });

        var settings = await _db.LodgeSettings.FirstOrDefaultAsync();
        if (settings is null) return NotFound();

        settings.LodgeName           = request.LodgeName.Trim();
        settings.LogoUrl             = string.IsNullOrWhiteSpace(request.LogoUrl) ? null : request.LogoUrl.Trim();
        settings.Summary             = string.IsNullOrWhiteSpace(request.Summary) ? null : request.Summary.Trim();
        settings.ConsecratedAt       = request.ConsecratedAt;
        settings.ThemePrimaryColor   = string.IsNullOrWhiteSpace(request.ThemePrimaryColor)   ? null : request.ThemePrimaryColor.Trim();
        settings.ThemeSecondaryColor = string.IsNullOrWhiteSpace(request.ThemeSecondaryColor) ? null : request.ThemeSecondaryColor.Trim();
        settings.ThemeAccentColor    = string.IsNullOrWhiteSpace(request.ThemeAccentColor)    ? null : request.ThemeAccentColor.Trim();
        settings.ThemeFont           = string.IsNullOrWhiteSpace(request.ThemeFont)           ? null : request.ThemeFont.Trim();
        settings.UpdatedAt           = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            settings.LodgeName,
            settings.LogoUrl,
            settings.Summary,
            settings.ConsecratedAt,
            settings.ThemePrimaryColor,
            settings.ThemeSecondaryColor,
            settings.ThemeAccentColor,
            settings.ThemeFont,
        });
    }
}
