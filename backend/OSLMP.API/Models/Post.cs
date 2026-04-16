namespace OSLMP.API.Models;

public class Post
{
    public Guid Id { get; set; }
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";   // HTML from rich editor
    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
