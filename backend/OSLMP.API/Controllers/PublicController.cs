using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OSLMP.API.Data;
using OSLMP.API.Models;
using OSLMP.API.Requests;

namespace OSLMP.API.Controllers;

[ApiController]
[Route("api/public")]
[AllowAnonymous]
public class PublicController : ControllerBase
{
    private readonly AppDbContext _db;

    public PublicController(AppDbContext db) => _db = db;

    [HttpGet("lodge")]
    public async Task<IActionResult> GetLodge()
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

    [HttpGet("events")]
    public async Task<IActionResult> GetUpcomingEvents([FromQuery] int limit = 8)
    {
        var today = DateTime.UtcNow.Date;

        var events = await _db.Meetings
            .Where(m => m.Date >= today)
            .OrderBy(m => m.Date)
            .Take(Math.Clamp(limit, 1, 50))
            .Select(m => new
            {
                m.Id,
                m.Type,
                m.Title,
                m.Date,
                m.Time,
                m.Location,
                m.Summary,
                m.DiningEnabled,
                m.DiningTime,
                m.DiningLocation,
            })
            .ToListAsync();

        return Ok(events);
    }

    [HttpGet("events/{id:guid}")]
    public async Task<IActionResult> GetEvent(Guid id)
    {
        var meeting = await _db.Meetings
            .Include(m => m.DiningCourses.OrderBy(c => c.SortOrder))
                .ThenInclude(c => c.Options.OrderBy(o => o.SortOrder))
            .Include(m => m.DiningUpgrades)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (meeting is null) return NotFound();

        return Ok(new
        {
            meeting.Id,
            meeting.Type,
            meeting.Title,
            meeting.Date,
            meeting.Time,
            meeting.Location,
            meeting.Summary,
            meeting.DiningEnabled,
            meeting.DiningTime,
            meeting.DiningLocation,
            meeting.DiningPrice,
            meeting.DiningNotes,
            DiningCourses = meeting.DiningCourses.Select(c => new
            {
                c.Id,
                c.Name,
                Options = c.Options.Select(o => new { o.Id, o.Name, o.Supplement }),
            }),
            DiningUpgrades = meeting.DiningUpgrades.Select(u => new
            {
                u.Id,
                u.Name,
                u.Price,
            }),
        });
    }

    [HttpPost("events/{id:guid}/rsvp")]
    public async Task<IActionResult> Rsvp(Guid id, [FromBody] PublicRsvpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Name is required." });
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { message = "Email address is required." });
        if (request.Status != AttendeeStatus.Attending && request.Status != AttendeeStatus.Apologies)
            return BadRequest(new { message = "Status must be Attending or Apologies." });

        var meeting = await _db.Meetings
            .Include(m => m.DiningCourses).ThenInclude(c => c.Options)
            .Include(m => m.DiningUpgrades)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (meeting is null) return NotFound();

        var email = request.Email.Trim().ToLowerInvariant();

        // Validate dining selections when attending + dining is enabled
        bool diningAttending = request.DiningAttending && meeting.DiningEnabled && request.Status == AttendeeStatus.Attending;
        if (diningAttending)
        {
            var coursesWithOptions = meeting.DiningCourses
                .Where(c => c.Options.Any())
                .Select(c => c.Id)
                .ToHashSet();

            var selectedCourses = request.CourseSelections
                .Select(cs => cs.CourseId)
                .ToHashSet();

            if (!coursesWithOptions.SetEquals(selectedCourses))
                return BadRequest(new { message = "A selection is required for every course." });

            foreach (var sel in request.CourseSelections)
            {
                var course = meeting.DiningCourses.FirstOrDefault(c => c.Id == sel.CourseId);
                if (course is null || !course.Options.Any(o => o.Id == sel.OptionId))
                    return BadRequest(new { message = "Invalid course selection." });
            }

            var validUpgradeIds = meeting.DiningUpgrades.Select(u => u.Id).ToHashSet();
            if (request.UpgradeSelections.Any(uid => !validUpgradeIds.Contains(uid)))
                return BadRequest(new { message = "Invalid upgrade selection." });
        }

