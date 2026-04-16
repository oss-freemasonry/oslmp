using OSLMP.API.Models;

namespace OSLMP.API.Requests;

public record CourseSelectionDto(Guid CourseId, Guid OptionId);

public record RsvpRequest(
    Guid PersonId,
    AttendeeStatus Status,
    bool DiningAttending,
    List<CourseSelectionDto> CourseSelections,
    List<Guid> UpgradeSelections);
