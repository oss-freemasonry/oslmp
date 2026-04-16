using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using OSLMP.API.Data;
using OSLMP.API.Models;
using OSLMP.API.Requests;

namespace OSLMP.API.Controllers;

[ApiController]
[Route("api/meetings")]
[Authorize]
public class MeetingsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public MeetingsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    private string DocumentsPath => Path.Combine(_env.ContentRootPath, "uploads", "documents");

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var meetings = await _db.Meetings
            .OrderBy(m => m.Date)
            .Select(m => new
            {
                m.Id, m.Type, m.Title, m.Date, m.Time, m.Location, m.Summary, m.Notes,
                m.DiningEnabled, m.DiningTime, m.DiningLocation, m.CreatedAt,
                InvitedCount   = m.Attendees.Count(),
                AttendingCount = m.Attendees.Count(a => a.Status == AttendeeStatus.Attending),
                ApologiesCount = m.Attendees.Count(a => a.Status == AttendeeStatus.Apologies),
                AwaitingCount  = m.Attendees.Count(a => a.Status == AttendeeStatus.Invited),
            })
            .ToListAsync();

        var result = meetings;

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var meeting = await _db.Meetings
            .Include(m => m.DiningUpgrades)
            .Include(m => m.DiningCourses).ThenInclude(c => c.Options)
            .Include(m => m.Attendees)
                .ThenInclude(a => a.Person)
            .Include(m => m.Attendees)
                .ThenInclude(a => a.CourseSelections)
            .Include(m => m.Attendees)
                .ThenInclude(a => a.UpgradeSelections)
            .Include(m => m.Documents)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (meeting is null) return NotFound();

        var attendingCount  = meeting.Attendees.Count(a => a.Status == AttendeeStatus.Attending);
        var apologiesCount  = meeting.Attendees.Count(a => a.Status == AttendeeStatus.Apologies);
        var awaitingCount   = meeting.Attendees.Count(a => a.Status == AttendeeStatus.Invited);

        return Ok(new
        {
            meeting.Id, meeting.Type, meeting.Title, meeting.Date, meeting.Time,
            meeting.Location, meeting.Summary, meeting.Notes, meeting.CreatedAt,
            meeting.DiningEnabled, meeting.DiningTime, meeting.DiningLocation,
            meeting.DiningPrice, meeting.DiningNotes,
            DiningUpgrades = meeting.DiningUpgrades
                .Select(u => new { u.Id, u.Name, u.Price })
                .ToList(),
            DiningCourses = meeting.DiningCourses
                .OrderBy(c => c.SortOrder)
                .Select(c => new
                {
                    c.Id, c.Name,
                    Options = c.Options
                        .OrderBy(o => o.SortOrder)
                        .Select(o => new { o.Id, o.Name, o.Supplement })
                        .ToList(),
                })
                .ToList(),
            Attendees = meeting.Attendees
                .OrderBy(a => a.Person.LastName).ThenBy(a => a.Person.FirstName)
                .Select(a => new
                {
                    a.Id, a.PersonId, a.Status, a.DiningAttending,
                    PersonFirstName = a.Person.FirstName,
                    PersonLastName  = a.Person.LastName,
                    CourseSelections  = a.CourseSelections.Select(s => new { s.CourseId, s.OptionId }).ToList(),
                    UpgradeSelections = a.UpgradeSelections.Select(s => s.UpgradeId).ToList(),
                })
                .ToList(),
            InvitedCount   = meeting.Attendees.Count,
            AttendingCount = attendingCount,
            ApologiesCount = apologiesCount,
            AwaitingCount  = awaitingCount,
            Documents = meeting.Documents
                .OrderBy(d => d.CreatedAt)
                .Select(d => new { d.Id, d.Type, d.Name, d.OriginalFileName, d.ContentType, d.FileSize, d.IsPublic, d.CreatedAt })
                .ToList(),
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMeetingRequest req)
    {
        var meeting = new Meeting
        {
            Id = Guid.NewGuid(),
            Type = req.Type,
            Title = string.IsNullOrWhiteSpace(req.Title) ? null : req.Title.Trim(),
            Date = req.Date.Date,
            Time = string.IsNullOrWhiteSpace(req.Time) ? null : req.Time.Trim(),
            Location = string.IsNullOrWhiteSpace(req.Location) ? null : req.Location.Trim(),
            Summary = string.IsNullOrWhiteSpace(req.Summary) ? null : req.Summary.Trim(),
            Notes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes.Trim(),
            CreatedAt = DateTime.UtcNow,
        };

        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = meeting.Id }, new { meeting.Id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMeetingRequest req)
    {
        var meeting = await _db.Meetings.FindAsync(id);
        if (meeting is null) return NotFound();

        meeting.Type = req.Type;
        meeting.Title = string.IsNullOrWhiteSpace(req.Title) ? null : req.Title.Trim();
        meeting.Date = req.Date.Date;
        meeting.Time = string.IsNullOrWhiteSpace(req.Time) ? null : req.Time.Trim();
        meeting.Location = string.IsNullOrWhiteSpace(req.Location) ? null : req.Location.Trim();
        meeting.Summary = string.IsNullOrWhiteSpace(req.Summary) ? null : req.Summary.Trim();
        meeting.Notes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes.Trim();

        await _db.SaveChangesAsync();
        return Ok(new { meeting.Id, meeting.Type, meeting.Title, meeting.Date, meeting.Time, meeting.Location, meeting.Summary, meeting.Notes });
    }

    [HttpPut("{id:guid}/dining")]
    public async Task<IActionResult> UpdateDining(Guid id, [FromBody] UpdateDiningRequest req)
    {
        var meeting = await _db.Meetings
            .Include(m => m.DiningUpgrades)
            .Include(m => m.DiningCourses).ThenInclude(c => c.Options)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (meeting is null) return NotFound();

        meeting.DiningEnabled = req.Enabled;
        meeting.DiningTime = string.IsNullOrWhiteSpace(req.Time) ? null : req.Time.Trim();
        meeting.DiningLocation = string.IsNullOrWhiteSpace(req.Location) ? null : req.Location.Trim();
        meeting.DiningPrice = req.Price;
        meeting.DiningNotes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes.Trim();

        // Replace upgrades
        _db.DiningUpgrades.RemoveRange(meeting.DiningUpgrades);
        foreach (var u in req.Upgrades ?? new List<DiningUpgradeDto>())
        {
            if (!string.IsNullOrWhiteSpace(u.Name))
                _db.DiningUpgrades.Add(new DiningUpgrade
                {
                    Id = Guid.NewGuid(),
                    MeetingId = meeting.Id,
                    Name = u.Name.Trim(),
                    Price = u.Price,
                });
        }

        // Replace courses + options
        _db.DiningCourses.RemoveRange(meeting.DiningCourses);
        var sortOrder = 0;
        foreach (var c in req.Courses ?? new List<DiningCourseDto>())
        {
            if (string.IsNullOrWhiteSpace(c.Name)) continue;
            var course = new DiningCourse
            {
                Id = Guid.NewGuid(),
                MeetingId = meeting.Id,
                Name = c.Name.Trim(),
                SortOrder = sortOrder++,
            };
            var optSort = 0;
            foreach (var o in c.Options ?? new List<DiningCourseOptionDto>())
            {
                if (!string.IsNullOrWhiteSpace(o.Name))
                    course.Options.Add(new DiningCourseOption
                    {
                        Id = Guid.NewGuid(),
                        Name = o.Name.Trim(),
                        SortOrder = optSort++,
                        Supplement = o.Supplement,
                    });
            }
            _db.DiningCourses.Add(course);
        }

        await _db.SaveChangesAsync();

        // Re-fetch so the response reflects the newly saved courses/upgrades,
        // not the stale navigation collection (which still holds deleted entities).
        var fresh = await _db.Meetings
            .Include(m => m.DiningUpgrades)
            .Include(m => m.DiningCourses).ThenInclude(c => c.Options)
            .FirstAsync(m => m.Id == id);

        return Ok(new
        {
            fresh.DiningEnabled, fresh.DiningTime, fresh.DiningLocation,
            fresh.DiningPrice, fresh.DiningNotes,
            DiningUpgrades = fresh.DiningUpgrades
                .Select(u => new { u.Id, u.Name, u.Price })
                .ToList(),
            DiningCourses = fresh.DiningCourses
                .OrderBy(c => c.SortOrder)
                .Select(c => new
                {
                    c.Id, c.Name,
                    Options = c.Options
                        .OrderBy(o => o.SortOrder)
                        .Select(o => new { o.Id, o.Name, o.Supplement })
                        .ToList(),
                })
                .ToList(),
        });
    }

    // ── Invites ───────────────────────────────────────────────────────────────────

    [HttpPut("{id:guid}/invites")]
    public async Task<IActionResult> ManageInvites(Guid id, [FromBody] ManageInvitesRequest req)
    {
        var meeting = await _db.Meetings
            .Include(m => m.Attendees)
                .ThenInclude(a => a.Person)
            .Include(m => m.Attendees)
                .ThenInclude(a => a.CourseSelections)
            .Include(m => m.Attendees)
                .ThenInclude(a => a.UpgradeSelections)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (meeting is null) return NotFound();

        var requested = (req.PersonIds ?? new List<Guid>()).ToHashSet();

        // Remove Invited-only records for people no longer in the list
        var toRemove = meeting.Attendees
            .Where(a => a.Status == AttendeeStatus.Invited && !requested.Contains(a.PersonId))
            .ToList();
        _db.MeetingAttendees.RemoveRange(toRemove);

        // Add Invited records for newly added people
        var existingPersonIds = meeting.Attendees.Select(a => a.PersonId).ToHashSet();
        var now = DateTime.UtcNow;
        foreach (var personId in requested.Where(pid => !existingPersonIds.Contains(pid)))
        {
            var person = await _db.People.FindAsync(personId);
            if (person is null) continue;
            _db.MeetingAttendees.Add(new MeetingAttendee
            {
                Id = Guid.NewGuid(),
                MeetingId = id,
                PersonId = personId,
                Status = AttendeeStatus.Invited,
                CreatedAt = now,
                UpdatedAt = now,
            });
        }

        await _db.SaveChangesAsync();

        // Re-query to return fresh attendee list
        var updated = await _db.MeetingAttendees
            .Include(a => a.Person)
            .Include(a => a.CourseSelections)
            .Include(a => a.UpgradeSelections)
            .Where(a => a.MeetingId == id)
            .OrderBy(a => a.Person.LastName).ThenBy(a => a.Person.FirstName)
            .Select(a => new
            {
                a.Id, a.PersonId, a.Status, a.DiningAttending,
                PersonFirstName = a.Person.FirstName,
                PersonLastName  = a.Person.LastName,
                CourseSelections  = a.CourseSelections.Select(s => new { s.CourseId, s.OptionId }).ToList(),
                UpgradeSelections = a.UpgradeSelections.Select(s => s.UpgradeId).ToList(),
            })
            .ToListAsync();

        var attendingCount  = updated.Count(a => a.Status == AttendeeStatus.Attending);
        var apologiesCount  = updated.Count(a => a.Status == AttendeeStatus.Apologies);
        var awaitingCount   = updated.Count(a => a.Status == AttendeeStatus.Invited);

        return Ok(new
        {
            Attendees      = updated,
            InvitedCount   = updated.Count,
            AttendingCount = attendingCount,
            ApologiesCount = apologiesCount,
            AwaitingCount  = awaitingCount,
        });
    }

    // ── RSVP ─────────────────────────────────────────────────────────────────────

    [HttpPost("{id:guid}/rsvp")]
    public async Task<IActionResult> Rsvp(Guid id, [FromBody] RsvpRequest req)
    {
        var meeting = await _db.Meetings
            .Include(m => m.DiningCourses).ThenInclude(c => c.Options)
            .Include(m => m.DiningUpgrades)
            .FirstOrDefaultAsync(m => m.Id == id);
        if (meeting is null) return NotFound();

        var person = await _db.People.FindAsync(req.PersonId);
        if (person is null) return BadRequest(new { message = "Person not found." });

        // Validate dining selections if attending with dining
        if (req.Status == AttendeeStatus.Attending && req.DiningAttending && meeting.DiningEnabled)
        {
            var requiredCourseIds = meeting.DiningCourses
                .Where(c => c.Options.Any())
                .Select(c => c.Id)
                .ToList();

            var selectedCourseIds = (req.CourseSelections ?? new List<CourseSelectionDto>())
                .Select(s => s.CourseId)
                .ToList();

            var missingCourseIds = requiredCourseIds.Except(selectedCourseIds).ToList();
            if (missingCourseIds.Any())
                return BadRequest(new { message = "A selection is required for every course." });

            foreach (var sel in req.CourseSelections ?? new List<CourseSelectionDto>())
            {
                var course = meeting.DiningCourses.FirstOrDefault(c => c.Id == sel.CourseId);
                if (course is null || !course.Options.Any(o => o.Id == sel.OptionId))
                    return BadRequest(new { message = "Invalid course or option selection." });
            }

            var validUpgradeIds = meeting.DiningUpgrades.Select(u => u.Id).ToHashSet();
            foreach (var uid in req.UpgradeSelections ?? new List<Guid>())
            {
                if (!validUpgradeIds.Contains(uid))
                    return BadRequest(new { message = "Invalid upgrade selection." });
            }
        }

        // Upsert
        var attendee = await _db.MeetingAttendees
            .Include(a => a.CourseSelections)
            .Include(a => a.UpgradeSelections)
            .FirstOrDefaultAsync(a => a.MeetingId == id && a.PersonId == req.PersonId);

        var isNew = attendee is null;
        if (isNew)
        {
            attendee = new MeetingAttendee
            {
                Id = Guid.NewGuid(),
                MeetingId = id,
                PersonId = req.PersonId,
                CreatedAt = DateTime.UtcNow,
            };
        }

        attendee!.Status = req.Status;
        attendee.UpdatedAt = DateTime.UtcNow;

        var isDining = req.Status == AttendeeStatus.Attending && req.DiningAttending && meeting.DiningEnabled;
        attendee.DiningAttending = isDining;

        // Replace course + upgrade selections
        _db.AttendeeCourseSelections.RemoveRange(attendee.CourseSelections);
        _db.AttendeeUpgradeSelections.RemoveRange(attendee.UpgradeSelections);

        if (isDining)
        {
            foreach (var sel in req.CourseSelections ?? new List<CourseSelectionDto>())
                attendee.CourseSelections.Add(new AttendeeCourseSelection
                {
                    Id = Guid.NewGuid(), CourseId = sel.CourseId, OptionId = sel.OptionId,
                });

            foreach (var uid in req.UpgradeSelections ?? new List<Guid>())
                attendee.UpgradeSelections.Add(new AttendeeUpgradeSelection
                {
                    Id = Guid.NewGuid(), UpgradeId = uid,
                });
        }

        if (isNew) _db.MeetingAttendees.Add(attendee);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            attendee.Id, attendee.PersonId, attendee.Status, attendee.DiningAttending,
            PersonFirstName = person.FirstName,
            PersonLastName  = person.LastName,
            CourseSelections  = attendee.CourseSelections.Select(s => new { s.CourseId, s.OptionId }).ToList(),
            UpgradeSelections = attendee.UpgradeSelections.Select(s => s.UpgradeId).ToList(),
        });
    }

    [HttpDelete("{id:guid}/rsvp/{attendeeId:guid}")]
    public async Task<IActionResult> DeleteRsvp(Guid id, Guid attendeeId)
    {
        var attendee = await _db.MeetingAttendees
            .FirstOrDefaultAsync(a => a.Id == attendeeId && a.MeetingId == id);

        if (attendee is null) return NotFound();

        _db.MeetingAttendees.Remove(attendee);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var meeting = await _db.Meetings
            .Include(m => m.Documents)
            .FirstOrDefaultAsync(m => m.Id == id);
        if (meeting is null) return NotFound();

        // Delete stored files
        foreach (var doc in meeting.Documents)
        {
            var filePath = Path.Combine(DocumentsPath, doc.StoredFileName);
            if (System.IO.File.Exists(filePath))
                System.IO.File.Delete(filePath);
        }

        _db.Meetings.Remove(meeting);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Documents ─────────────────────────────────────────────────────────────────

    [HttpPost("{id:guid}/documents")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadDocument(
        Guid id,
        IFormFile file,
        [FromForm] string type,
        [FromForm] string? name,
        [FromForm] bool isPublic = false)
    {
        var meeting = await _db.Meetings.FindAsync(id);
        if (meeting is null) return NotFound();

        if (!Enum.TryParse<DocumentType>(type, out var docType))
            return BadRequest(new { message = "Invalid document type." });

        if (file.Length == 0)
            return BadRequest(new { message = "File is empty." });

        const long maxBytes = 20 * 1024 * 1024; // 20 MB
        if (file.Length > maxBytes)
            return BadRequest(new { message = "File must be 20 MB or smaller." });

        var ext = Path.GetExtension(file.FileName);
        var storedFileName = $"{Guid.NewGuid()}{ext}";
        var storedPath = Path.Combine(DocumentsPath, storedFileName);

        Directory.CreateDirectory(DocumentsPath);
        await using (var stream = System.IO.File.Create(storedPath))
            await file.CopyToAsync(stream);

        var displayName = string.IsNullOrWhiteSpace(name)
            ? Path.GetFileNameWithoutExtension(file.FileName)
            : name.Trim();

        var doc = new MeetingDocument
        {
            Id               = Guid.NewGuid(),
            MeetingId        = id,
            Type             = docType,
            Name             = displayName,
            StoredFileName   = storedFileName,
            OriginalFileName = file.FileName,
            ContentType      = file.ContentType,
            FileSize         = file.Length,
            IsPublic         = isPublic,
            CreatedAt        = DateTime.UtcNow,
        };

        _db.MeetingDocuments.Add(doc);
        await _db.SaveChangesAsync();

        return Ok(new { doc.Id, doc.Type, doc.Name, doc.OriginalFileName, doc.ContentType, doc.FileSize, doc.IsPublic, doc.CreatedAt });
    }

    [HttpGet("{id:guid}/documents/{docId:guid}/file")]
    [AllowAnonymous]
    public async Task<IActionResult> DownloadDocument(Guid id, Guid docId)
    {
        var doc = await _db.MeetingDocuments
            .FirstOrDefaultAsync(d => d.Id == docId && d.MeetingId == id);

        if (doc is null) return NotFound();

        if (!doc.IsPublic && !(User.Identity?.IsAuthenticated ?? false))
            return Unauthorized();

        var filePath = Path.Combine(DocumentsPath, doc.StoredFileName);
        if (!System.IO.File.Exists(filePath)) return NotFound();

        var bytes = await System.IO.File.ReadAllBytesAsync(filePath);
        return File(bytes, doc.ContentType, doc.OriginalFileName);
    }

    [HttpPatch("{id:guid}/documents/{docId:guid}")]
    public async Task<IActionResult> UpdateDocument(Guid id, Guid docId, [FromBody] UpdateDocumentRequest req)
    {
        var doc = await _db.MeetingDocuments
            .FirstOrDefaultAsync(d => d.Id == docId && d.MeetingId == id);

        if (doc is null) return NotFound();

        doc.IsPublic = req.IsPublic;

        await _db.SaveChangesAsync();
        return Ok(new { doc.Id, doc.Type, doc.Name, doc.OriginalFileName, doc.ContentType, doc.FileSize, doc.IsPublic, doc.CreatedAt });
    }

    [HttpDelete("{id:guid}/documents/{docId:guid}")]
    public async Task<IActionResult> DeleteDocument(Guid id, Guid docId)
    {
        var doc = await _db.MeetingDocuments
            .FirstOrDefaultAsync(d => d.Id == docId && d.MeetingId == id);

        if (doc is null) return NotFound();

        var filePath = Path.Combine(DocumentsPath, doc.StoredFileName);
        if (System.IO.File.Exists(filePath))
            System.IO.File.Delete(filePath);

        _db.MeetingDocuments.Remove(doc);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
