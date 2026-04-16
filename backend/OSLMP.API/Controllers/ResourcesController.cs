using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;

namespace OSLMP.API.Controllers;

[ApiController]
[Route("api/resources")]
[Authorize]
public class ResourcesController : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
        ".pdf",
        ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".txt", ".csv",
    };

    private readonly IWebHostEnvironment _env;
    private readonly ILogger<ResourcesController> _logger;

    public ResourcesController(IWebHostEnvironment env, ILogger<ResourcesController> logger)
    {
        _env = env;
        _logger = logger;
    }

    private string ResourcesPath => Path.Combine(_env.ContentRootPath, "resources");

    /// <summary>Upload a file. Returns the public URL path to access it.</summary>
    [HttpPost]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file provided." });

        var ext = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(ext))
            return BadRequest(new { message = $"File type '{ext}' is not allowed." });

        Directory.CreateDirectory(ResourcesPath);

        // Preserve the original name but make it safe and unique
        var safeName = Path.GetFileNameWithoutExtension(file.FileName)
            .Replace(" ", "_")
            .Replace("..", "");
        var filename = $"{safeName}_{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(ResourcesPath, filename);

        await using var stream = System.IO.File.Create(fullPath);
        await file.CopyToAsync(stream);

        _logger.LogInformation("Resource uploaded: {Filename} ({Size} bytes)", filename, file.Length);

        return Ok(new
        {
            filename,
            url = $"/resources/{filename}",
            size = file.Length,
            contentType = file.ContentType,
        });
    }

    /// <summary>List all uploaded resources.</summary>
    [HttpGet]
    public IActionResult List()
    {
        if (!Directory.Exists(ResourcesPath))
            return Ok(new { resources = Array.Empty<object>() });

        var provider = new FileExtensionContentTypeProvider();

        var resources = Directory.GetFiles(ResourcesPath)
            .Select(f =>
            {
                var info = new FileInfo(f);
                provider.TryGetContentType(f, out var contentType);
                return new
                {
                    filename = info.Name,
                    url = $"/resources/{info.Name}",
                    size = info.Length,
                    contentType = contentType ?? "application/octet-stream",
                    uploadedAt = info.CreationTimeUtc,
                };
            })
            .OrderByDescending(r => r.uploadedAt)
            .ToList();

        return Ok(new { resources });
    }

    /// <summary>Delete an uploaded resource.</summary>
    [HttpDelete("{filename}")]
    public IActionResult Delete(string filename)
    {
        // Prevent path traversal
        if (filename.Contains('/') || filename.Contains('\\') || filename.Contains(".."))
            return BadRequest(new { message = "Invalid filename." });

        var fullPath = Path.Combine(ResourcesPath, filename);

        if (!System.IO.File.Exists(fullPath))
            return NotFound(new { message = "Resource not found." });

        System.IO.File.Delete(fullPath);
        _logger.LogInformation("Resource deleted: {Filename}", filename);

        return NoContent();
    }
}
