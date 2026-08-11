using FinancialMonitor.Core.Models;
using FinancialMonitor.Infrastructure.Repositories;
using FluentAssertions;
using Microsoft.Data.Sqlite;

namespace FinancialMonitor.Tests.Repositories;

public class SqliteTransactionRepositoryTests : IAsyncLifetime
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"fm-test-{Guid.NewGuid():N}.db");
    private SqliteTransactionRepository _repository = null!;

    public async Task InitializeAsync()
    {
        _repository = new SqliteTransactionRepository($"Data Source={_dbPath}");
        await _repository.InitializeAsync();
    }

    public Task DisposeAsync()
    {
        SqliteConnection.ClearAllPools();

        if (File.Exists(_dbPath))
        {
            File.Delete(_dbPath);
        }

        return Task.CompletedTask;
    }

    private static Transaction CreateTransaction(Guid? id = null, DateTimeOffset? timestamp = null) =>
        new(
            id ?? Guid.NewGuid(),
            100.50m,
            "USD",
            TransactionStatus.Completed,
            timestamp ?? DateTimeOffset.UtcNow);

    [Fact]
    public async Task AddAsync_ThenGetLatestAsync_ReturnsTransaction()
    {
        var transaction = CreateTransaction();

        await _repository.AddAsync(transaction);
        var results = await _repository.GetLatestAsync(10);

        results.Should().ContainSingle()
            .Which.Should().BeEquivalentTo(transaction);
    }

    [Fact]
    public async Task GetLatestAsync_ReturnsMostRecentFirst()
    {
        var older = CreateTransaction(timestamp: DateTimeOffset.UtcNow.AddMinutes(-5));
        var newer = CreateTransaction(timestamp: DateTimeOffset.UtcNow);

        await _repository.AddAsync(older);
        await _repository.AddAsync(newer);

        var results = await _repository.GetLatestAsync(10);

        results.Should().HaveCount(2);
        results[0].TransactionId.Should().Be(newer.TransactionId);
        results[1].TransactionId.Should().Be(older.TransactionId);
    }

    [Fact]
    public async Task GetLatestAsync_RespectsLimit()
    {
        for (var i = 0; i < 5; i++)
        {
            await _repository.AddAsync(CreateTransaction(timestamp: DateTimeOffset.UtcNow.AddSeconds(i)));
        }

        var results = await _repository.GetLatestAsync(3);

        results.Should().HaveCount(3);
    }

    [Fact]
    public async Task AddAsync_ConcurrentWrites_DoNotLoseData()
    {
        const int count = 10;
        var transactions = Enumerable.Range(0, count)
            .Select(i => CreateTransaction(timestamp: DateTimeOffset.UtcNow.AddSeconds(i)))
            .ToList();

        await Task.WhenAll(transactions.Select(t => _repository.AddAsync(t)));

        var results = await _repository.GetLatestAsync(count);

        results.Should().HaveCount(count);
        results.Select(r => r.TransactionId)
            .Should().BeEquivalentTo(transactions.Select(t => t.TransactionId));
    }
}
