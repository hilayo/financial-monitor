namespace FinancialMonitor.Core.Models;

public record TransactionRequest(
    Guid TransactionId,
    decimal Amount,
    string Currency,
    TransactionStatus Status,
    DateTimeOffset Timestamp
);
