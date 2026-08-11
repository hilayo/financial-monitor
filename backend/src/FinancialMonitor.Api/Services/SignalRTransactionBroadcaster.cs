using FinancialMonitor.Api.Hubs;
using FinancialMonitor.Core.Interfaces;
using FinancialMonitor.Core.Models;
using Microsoft.AspNetCore.SignalR;

namespace FinancialMonitor.Api.Services;

public sealed class SignalRTransactionBroadcaster : ITransactionBroadcaster
{
    private readonly IHubContext<TransactionHub> _hubContext;

    public SignalRTransactionBroadcaster(IHubContext<TransactionHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task BroadcastAsync(Transaction transaction, CancellationToken cancellationToken = default) =>
        _hubContext.Clients.All.SendAsync("TransactionReceived", transaction, cancellationToken);
}
