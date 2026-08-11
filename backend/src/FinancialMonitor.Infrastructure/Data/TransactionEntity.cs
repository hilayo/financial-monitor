using FinancialMonitor.Core.Models;

namespace FinancialMonitor.Infrastructure.Data;

public sealed class TransactionEntity
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public TransactionStatus Status { get; set; }
    public string Timestamp { get; set; } = string.Empty;

    public static TransactionEntity FromDomain(Transaction transaction) => new()
    {
        Id = transaction.TransactionId,
        Amount = transaction.Amount,
        Currency = transaction.Currency,
        Status = transaction.Status,
        Timestamp = transaction.Timestamp.ToUniversalTime().ToString("O")
    };

    public Transaction ToDomain() => new(
        Id,
        Amount,
        Currency,
        Status,
        DateTimeOffset.Parse(Timestamp));
}
