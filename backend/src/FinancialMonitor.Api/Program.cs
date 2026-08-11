using FinancialMonitor.Api.Hubs;
using FinancialMonitor.Api.Services;
using FinancialMonitor.Core.Interfaces;
using FinancialMonitor.Core.Services;
using FinancialMonitor.Infrastructure;
using Serilog;
using System.Text.Json;
using System.Text.Json.Serialization;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("Logs/log-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddSingleton<ITransactionBroadcaster, SignalRTransactionBroadcaster>();

var redisConnection = builder.Configuration["Redis:ConnectionString"];
var signalRBuilder = builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
//Redis backplane for multi-replica
if (!string.IsNullOrWhiteSpace(redisConnection))
{
    signalRBuilder.AddStackExchangeRedis(redisConnection);
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
            ?? ["http://localhost:5173", "http://localhost:5175", "http://localhost:3000"];

        // Vite may bump the port when 5173 is busy; allow any localhost origin in Development.
        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(static origin =>
            {
                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                {
                    return false;
                }

                return uri.Host is "localhost" or "127.0.0.1";
            });
        }
        else
        {
            policy.WithOrigins(origins);
        }

        policy.AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddHealthChecks();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var repository = scope.ServiceProvider.GetRequiredService<ITransactionRepository>();
    await repository.InitializeAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("Frontend");

// Global exception handling middleware
app.UseMiddleware<FinancialMonitor.Api.Middleware.ExceptionHandlingMiddleware>();

app.MapHealthChecks("/health");
app.MapControllers();
app.MapHub<TransactionHub>("/hubs/transactions");

app.MapFallbackToFile("index.html");

app.Run();

public partial class Program;
