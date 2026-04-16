using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OSLMP.API.Data;
using OSLMP.API.Models;
using OSLMP.API.Requests;

namespace OSLMP.API.Controllers;

[ApiController]
[Route("api/people/{personId:guid}/offices")]
[Authorize]
public class PersonOfficesController : ControllerBase
{
    private readonly AppDbContext _db;

    public PersonOfficesController(AppDbContext db) => _db = db;

    /// <summary>Full office history for a person, newest first.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid personId)
    {
        if (!await _db.People.AnyAsync(p => p.Id == personId))
            return NotFound();

        var offices = await _db.PersonOffices
            .Where(o => o.PersonId == personId)
            .OrderByDescending(o => o.StartedAt)
            .ToListAsync();

        return Ok(offices);
    }

    /// <summary>Appoint a person to a lodge office.</summary>
    [HttpPost]
    public async Task<IActionResult> Appoint(Guid personId, [FromBody] AppointOfficeRequest req)
    {
        if (!await _db.People.AnyAsync(p => p.Id == personId))
            return NotFound();

        if (string.IsNullOrWhiteSpace(req.Role))
            return BadRequest(new { message = "Role is required." });

        if (!LodgeRoles.All.Contains(req.Role))
            return BadRequest(new { message = $"'{req.Role}' is not a recognised lodge office." });

        var alreadyActive = await _db.PersonOffices.AnyAsync(
            o => o.PersonId == personId && o.Role == req.Role && o.EndedAt == null);

        if (alreadyActive)
            return Conflict(new { message = $"This person is already serving as {req.Role}." });

        var office = new PersonOffice
        {
            Id = Guid.NewGuid(),
            PersonId = personId,
            Role = req.Role,
            StartedAt = DateTime.UtcNow,
            Notes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes.Trim(),
        };

        _db.PersonOffices.Add(office);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { personId }, office);
    }

    /// <summary>End a person's tenure in an office (sets EndedAt to now).</summary>
    [HttpDelete("{officeId:guid}")]
    public async Task<IActionResult> End(Guid personId, Guid officeId)
    {
        var office = await _db.PersonOffices
            .FirstOrDefaultAsync(o => o.Id == officeId && o.PersonId == personId);

        if (office is null) return NotFound();

        if (office.EndedAt is not null)
            return BadRequest(new { message = "This tenure has already ended." });

        office.EndedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(office);
    }
}
