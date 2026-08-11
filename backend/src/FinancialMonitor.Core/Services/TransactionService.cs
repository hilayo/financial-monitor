using FinancialMonitor.Core.Interfaces;
using FinancialMonitor.Core.Models;
using FinancialMonitor.Core.Validation;

namespace FinancialMonitor.Core.Services;

public sealed class TransactionService : ITransactionService
{
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

    public Task<IReadOnlyList<Transaction>> GetLatestAsync(int limit, CancellationToken cancellationToken = default)
    {
        if (limit <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(limit), "Limit must be greater than zero.");
        }

        return _repository.GetLatestAsync(limit, cancellationToken);
    }
}
