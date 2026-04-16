namespace OSLMP.API.Requests;

public record UpdateLodgeSettingsRequest(
    string LodgeName,
    string? LogoUrl,
    string? Summary,
    DateOnly? ConsecratedAt,
    string? ThemePrimaryColor,
    string? ThemeSecondaryColor,
    string? ThemeAccentColor,
    string? ThemeFont
);
