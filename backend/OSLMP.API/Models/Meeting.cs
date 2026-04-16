namespace OSLMP.API.Models;

public class Meeting
{
    public Guid Id { get; set; }

    public MeetingType Type { get; set; } = MeetingType.Meeting;

    public string? Title { get; set; }

    public DateTime Date { get; set; }

    /// <summary>Optional time in HH:mm format.</summary>
    public string? Time { get; set; }

    public string? Location { get; set; }

    public string? Summary { get; set; }

    public string? Notes { get; set; }

    public bool DiningEnabled { get; set; }
    public string? DiningTime { get; set; }
    public string? DiningLocation { get; set; }
    public string? DiningMenu { get; set; }
    public decimal? DiningPrice { get; set; }
    public string? DiningNotes { get; set; }

    public ICollection<DiningUpgrade> DiningUpgrades { get; set; } = new List<DiningUpgrade>();
    public ICollection<DiningCourse> DiningCourses { get; set; } = new List<DiningCourse>();
    public ICollection<MeetingAttendee> Attendees { get; set; } = new List<MeetingAttendee>();
    public ICollection<MeetingDocument> Documents { get; set; } = new List<MeetingDocument>();

    public DateTime CreatedAt { get; set; }
}
