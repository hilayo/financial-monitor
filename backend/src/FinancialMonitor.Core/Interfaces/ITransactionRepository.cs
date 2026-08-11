using FinancialMonitor.Core.Models;

namespace FinancialMonitor.Core.Interfaces;

public interface ITransactionRepository
{
    Task AddAsync(Transaction transaction, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Transaction>> GetLatestAsync(int limit, CancellationToken cancellationToken = default);
    Task InitializeAsync(CancellationToken cancellationToken = default);
}
