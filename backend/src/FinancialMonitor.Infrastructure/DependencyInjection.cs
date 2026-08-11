using FinancialMonitor.Core.Interfaces;
using FinancialMonitor.Infrastructure.Data;
using FinancialMonitor.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FinancialMonitor.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? "Data Source=financialmonitor.db";

        services.AddDbContextFactory<FinancialMonitorDbContext>(options =>
            options.UseSqlite(connectionString));

        services.AddSingleton<ITransactionRepository, EFSqliteTransactionRepository>();
        return services;
    }
}
