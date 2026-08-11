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

    public async Task<PagedResult<Transaction>> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        await using var context = await _contextFactory.CreateDbContextAsync(cancellationToken);
        await ConfigureSqliteAsync(context, cancellationToken);

        var query = context.Transactions.AsNoTracking();
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(t => t.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => t.ToDomain())
            .ToListAsync(cancellationToken);

        return new PagedResult<Transaction>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    private static async Task ConfigureSqliteAsync(FinancialMonitorDbContext context, CancellationToken cancellationToken)
    {
        await context.Database.OpenConnectionAsync(cancellationToken);
        await context.Database.ExecuteSqlRawAsync("PRAGMA journal_mode=WAL;", cancellationToken);
        await context.Database.ExecuteSqlRawAsync("PRAGMA busy_timeout=5000;", cancellationToken);
    }
}
