namespace OSLMP.API.Models;

public class PersonOffice
{
    public Guid Id { get; set; }
    public Guid PersonId { get; set; }
    public Person Person { get; set; } = null!;

    public string Role { get; set; } = string.Empty;

    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }

    public string? Notes { get; set; }
}
