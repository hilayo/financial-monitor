# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /src/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build backend
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS backend-build
WORKDIR /src
COPY backend/FinancialMonitor.slnx  ./
COPY backend/src/FinancialMonitor.Core/FinancialMonitor.Core.csproj ./src/FinancialMonitor.Core/
COPY backend/src/FinancialMonitor.Infrastructure/FinancialMonitor.Infrastructure.csproj ./src/FinancialMonitor.Infrastructure/
COPY backend/src/FinancialMonitor.Api/FinancialMonitor.Api.csproj ./src/FinancialMonitor.Api/
RUN dotnet restore src/FinancialMonitor.Api/FinancialMonitor.Api.csproj
COPY backend/src/ ./src/
COPY --from=frontend-build /src/frontend/dist ./src/FinancialMonitor.Api/wwwroot/
RUN dotnet publish src/FinancialMonitor.Api/FinancialMonitor.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ConnectionStrings__Default="Data Source=/app/data/financialmonitor.db"
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir -p /app/data && chown -R appuser:appgroup /app/data
COPY --from=backend-build /app/publish .
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1
ENTRYPOINT ["dotnet", "FinancialMonitor.Api.dll"]
