using FinancialMonitor.Core.Models;

namespace FinancialMonitor.Core.Validation;

public static class TransactionValidator
{
    public static void Validate(TransactionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.TransactionId == Guid.Empty)
        {
            throw new ArgumentException("TransactionId must be a valid GUID.", nameof(request));
        }

        if (request.Amount <= 0)
        {
            throw new ArgumentException("Amount must be greater than zero.", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.Currency) || request.Currency.Length != 3)
        {
            throw new ArgumentException("Currency must be a 3-letter ISO code.", nameof(request));
        }

        if (!Enum.IsDefined(typeof(TransactionStatus), request.Status))
        {
            throw new ArgumentException("Status must be Pending, Completed, or Failed.", nameof(request));
        }
    }
}
