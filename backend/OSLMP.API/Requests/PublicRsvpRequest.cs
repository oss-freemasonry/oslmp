using OSLMP.API.Models;

namespace OSLMP.API.Requests;

public record PublicRsvpRequest(
    string Name,
    string Email,
    AttendeeStatus Status,
    bool DiningAttending,
    List<PublicCourseSelectionDto> CourseSelections,
    List<Guid> UpgradeSelections,
    bool Force = false
);

public record PublicCourseSelectionDto(Guid CourseId, Guid OptionId);
