using OSLMP.API.Models;

namespace OSLMP.API.Requests;

public record CreatePersonRequest(
    string FirstName,
    string LastName,
    PersonType Type,
    string? Email,
    string? Phone);
