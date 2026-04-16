namespace OSLMP.API.Models;

public class MeetingDocument
{
    public Guid Id { get; set; }
    public Guid MeetingId { get; set; }
    public Meeting Meeting { get; set; } = null!;
    public DocumentType Type { get; set; }
    public string Name { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public bool IsPublic { get; set; }
    public DateTime CreatedAt { get; set; }
}
