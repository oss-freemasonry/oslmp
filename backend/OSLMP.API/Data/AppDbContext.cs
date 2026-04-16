using Microsoft.EntityFrameworkCore;
using OSLMP.API.Models;

namespace OSLMP.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Person> People => Set<Person>();
    public DbSet<PersonOffice> PersonOffices => Set<PersonOffice>();
    public DbSet<LodgeSettings> LodgeSettings => Set<LodgeSettings>();
    public DbSet<Meeting> Meetings => Set<Meeting>();
    public DbSet<DiningUpgrade> DiningUpgrades => Set<DiningUpgrade>();
    public DbSet<DiningCourse> DiningCourses => Set<DiningCourse>();
    public DbSet<DiningCourseOption> DiningCourseOptions => Set<DiningCourseOption>();
    public DbSet<MeetingAttendee> MeetingAttendees => Set<MeetingAttendee>();
    public DbSet<AttendeeCourseSelection> AttendeeCourseSelections => Set<AttendeeCourseSelection>();
    public DbSet<AttendeeUpgradeSelection> AttendeeUpgradeSelections => Set<AttendeeUpgradeSelection>();
    public DbSet<MeetingDocument> MeetingDocuments => Set<MeetingDocument>();
    public DbSet<Post> Posts => Set<Post>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Username).IsUnique();
            entity.Property(u => u.Username).IsRequired().HasMaxLength(100);
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.Role).IsRequired().HasMaxLength(50);
        });

        modelBuilder.Entity<Person>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(p => p.LastName).IsRequired().HasMaxLength(100);
            entity.Property(p => p.Type).IsRequired().HasMaxLength(20).HasConversion<string>();
            entity.Property(p => p.Status).IsRequired().HasMaxLength(20).HasConversion<string>();
        });

        modelBuilder.Entity<PersonOffice>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.Property(o => o.Role).IsRequired().HasMaxLength(100);
            entity.HasOne(o => o.Person)
                  .WithMany()
                  .HasForeignKey(o => o.PersonId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LodgeSettings>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.LodgeName).IsRequired().HasMaxLength(200);
            entity.Property(s => s.LogoUrl).HasMaxLength(2048);
            entity.Property(s => s.Summary).HasMaxLength(2000);
        });

        modelBuilder.Entity<Meeting>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Type).IsRequired().HasMaxLength(50).HasConversion<string>();
            entity.Property(m => m.Title).HasMaxLength(200);
            entity.Property(m => m.Time).HasMaxLength(5);
            entity.Property(m => m.Location).HasMaxLength(300);
            entity.Property(m => m.DiningTime).HasMaxLength(5);
            entity.Property(m => m.DiningLocation).HasMaxLength(300);
            entity.Property(m => m.DiningPrice).HasPrecision(8, 2);
        });

        modelBuilder.Entity<DiningUpgrade>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Name).IsRequired().HasMaxLength(200);
            entity.Property(u => u.Price).HasPrecision(8, 2);
            entity.HasOne(u => u.Meeting)
                  .WithMany(m => m.DiningUpgrades)
                  .HasForeignKey(u => u.MeetingId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DiningCourse>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(200);
            entity.HasOne(c => c.Meeting)
                  .WithMany(m => m.DiningCourses)
                  .HasForeignKey(c => c.MeetingId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DiningCourseOption>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.Property(o => o.Name).IsRequired().HasMaxLength(200);
            entity.HasOne(o => o.Course)
                  .WithMany(c => c.Options)
                  .HasForeignKey(o => o.CourseId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MeetingAttendee>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Status).IsRequired().HasMaxLength(20).HasConversion<string>();
            entity.HasIndex(a => new { a.MeetingId, a.PersonId }).IsUnique();
            entity.HasOne(a => a.Meeting)
                  .WithMany(m => m.Attendees)
                  .HasForeignKey(a => a.MeetingId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(a => a.Person)
                  .WithMany()
                  .HasForeignKey(a => a.PersonId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AttendeeCourseSelection>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.HasOne(s => s.Attendee)
                  .WithMany(a => a.CourseSelections)
                  .HasForeignKey(s => s.AttendeeId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AttendeeUpgradeSelection>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.HasOne(s => s.Attendee)
                  .WithMany(a => a.UpgradeSelections)
                  .HasForeignKey(s => s.AttendeeId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MeetingDocument>(entity =>
        {
            entity.HasKey(d => d.Id);
            entity.Property(d => d.Type).IsRequired().HasMaxLength(50).HasConversion<string>();
            entity.Property(d => d.Name).IsRequired().HasMaxLength(500);
            entity.Property(d => d.StoredFileName).IsRequired().HasMaxLength(200);
            entity.Property(d => d.OriginalFileName).IsRequired().HasMaxLength(500);
            entity.Property(d => d.ContentType).IsRequired().HasMaxLength(200);
            entity.HasOne(d => d.Meeting)
                  .WithMany(m => m.Documents)
                  .HasForeignKey(d => d.MeetingId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Post>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Title).IsRequired().HasMaxLength(500);
            entity.Property(p => p.Content).IsRequired();
        });
    }
}