        // Find person by email
        var person = await _db.People
            .FirstOrDefaultAsync(p => p.Email != null && p.Email.ToLower() == email);

        // If they already exist, check for an existing RSVP before doing anything else
        if (person is not null && !request.Force)
        {
            var existingCheck = await _db.MeetingAttendees
                .FirstOrDefaultAsync(a => a.MeetingId == id && a.PersonId == person.Id);

            if (existingCheck is not null)
            {
                return Conflict(new
                {
                    alreadyRsvpd = true,
                    status       = existingCheck.Status,
                    personName   = $"{person.FirstName} {person.LastName}".Trim(),
                });
            }
        }

        // Create guest record if no person was found
        bool isNewGuest = false;
        if (person is null)
        {
            var nameParts = request.Name.Trim().Split(' ', 2);
            person = new Person
            {
                Id        = Guid.NewGuid(),
                FirstName = nameParts[0],
                LastName  = nameParts.Length > 1 ? nameParts[1] : "",
                Email     = request.Email.Trim(),
                Type      = PersonType.Guest,
                Status    = PersonStatus.Active,
                CreatedAt = DateTime.UtcNow,
            };
            _db.People.Add(person);
            isNewGuest = true;
        }

        // Upsert attendee
        var attendee = await _db.MeetingAttendees
            .Include(a => a.CourseSelections)
            .Include(a => a.UpgradeSelections)
            .FirstOrDefaultAsync(a => a.MeetingId == id && a.PersonId == person.Id);

        if (attendee is null)
        {
            attendee = new MeetingAttendee
            {
                Id        = Guid.NewGuid(),
                MeetingId = id,
                PersonId  = person.Id,
                CreatedAt = DateTime.UtcNow,
            };
            _db.MeetingAttendees.Add(attendee);
        }

        attendee.Status         = request.Status;
        attendee.DiningAttending = diningAttending;
        attendee.UpdatedAt      = DateTime.UtcNow;

        // Replace course/upgrade selections
        _db.AttendeeCourseSelections.RemoveRange(attendee.CourseSelections);
        _db.AttendeeUpgradeSelections.RemoveRange(attendee.UpgradeSelections);

        if (diningAttending)
        {
            foreach (var sel in request.CourseSelections)
            {
                _db.AttendeeCourseSelections.Add(new AttendeeCourseSelection
                {
                    Id         = Guid.NewGuid(),
                    AttendeeId = attendee.Id,
                    CourseId   = sel.CourseId,
                    OptionId   = sel.OptionId,
                });
            }

            foreach (var upgradeId in request.UpgradeSelections)
            {
                _db.AttendeeUpgradeSelections.Add(new AttendeeUpgradeSelection
                {
                    Id         = Guid.NewGuid(),
                    AttendeeId = attendee.Id,
                    UpgradeId  = upgradeId,
                });
            }
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            attendeeId = attendee.Id,
            personId   = person.Id,
            personName = $"{person.FirstName} {person.LastName}".Trim(),
            isNewGuest,
        });
    }

    // ── Public: latest news posts ──────────────────────────────────────────────
    [HttpGet("posts")]
    public async Task<IActionResult> GetPosts([FromQuery] int limit = 10)
    {
        var posts = await _db.Posts
            .Where(p => p.IsPublished)
            .OrderByDescending(p => p.PublishedAt)
            .Take(limit)
            .Select(p => new
            {
                p.Id,
                p.Title,
                p.PublishedAt,
                p.UpdatedAt,
            })
            .ToListAsync();

        return Ok(posts);
    }

    [HttpGet("posts/{id:guid}")]
    public async Task<IActionResult> GetPost(Guid id)
    {
        var post = await _db.Posts
            .Where(p => p.Id == id && p.IsPublished)
            .FirstOrDefaultAsync();

        if (post is null) return NotFound();

        return Ok(new
        {
            post.Id,
            post.Title,
            post.Content,
            post.PublishedAt,
        });
    }
}
