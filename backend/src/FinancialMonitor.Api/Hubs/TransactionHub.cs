using FinancialMonitor.Core.Interfaces;
using FinancialMonitor.Core.Models;
using Microsoft.AspNetCore.SignalR;

namespace FinancialMonitor.Api.Hubs;

public class TransactionHub : Hub
{
    private readonly ITransactionService _transactionService;

    public TransactionHub(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    public async Task JoinDashboard()
    {
        var snapshot = await _transactionService.GetLatestAsync(50);
        await Clients.Caller.SendAsync("InitialSnapshot", snapshot);
    }
}
