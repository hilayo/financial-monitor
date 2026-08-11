using FinancialMonitor.Core.Interfaces;
using FinancialMonitor.Core.Models;
using FinancialMonitor.Core.Validation;

namespace FinancialMonitor.Core.Services;

public sealed class TransactionService : ITransactionService
{
    private const int MaxPageSize = 200;

    private readonly ITransactionRepository _repository;
    private readonly ITransactionBroadcaster _broadcaster;

    public TransactionService(ITransactionRepository repository, ITransactionBroadcaster broadcaster)
    {
        _repository = repository;
        _broadcaster = broadcaster;
    }

    public async Task<Transaction> ProcessAsync(TransactionRequest request, CancellationToken cancellationToken = default)
    {
        TransactionValidator.Validate(request);

        var transaction = new Transaction(
            request.TransactionId,
            request.Amount,
            request.Currency.ToUpperInvariant(),
            request.Status,
            request.Timestamp.ToUniversalTime());

        await _repository.AddAsync(transaction, cancellationToken);
        await _broadcaster.BroadcastAsync(transaction, cancellationToken);

        return transaction;
    }

    public Task<PagedResult<Transaction>> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        if (page <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(page), "Page must be greater than zero.");
        }

        if (pageSize <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(pageSize), "Page size must be greater than zero.");
        }

        if (pageSize > MaxPageSize)
        {
            throw new ArgumentOutOfRangeException(nameof(pageSize), $"Page size must not exceed {MaxPageSize}.");
        }

        return _repository.GetPagedAsync(page, pageSize, cancellationToken);
    }
}
