using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OSLMP.API.Data;
using OSLMP.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Read JWT config early — needed for service registration
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "oslmp";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "oslmp";

// --- Services ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=oslmp.db")
           .EnableSensitiveDataLogging(builder.Environment.IsDevelopment()));

builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<TokenService>();
builder.Services.AddSingleton<PasswordService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

// --- Startup validation — fail fast if required config is missing ---
{
    var startupLogger = app.Services.GetRequiredService<ILogger<Program>>();
    var adminPassword = app.Configuration["Admin:Password"];
    var secret = app.Configuration["Jwt:Secret"];

    var errors = new List<string>();

    if (string.IsNullOrWhiteSpace(adminPassword))
        errors.Add("Admin:Password is not set.");
    if (string.IsNullOrWhiteSpace(secret) || secret.Length < 32)
        errors.Add("Jwt:Secret must be at least 32 characters long.");

    if (errors.Count > 0)
    {
        startupLogger.LogCritical("OSLMP cannot start — required configuration is missing:");
        foreach (var error in errors)
            startupLogger.LogCritical("  • {Error}", error);
        startupLogger.LogCritical(
            "Set Admin:Password and Jwt:Secret in appsettings.json " +
            "or via environment variables before starting the application.");

        throw new InvalidOperationException(
            "Missing required configuration. Review the log output above.");
    }
}

