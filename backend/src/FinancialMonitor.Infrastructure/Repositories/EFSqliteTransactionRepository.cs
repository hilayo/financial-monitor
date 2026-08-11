using FinancialMonitor.Core.Interfaces;
using FinancialMonitor.Core.Models;
using FinancialMonitor.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FinancialMonitor.Infrastructure.Repositories;

public sealed class EFSqliteTransactionRepository : ITransactionRepository
{
    private readonly IDbContextFactory<FinancialMonitorDbContext> _contextFactory;
    private readonly SemaphoreSlim _writeLock = new(1, 1);

    public EFSqliteTransactionRepository(IDbContextFactory<FinancialMonitorDbContext> contextFactory)
    {
        _contextFactory = contextFactory;
    }

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        await using var context = await _contextFactory.CreateDbContextAsync(cancellationToken);
        await context.Database.EnsureCreatedAsync(cancellationToken);
        await ConfigureSqliteAsync(context, cancellationToken);
    }

    public async Task AddAsync(Transaction transaction, CancellationToken cancellationToken = default)
    {
        await _writeLock.WaitAsync(cancellationToken);
        try
        {
            await using var context = await _contextFactory.CreateDbContextAsync(cancellationToken);
            await ConfigureSqliteAsync(context, cancellationToken);

            context.Transactions.Add(TransactionEntity.FromDomain(transaction));
            await context.SaveChangesAsync(cancellationToken);
        }
        finally
        {
            _writeLock.Release();
        }
    }

    public async Task<IReadOnlyList<Transaction>> GetLatestAsync(int limit, CancellationToken cancellationToken = default)
    {
        await using var context = await _contextFactory.CreateDbContextAsync(cancellationToken);
        await ConfigureSqliteAsync(context, cancellationToken);

        return await context.Transactions
            .AsNoTracking()
            .OrderByDescending(t => t.Timestamp)
            .Take(limit)
            .Select(t => t.ToDomain())
            .ToListAsync(cancellationToken);
    }

    private static async Task ConfigureSqliteAsync(FinancialMonitorDbContext context, CancellationToken cancellationToken)
    {
        await context.Database.OpenConnectionAsync(cancellationToken);
        await context.Database.ExecuteSqlRawAsync("PRAGMA journal_mode=WAL;", cancellationToken);
        await context.Database.ExecuteSqlRawAsync("PRAGMA busy_timeout=5000;", cancellationToken);
    }
}
