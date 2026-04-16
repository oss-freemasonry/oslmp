namespace OSLMP.API.Models;

public class Person
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;

    public PersonType Type { get; set; } = PersonType.Member;
    public PersonStatus Status { get; set; } = PersonStatus.Active;

    public string? Email { get; set; }
    public string? Phone { get; set; }

    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? County { get; set; }
    public string? Postcode { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }
}
