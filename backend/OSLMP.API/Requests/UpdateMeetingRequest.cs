using OSLMP.API.Models;

namespace OSLMP.API.Requests;

public record UpdateMeetingRequest(
    MeetingType Type,
    string? Title,
    DateTime Date,
    string? Time,
    string? Location,
    string? Summary,
    string? Notes);