// --- DB init ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    // EnsureCreated won't alter an existing database, so create any new tables manually.
    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS ""LodgeSettings"" (
            ""Id""         TEXT    NOT NULL CONSTRAINT ""PK_LodgeSettings"" PRIMARY KEY,
            ""LodgeName""  TEXT    NOT NULL,
            ""LogoUrl""    TEXT,
            ""UpdatedAt""  TEXT    NOT NULL
        )");

    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS ""Meetings"" (
            ""Id""              TEXT    NOT NULL CONSTRAINT ""PK_Meetings"" PRIMARY KEY,
            ""Type""            TEXT    NOT NULL,
            ""Title""           TEXT,
            ""Date""            TEXT    NOT NULL,
            ""Time""            TEXT,
            ""Location""        TEXT,
            ""Notes""           TEXT,
            ""DiningLocation""  TEXT,
            ""DiningTime""      TEXT,
            ""CreatedAt""       TEXT    NOT NULL
        )");

    // Add columns introduced after initial schema.
    // SQLite has no ADD COLUMN IF NOT EXISTS, so we check pragma_table_info first.
    AddColumnIfMissing(db, "LodgeSettings", "Summary",            "TEXT");
    AddColumnIfMissing(db, "LodgeSettings", "ConsecratedAt",      "TEXT");
    AddColumnIfMissing(db, "LodgeSettings", "ThemePrimaryColor",   "TEXT");
    AddColumnIfMissing(db, "LodgeSettings", "ThemeSecondaryColor", "TEXT");
    AddColumnIfMissing(db, "LodgeSettings", "ThemeAccentColor",    "TEXT");
    AddColumnIfMissing(db, "LodgeSettings", "ThemeFont",           "TEXT");

    AddColumnIfMissing(db, "DiningCourseOptions", "Supplement", "REAL");

    AddColumnIfMissing(db, "Meetings", "DiningLocation", "TEXT");
    AddColumnIfMissing(db, "Meetings", "DiningTime",     "TEXT");
    AddColumnIfMissing(db, "Meetings", "Summary",        "TEXT");
    AddColumnIfMissing(db, "Meetings", "DiningEnabled",  "INTEGER NOT NULL DEFAULT 0");
    AddColumnIfMissing(db, "Meetings", "DiningMenu",     "TEXT");
    AddColumnIfMissing(db, "Meetings", "DiningPrice",    "REAL");
    AddColumnIfMissing(db, "Meetings", "DiningNotes",    "TEXT");

    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS ""DiningUpgrades"" (
            ""Id""         TEXT    NOT NULL CONSTRAINT ""PK_DiningUpgrades"" PRIMARY KEY,
            ""MeetingId""  TEXT    NOT NULL,
            ""Name""       TEXT    NOT NULL,
            ""Price""      REAL,
            CONSTRAINT ""FK_DiningUpgrades_Meetings"" FOREIGN KEY (""MeetingId"") REFERENCES ""Meetings"" (""Id"") ON DELETE CASCADE
        )");

    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS ""DiningCourses"" (
            ""Id""         TEXT     NOT NULL CONSTRAINT ""PK_DiningCourses"" PRIMARY KEY,
            ""MeetingId""  TEXT     NOT NULL,
            ""Name""       TEXT     NOT NULL,
            ""SortOrder""  INTEGER  NOT NULL DEFAULT 0,
            CONSTRAINT ""FK_DiningCourses_Meetings"" FOREIGN KEY (""MeetingId"") REFERENCES ""Meetings"" (""Id"") ON DELETE CASCADE
        )");

    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS ""DiningCourseOptions"" (
            ""Id""         TEXT     NOT NULL CONSTRAINT ""PK_DiningCourseOptions"" PRIMARY KEY,
            ""CourseId""   TEXT     NOT NULL,
            ""Name""       TEXT     NOT NULL,
            ""SortOrder""  INTEGER  NOT NULL DEFAULT 0,
            CONSTRAINT ""FK_DiningCourseOptions_DiningCourses"" FOREIGN KEY (""CourseId"") REFERENCES ""DiningCourses"" (""Id"") ON DELETE CASCADE
        )");

    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS ""MeetingAttendees"" (
            ""Id""              TEXT     NOT NULL CONSTRAINT ""PK_MeetingAttendees"" PRIMARY KEY,
            ""MeetingId""       TEXT     NOT NULL,
            ""PersonId""        TEXT     NOT NULL,
            ""Status""          TEXT     NOT NULL DEFAULT 'Attending',
            ""DiningAttending"" INTEGER  NOT NULL DEFAULT 0,
            ""CreatedAt""       TEXT     NOT NULL,
            ""UpdatedAt""       TEXT     NOT NULL,
            CONSTRAINT ""FK_MeetingAttendees_Meetings"" FOREIGN KEY (""MeetingId"") REFERENCES ""Meetings"" (""Id"") ON DELETE CASCADE,
            CONSTRAINT ""FK_MeetingAttendees_People""  FOREIGN KEY (""PersonId"")  REFERENCES ""People""   (""Id"") ON DELETE CASCADE,
            CONSTRAINT ""UQ_MeetingAttendees"" UNIQUE (""MeetingId"", ""PersonId"")
        )");

    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS ""AttendeeCourseSelections"" (
            ""Id""          TEXT NOT NULL CONSTRAINT ""PK_AttendeeCourseSelections"" PRIMARY KEY,
            ""AttendeeId""  TEXT NOT NULL,
            ""CourseId""    TEXT NOT NULL,
            ""OptionId""    TEXT NOT NULL,
            CONSTRAINT ""FK_AttendeeCourseSelections_MeetingAttendees"" FOREIGN KEY (""AttendeeId"") REFERENCES ""MeetingAttendees"" (""Id"") ON DELETE CASCADE
        )");

    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS ""AttendeeUpgradeSelections"" (
            ""Id""          TEXT NOT NULL CONSTRAINT ""PK_AttendeeUpgradeSelections"" PRIMARY KEY,
            ""AttendeeId""  TEXT NOT NULL,
            ""UpgradeId""   TEXT NOT NULL,
            CONSTRAINT ""FK_AttendeeUpgradeSelections_MeetingAttendees"" FOREIGN KEY (""AttendeeId"") REFERENCES ""MeetingAttendees"" (""Id"") ON DELETE CASCADE
        )");

    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS ""MeetingDocuments"" (
            ""Id""               TEXT    NOT NULL CONSTRAINT ""PK_MeetingDocuments"" PRIMARY KEY,
            ""MeetingId""        TEXT    NOT NULL,
            ""Type""             TEXT    NOT NULL,
            ""Name""             TEXT    NOT NULL,
            ""StoredFileName""   TEXT    NOT NULL,
            ""OriginalFileName"" TEXT    NOT NULL,
            ""ContentType""      TEXT    NOT NULL,
            ""FileSize""         INTEGER NOT NULL DEFAULT 0,
            ""IsPublic""         INTEGER NOT NULL DEFAULT 0,
            ""CreatedAt""        TEXT    NOT NULL,
            CONSTRAINT ""FK_MeetingDocuments_Meetings"" FOREIGN KEY (""MeetingId"") REFERENCES ""Meetings"" (""Id"") ON DELETE CASCADE
        )");

    AddColumnIfMissing(db, "MeetingDocuments", "IsPublic", "INTEGER NOT NULL DEFAULT 0");

    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS ""Posts"" (
            ""Id""           TEXT    NOT NULL CONSTRAINT ""PK_Posts"" PRIMARY KEY,
            ""Title""        TEXT    NOT NULL,
            ""Content""      TEXT    NOT NULL DEFAULT '',
            ""IsPublished""  INTEGER NOT NULL DEFAULT 0,
            ""PublishedAt""  TEXT,
            ""CreatedAt""    TEXT    NOT NULL,
            ""UpdatedAt""    TEXT    NOT NULL
        )");

    // Migrate Person Type/Status to PascalCase to match enum names
    db.Database.ExecuteSqlRaw(@"UPDATE ""People"" SET ""Type"" = 'Member' WHERE ""Type"" = 'member'");
    db.Database.ExecuteSqlRaw(@"UPDATE ""People"" SET ""Type"" = 'Guest'  WHERE ""Type"" = 'guest'");
    db.Database.ExecuteSqlRaw(@"UPDATE ""People"" SET ""Status"" = 'Active'   WHERE ""Status"" = 'active'");
    db.Database.ExecuteSqlRaw(@"UPDATE ""People"" SET ""Status"" = 'Inactive' WHERE ""Status"" = 'inactive'");

    if (!db.LodgeSettings.Any())
    {
        db.LodgeSettings.Add(new OSLMP.API.Models.LodgeSettings
        {
            Id = Guid.NewGuid(),
            LodgeName = "My Lodge",
            LogoUrl = null,
            UpdatedAt = DateTime.UtcNow,
        });
        db.SaveChanges();
    }
}

