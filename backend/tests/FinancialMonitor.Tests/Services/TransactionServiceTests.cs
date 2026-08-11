using FinancialMonitor.Core.Interfaces;
using FinancialMonitor.Core.Models;
using FinancialMonitor.Core.Services;
using FluentAssertions;
using Moq;

namespace FinancialMonitor.Tests.Services;

public class TransactionServiceTests
{
    private readonly Mock<ITransactionRepository> _repository = new();
    private readonly Mock<ITransactionBroadcaster> _broadcaster = new();
    private readonly TransactionService _service;

    public TransactionServiceTests()
    {
        _service = new TransactionService(_repository.Object, _broadcaster.Object);
    }

    private static TransactionRequest ValidRequest() => new(
        Guid.NewGuid(),
        1500.50m,
        "usd",
        TransactionStatus.Pending,
        DateTimeOffset.Parse("2024-01-15T10:00:00Z"));

    [Fact]
    public async Task ProcessAsync_WithValidRequest_PersistsAndBroadcasts()
    {
        var request = ValidRequest();

        var result = await _service.ProcessAsync(request);

        result.TransactionId.Should().Be(request.TransactionId);
        result.Amount.Should().Be(request.Amount);
        result.Currency.Should().Be("USD");
        result.Status.Should().Be(request.Status);

        _repository.Verify(r => r.AddAsync(It.Is<Transaction>(t => t.TransactionId == request.TransactionId), It.IsAny<CancellationToken>()), Times.Once);
        _broadcaster.Verify(b => b.BroadcastAsync(It.Is<Transaction>(t => t.TransactionId == request.TransactionId), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessAsync_WithInvalidAmount_ThrowsAndDoesNotPersist()
    {
        var request = ValidRequest() with { Amount = 0 };

        var act = async () => await _service.ProcessAsync(request);

        await act.Should().ThrowAsync<ArgumentException>();
        _repository.Verify(r => r.AddAsync(It.IsAny<Transaction>(), It.IsAny<CancellationToken>()), Times.Never);
        _broadcaster.Verify(b => b.BroadcastAsync(It.IsAny<Transaction>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetPagedAsync_DelegatesToRepository()
    {
        var expected = new PagedResult<Transaction>
        {
            Items = [new(Guid.NewGuid(), 10, "USD", TransactionStatus.Completed, DateTimeOffset.UtcNow)],
            Page = 1,
            PageSize = 5,
            TotalCount = 1
        };
        _repository.Setup(r => r.GetPagedAsync(1, 5, It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var results = await _service.GetPagedAsync(1, 5);

        results.Should().BeSameAs(expected);
    }

    [Theory]
    [InlineData(0, 10)]
    [InlineData(-1, 10)]
    [InlineData(1, 0)]
    [InlineData(1, -5)]
    [InlineData(1, 201)]
    public async Task GetPagedAsync_WithInvalidPaging_Throws(int page, int pageSize)
    {
        var act = async () => await _service.GetPagedAsync(page, pageSize);

        await act.Should().ThrowAsync<ArgumentOutOfRangeException>();
        _repository.Verify(r => r.GetPagedAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
