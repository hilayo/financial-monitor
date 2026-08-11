using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace FinancialMonitor.Api.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception while processing request");

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = ex switch
            {
                ArgumentOutOfRangeException => StatusCodes.Status400BadRequest,
                ArgumentException => StatusCodes.Status400BadRequest,
                _ => StatusCodes.Status500InternalServerError
            };

            var payload = new { error = ex.Message };
            var json = JsonSerializer.Serialize(payload, _jsonOptions);
            await context.Response.WriteAsync(json);
        }
    }
}
