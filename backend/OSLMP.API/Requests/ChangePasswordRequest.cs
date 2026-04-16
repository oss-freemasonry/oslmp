namespace OSLMP.API.Requests;

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
