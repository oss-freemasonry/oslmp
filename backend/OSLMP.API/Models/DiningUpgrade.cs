namespace OSLMP.API.Models;

public class DiningUpgrade
{
    public Guid Id { get; set; }
    public Guid MeetingId { get; set; }
    public Meeting Meeting { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public decimal? Price { get; set; }
}
