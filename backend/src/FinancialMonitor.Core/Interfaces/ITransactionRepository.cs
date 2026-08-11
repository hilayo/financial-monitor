using FinancialMonitor.Core.Models;

namespace FinancialMonitor.Core.Interfaces;

public interface ITransactionRepository
{
    Task AddAsync(Transaction transaction, CancellationToken cancellationToken = default);
    Task<PagedResult<Transaction>> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken = default);
    Task InitializeAsync(CancellationToken cancellationToken = default);
}
