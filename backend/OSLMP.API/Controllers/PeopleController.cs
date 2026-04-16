using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OSLMP.API.Data;
using OSLMP.API.Models;
using OSLMP.API.Requests;

namespace OSLMP.API.Controllers;

[ApiController]
[Route("api/people")]
[Authorize]
public class PeopleController : ControllerBase
{
    private readonly AppDbContext _db;

    public PeopleController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var people = await _db.People
            .OrderBy(p => p.LastName).ThenBy(p => p.FirstName)
            .Select(p => new
            {
                p.Id, p.FirstName, p.LastName,
                p.Type, p.Status,
                p.Email, p.Phone,
                p.CreatedAt,
                ActiveOffices = _db.PersonOffices
                    .Where(o => o.PersonId == p.Id && o.EndedAt == null)
                    .Select(o => o.Role)
                    .ToList(),
            })
            .ToListAsync();

        return Ok(people);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var person = await _db.People.FindAsync(id);
        return person is null ? NotFound() : Ok(person);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePersonRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.FirstName) || string.IsNullOrWhiteSpace(req.LastName))
            return BadRequest(new { message = "First name and last name are required." });

        var person = new Person
        {
            Id = Guid.NewGuid(),
            FirstName = req.FirstName.Trim(),
            LastName = req.LastName.Trim(),
            Type = req.Type,
            Status = PersonStatus.Active,
            Email = string.IsNullOrWhiteSpace(req.Email) ? null : req.Email.Trim(),
            Phone = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone.Trim(),
            CreatedAt = DateTime.UtcNow,
        };

        _db.People.Add(person);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = person.Id }, person);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePersonRequest req)
    {
        var person = await _db.People.FindAsync(id);
        if (person is null) return NotFound();

        if (string.IsNullOrWhiteSpace(req.FirstName) || string.IsNullOrWhiteSpace(req.LastName))
            return BadRequest(new { message = "First name and last name are required." });

        person.FirstName = req.FirstName.Trim();
        person.LastName = req.LastName.Trim();
        person.Type = req.Type;
        person.Status = req.Status;
        person.Email = string.IsNullOrWhiteSpace(req.Email) ? null : req.Email.Trim();
        person.Phone = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone.Trim();
        person.AddressLine1 = string.IsNullOrWhiteSpace(req.AddressLine1) ? null : req.AddressLine1.Trim();
        person.AddressLine2 = string.IsNullOrWhiteSpace(req.AddressLine2) ? null : req.AddressLine2.Trim();
        person.City = string.IsNullOrWhiteSpace(req.City) ? null : req.City.Trim();
        person.County = string.IsNullOrWhiteSpace(req.County) ? null : req.County.Trim();
        person.Postcode = string.IsNullOrWhiteSpace(req.Postcode) ? null : req.Postcode.Trim();
        person.Notes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes.Trim();

        await _db.SaveChangesAsync();
        return Ok(person);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var person = await _db.People.FindAsync(id);
        if (person is null) return NotFound();

        _db.People.Remove(person);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
