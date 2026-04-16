using OSLMP.API.Models;

namespace OSLMP.API.Requests;

public record UpdatePersonRequest(
    string FirstName,
    string LastName,
    PersonType Type,
    PersonStatus Status,
    string? Email,
    string? Phone,
    string? AddressLine1,
    string? AddressLine2,
    string? City,
    string? County,
    string? Postcode,
    string? Notes);
