using FinancialMonitor.Core.Models;

namespace FinancialMonitor.Core.Interfaces;

public interface ITransactionBroadcaster
{
    Task BroadcastAsync(Transaction transaction, CancellationToken cancellationToken = default);
}
