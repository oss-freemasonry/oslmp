namespace OSLMP.API.Models;

public class MeetingAttendee
{
    public Guid Id { get; set; }
    public Guid MeetingId { get; set; }
    public Meeting Meeting { get; set; } = null!;
    public Guid PersonId { get; set; }
    public Person Person { get; set; } = null!;

    public AttendeeStatus Status { get; set; } = AttendeeStatus.Invited;

    public bool DiningAttending { get; set; }

    public ICollection<AttendeeCourseSelection> CourseSelections { get; set; } = new List<AttendeeCourseSelection>();
    public ICollection<AttendeeUpgradeSelection> UpgradeSelections { get; set; } = new List<AttendeeUpgradeSelection>();

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AttendeeCourseSelection
{
    public Guid Id { get; set; }
    public Guid AttendeeId { get; set; }
    public MeetingAttendee Attendee { get; set; } = null!;
    public Guid CourseId { get; set; }
    public Guid OptionId { get; set; }
}

public class AttendeeUpgradeSelection
{
    public Guid Id { get; set; }
    public Guid AttendeeId { get; set; }
    public MeetingAttendee Attendee { get; set; } = null!;
    public Guid UpgradeId { get; set; }
}
