using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OSLMP.API.Data;
using OSLMP.API.Models;

namespace OSLMP.API.Controllers;

[ApiController]
[Route("api/posts")]
[Authorize]
public class PostsController : ControllerBase
{
    private readonly AppDbContext _db;
    public PostsController(AppDbContext db) => _db = db;
    // ── Admin: list all ────────────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var posts = await _db.Posts
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.Title,
                p.IsPublished,
                p.PublishedAt,
                p.CreatedAt,
                p.UpdatedAt,
            })
            .ToListAsync();

        return Ok(posts);
    }

    // ── Admin: get one ─────────────────────────────────────────────────────────
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var post = await _db.Posts.FindAsync(id);
        if (post is null) return NotFound();
        return Ok(post);
    }

    // ── Admin: create ──────────────────────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertPostRequest req)
    {
        var post = new Post
        {
            Id          = Guid.NewGuid(),
            Title       = req.Title,
            Content     = req.Content,
            IsPublished = req.IsPublished,
            PublishedAt = req.IsPublished ? DateTime.UtcNow : null,
            CreatedAt   = DateTime.UtcNow,
            UpdatedAt   = DateTime.UtcNow,
        };

        _db.Posts.Add(post);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = post.Id }, post);
    }

    // ── Admin: update ──────────────────────────────────────────────────────────
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertPostRequest req)
    {
        var post = await _db.Posts.FindAsync(id);
        if (post is null) return NotFound();

        var wasPublished = post.IsPublished;

        post.Title       = req.Title;
        post.Content     = req.Content;
        post.IsPublished = req.IsPublished;
        post.UpdatedAt   = DateTime.UtcNow;

        if (req.IsPublished && !wasPublished)
            post.PublishedAt = DateTime.UtcNow;
        else if (!req.IsPublished)
            post.PublishedAt = null;

        await _db.SaveChangesAsync();
        return Ok(post);
    }

    // ── Admin: delete ──────────────────────────────────────────────────────────
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var post = await _db.Posts.FindAsync(id);
        if (post is null) return NotFound();
        _db.Posts.Remove(post);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record UpsertPostRequest(string Title, string Content, bool IsPublished);
