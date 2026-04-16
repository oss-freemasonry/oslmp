namespace OSLMP.API.Requests;

public record CreateUserRequest(string Username, string Password, string? Role);