// --- Middleware pipeline ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Ensure uploads directory exists for meeting documents
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads", "documents");
Directory.CreateDirectory(uploadsPath);

// Serve uploaded files from /resources/<filename> (public, no auth required)
var resourcesPath = Path.Combine(app.Environment.ContentRootPath, "resources");
Directory.CreateDirectory(resourcesPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(resourcesPath),
    RequestPath = "/resources",
});

app.MapControllers();

app.MapGet("/api/lodge-roles", () => Results.Ok(OSLMP.API.Models.LodgeRoles.All))
   .WithName("LodgeRoles")
   .WithTags("System")
   .RequireAuthorization();

app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
   .WithName("Health")
   .WithTags("System")
   .AllowAnonymous();

app.Run();

// ── Helpers ───────────────────────────────────────────────────────────────────

static void AddColumnIfMissing(
    OSLMP.API.Data.AppDbContext db, string table, string column, string definition)
{
    var conn = db.Database.GetDbConnection();
    if (conn.State != System.Data.ConnectionState.Open) conn.Open();
    using var cmd = conn.CreateCommand();
    cmd.CommandText = $"SELECT COUNT(*) FROM pragma_table_info('{table}') WHERE name = '{column}'";
    var exists = (long)cmd.ExecuteScalar()! > 0;
    if (!exists)
        db.Database.ExecuteSqlRaw($@"ALTER TABLE ""{table}"" ADD COLUMN ""{column}"" {definition}");
}
