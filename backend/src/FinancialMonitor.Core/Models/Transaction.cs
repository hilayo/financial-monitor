namespace FinancialMonitor.Core.Models;

public record Transaction(
    Guid TransactionId,
    decimal Amount,
    string Currency,
    TransactionStatus Status,
    DateTimeOffset Timestamp
);
