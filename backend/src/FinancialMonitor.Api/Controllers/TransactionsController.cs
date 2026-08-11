using FinancialMonitor.Core.Interfaces;
using FinancialMonitor.Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace FinancialMonitor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;

    public TransactionsController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(Transaction), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Transaction>> Create(
        [FromBody] TransactionRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var transaction = await _transactionService.ProcessAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetLatest), new { id = transaction.TransactionId }, transaction);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<Transaction>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<Transaction>>> GetLatest(
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var transactions = await _transactionService.GetLatestAsync(limit, cancellationToken);
            return Ok(transactions);
        }
        catch (ArgumentOutOfRangeException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
