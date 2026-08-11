using FinancialMonitor.Core.Models;

namespace FinancialMonitor.Core.Interfaces;

public interface ITransactionService
{
    Task<Transaction> ProcessAsync(TransactionRequest request, CancellationToken cancellationToken = default);
    Task<PagedResult<Transaction>> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken = default);
}
