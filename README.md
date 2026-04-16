# Open-source Lodge Management Platform (OSLMP)

A self-hosted web application for managing day-to-day lodge operations, specifically tailored for UGLE lodges. Manage members, meetings, dining, and lodge settings from a single interface.

## Features

- **People & offices** — member directory with lodge office/role tracking
- **Meetings** — schedule meetings with type, location, and notes
- **Dining** — per-meeting dining management with courses, options, upgrades, and attendee selections
- **Attendance** — track who is attending each meeting and their dining choices
- **Lodge settings** — configure lodge name and logo
- **Auth** — single admin account with JWT-based authentication

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | .NET 7 (ASP.NET Core Web API) |
| Database | SQLite |
| Reverse proxy | nginx |
| Container | Single Docker image (nginx + .NET + supervisord) |

---

## Running with Docker (recommended)

### 1. Build the image

```bash
docker build -t oslmp .
```

### 2. Run the container

```bash
docker run -d \
  -p 80:80 \
  -e Admin__Password=your-admin-password \
  -e Jwt__Secret=your-secret-key-minimum-32-characters \
  -v oslmp-data:/app/api \
  --name oslmp \
  oslmp
```

The app will be available at `http://localhost`.

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `Admin__Password` | Yes | Password for the admin account |
| `Jwt__Secret` | Yes | JWT signing secret (min. 32 characters) |
| `Jwt__Issuer` | No | JWT issuer claim (default: `oslmp`) |
| `Jwt__Audience` | No | JWT audience claim (default: `oslmp`) |
| `Jwt__ExpiryMinutes` | No | Token lifetime in minutes (default: `480`) |

> **Note:** Use double underscores (`__`) to separate config sections in environment variables (ASP.NET Core convention).

---

## Running locally for development

### Prerequisites

- [.NET 7 SDK](https://dotnet.microsoft.com/download/dotnet/7.0)
- [Node.js 20+](https://nodejs.org/)

### Backend

```bash
cd backend/OSLMP.API
dotnet run
```

The API starts on `http://localhost:5000`. Swagger UI is available at `http://localhost:5000/swagger`.

The development `appsettings.Development.json` is pre-configured with:
- Admin password: `admin`
- A default JWT secret

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server starts on `http://localhost:5173` and proxies `/api` requests to the backend.

### Default credentials

| Username | Password |
|----------|----------|
| `admin` | `admin` *(development only — set `Admin__Password` in production)* |

---

## Project structure

```
oslmp/
├── backend/
│   └── OSLMP.API/          # ASP.NET Core Web API
│       ├── Controllers/    # API endpoints
│       ├── Models/         # Entity models
│       ├── Services/       # Auth / token / password services
│       ├── Requests/       # Request DTOs
│       └── Data/           # EF Core DbContext
├── frontend/
│   └── src/
│       ├── api/            # API client functions
│       ├── components/     # Shared UI components
│       ├── context/        # React context (auth, etc.)
│       └── pages/          # Page-level components
├── nginx/
│   └── nginx.conf          # Reverse proxy config
├── Dockerfile              # Multi-stage build
└── supervisord.conf        # Process manager config (nginx + .NET)
```

---

## API

The API is documented via Swagger and accessible at `/swagger` when running in development mode. All endpoints (except `/api/health`) require a Bearer token obtained from `POST /api/auth/login`.
