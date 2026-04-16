namespace OSLMP.API.Requests;

public record DiningUpgradeDto(string Name, decimal? Price);
public record DiningCourseOptionDto(string Name, decimal? Supplement);
public record DiningCourseDto(string Name, List<DiningCourseOptionDto> Options);

public record UpdateDiningRequest(
    bool Enabled,
    string? Time,
    string? Location,
    decimal? Price,
    string? Notes,
    List<DiningUpgradeDto> Upgrades,
    List<DiningCourseDto> Courses);
