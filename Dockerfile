# ─── Stage 1: Build the .NET API ─────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS api-build
WORKDIR /src

COPY backend/OSLMP.API/OSLMP.API.csproj ./OSLMP.API/
RUN dotnet restore ./OSLMP.API/OSLMP.API.csproj

COPY backend/OSLMP.API/ ./OSLMP.API/
RUN dotnet publish ./OSLMP.API/OSLMP.API.csproj \
        -c Release \
        -o /app/api \
        --no-restore

# ─── Stage 2: Build the React frontend ───────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /src

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ─── Stage 3: Runtime — nginx + supervisord to run both processes ─────────────
FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS runtime

# Install nginx and supervisor
RUN apt-get update && apt-get install -y --no-install-recommends \
        nginx \
        supervisor \
    && rm -rf /var/lib/apt/lists/*

# Copy API publish output
COPY --from=api-build /app/api /app/api

# Copy built frontend into nginx web root
COPY --from=frontend-build /src/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -f /etc/nginx/sites-enabled/default

# Supervisor config — manages both nginx and the .NET process
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
