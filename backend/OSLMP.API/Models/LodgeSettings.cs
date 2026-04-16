namespace OSLMP.API.Models;

public class LodgeSettings
{
    public Guid Id { get; set; }
    public string LodgeName { get; set; } = "My Lodge";
    public string? LogoUrl { get; set; }
    public string? Summary { get; set; }
    public DateOnly? ConsecratedAt { get; set; }

    public string? ThemePrimaryColor { get; set; }
    public string? ThemeSecondaryColor { get; set; }
    public string? ThemeAccentColor { get; set; }
    public string? ThemeFont { get; set; }

    public DateTime UpdatedAt { get; set; }
}
