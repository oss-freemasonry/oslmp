using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace OSLMP.API.Services;

public class TokenService
{
    private readonly string _secret;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expiryMinutes;

    public TokenService(IConfiguration configuration)
    {
        _secret = configuration["Jwt:Secret"]!;
        _issuer = configuration["Jwt:Issuer"] ?? "oslmp";
        _audience = configuration["Jwt:Audience"] ?? "oslmp";
        _expiryMinutes = int.TryParse(configuration["Jwt:ExpiryMinutes"], out var mins) ? mins : 480;
    }

    public string GenerateToken(string userId, string username, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_expiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
