using FinancialMonitor.Core.Models;
using FinancialMonitor.Infrastructure.Data;
using FinancialMonitor.Infrastructure.Repositories;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace FinancialMonitor.Tests.Repositories;

public class EfTransactionRepositoryTests : IAsyncLifetime
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"fm-test-{Guid.NewGuid():N}.db");
    private EFSqliteTransactionRepository _repository = null!;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<FinancialMonitorDbContext>()
            .UseSqlite($"Data Source={_dbPath}")
            .Options;

        _repository = new EFSqliteTransactionRepository(new TestDbContextFactory(options));
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
    public async Task AddAsync_ThenGetPagedAsync_ReturnsTransaction()
    {
        var transaction = CreateTransaction();

        await _repository.AddAsync(transaction);
        var results = await _repository.GetPagedAsync(1, 10);

        results.Items.Should().ContainSingle()
            .Which.Should().BeEquivalentTo(transaction);
        results.TotalCount.Should().Be(1);
        results.Page.Should().Be(1);
        results.PageSize.Should().Be(10);
    }

    [Fact]
    public async Task GetPagedAsync_ReturnsMostRecentFirst()
    {
        var older = CreateTransaction(timestamp: DateTimeOffset.UtcNow.AddMinutes(-5));
        var newer = CreateTransaction(timestamp: DateTimeOffset.UtcNow);

        await _repository.AddAsync(older);
        await _repository.AddAsync(newer);

        var results = await _repository.GetPagedAsync(1, 10);

        results.Items.Should().HaveCount(2);
        results.Items[0].TransactionId.Should().Be(newer.TransactionId);
        results.Items[1].TransactionId.Should().Be(older.TransactionId);
    }

    [Fact]
    public async Task GetPagedAsync_RespectsPageSizeAndOffset()
    {
        for (var i = 0; i < 5; i++)
        {
            await _repository.AddAsync(CreateTransaction(timestamp: DateTimeOffset.UtcNow.AddSeconds(i)));
        }

        var page1 = await _repository.GetPagedAsync(1, 2);
        var page2 = await _repository.GetPagedAsync(2, 2);
        var page3 = await _repository.GetPagedAsync(3, 2);

        page1.Items.Should().HaveCount(2);
        page2.Items.Should().HaveCount(2);
        page3.Items.Should().HaveCount(1);
        page1.TotalCount.Should().Be(5);
        page1.HasNextPage.Should().BeTrue();
        page3.HasNextPage.Should().BeFalse();
        page1.Items.Select(t => t.TransactionId)
            .Intersect(page2.Items.Select(t => t.TransactionId))
            .Should().BeEmpty();
    }

    [Fact]
    public async Task AddAsync_ConcurrentWrites_DoNotLoseData()
    {
        const int count = 10;
        var transactions = Enumerable.Range(0, count)
            .Select(i => CreateTransaction(timestamp: DateTimeOffset.UtcNow.AddSeconds(i)))
            .ToList();

        await Task.WhenAll(transactions.Select(t => _repository.AddAsync(t)));

        var results = await _repository.GetPagedAsync(1, count);

        results.Items.Should().HaveCount(count);
        results.TotalCount.Should().Be(count);
        results.Items.Select(r => r.TransactionId)
            .Should().BeEquivalentTo(transactions.Select(t => t.TransactionId));
    }

    private sealed class TestDbContextFactory : IDbContextFactory<FinancialMonitorDbContext>
    {
        private readonly DbContextOptions<FinancialMonitorDbContext> _options;

        public TestDbContextFactory(DbContextOptions<FinancialMonitorDbContext> options)
        {
            _options = options;
        }

        public FinancialMonitorDbContext CreateDbContext() => new(_options);

        public ValueTask<FinancialMonitorDbContext> CreateDbContextAsync(CancellationToken cancellationToken = default) =>
            new(new FinancialMonitorDbContext(_options));
    }
}
