using FinancialMonitor.Core.Models;

namespace FinancialMonitor.Core.Interfaces;

public interface ITransactionService
{
    Task<Transaction> ProcessAsync(TransactionRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Transaction>> GetLatestAsync(int limit, CancellationToken cancellationToken = default);
}
