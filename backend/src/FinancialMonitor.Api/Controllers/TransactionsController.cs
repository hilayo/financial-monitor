using FinancialMonitor.Core.Interfaces;
using FinancialMonitor.Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace FinancialMonitor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;
    private readonly ILogger<TransactionsController> _logger;

    public TransactionsController(
        ITransactionService transactionService,
        ILogger<TransactionsController> logger)
    {
        _transactionService = transactionService;
        _logger = logger;
    }

    [HttpPost]
    [ProducesResponseType(typeof(Transaction), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Transaction>> Create(
        [FromBody] TransactionRequest request,
        CancellationToken cancellationToken)
    {
        //_logger.LogInformation(
        //    "Creating transaction. TransactionId={TransactionId}, Amount={Amount}, Currency={Currency}, Status={Status}",
        //    request.TransactionId,
        //    request.Amount,
        //    request.Currency,
        //    request.Status);

        var transaction = await _transactionService.ProcessAsync(request, cancellationToken);

        //_logger.LogInformation(
        //    "Transaction created. TransactionId={TransactionId}, Status={Status}",
        //    transaction.TransactionId,
        //    transaction.Status);

        return CreatedAtAction(nameof(GetPaged), new { id = transaction.TransactionId }, transaction);
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<Transaction>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResult<Transaction>>> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Fetching paged transactions. Page={Page}, PageSize={PageSize}", page, pageSize);

        var result = await _transactionService.GetPagedAsync(page, pageSize, cancellationToken);

        _logger.LogInformation(
            "Returned {Count} transactions. Page={Page}/{TotalPages}, TotalCount={TotalCount}",
            result.Items.Count,
            result.Page,
            result.TotalPages,
            result.TotalCount);

        return Ok(result);
    }
}
