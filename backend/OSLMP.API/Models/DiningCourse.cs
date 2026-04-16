namespace OSLMP.API.Models;

public class DiningCourse
{
    public Guid Id { get; set; }
    public Guid MeetingId { get; set; }
    public Meeting Meeting { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public ICollection<DiningCourseOption> Options { get; set; } = new List<DiningCourseOption>();
}

public class DiningCourseOption
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public DiningCourse Course { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public decimal? Supplement { get; set; }
}
