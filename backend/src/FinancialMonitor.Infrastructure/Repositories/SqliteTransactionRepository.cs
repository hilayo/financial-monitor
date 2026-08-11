using FinancialMonitor.Core.Interfaces;
using FinancialMonitor.Core.Models;
using Microsoft.Data.Sqlite;

namespace FinancialMonitor.Infrastructure.Repositories;

public sealed class SqliteTransactionRepository : ITransactionRepository
{
    private readonly string _connectionString;
    private readonly SemaphoreSlim _writeLock = new(1, 1);
    private readonly SemaphoreSlim _initializationLock = new(1, 1);
    private bool _initialized;

    public SqliteTransactionRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        if (_initialized)
        {
            return;
        }

        await _initializationLock.WaitAsync(cancellationToken);
        try
        {
            if (_initialized)
            {
                return;
            }

            await using var connection = CreateConnection();
            await connection.OpenAsync(cancellationToken);

            // WAL is a database-level setting; apply it once during initialization.
            await ExecutePragmaAsync(connection, "PRAGMA journal_mode=WAL;", cancellationToken);
            await ExecutePragmaAsync(connection, "PRAGMA busy_timeout=5000;", cancellationToken);

            var createTable = connection.CreateCommand();
            createTable.CommandText = """
                CREATE TABLE IF NOT EXISTS transactions (
                    id TEXT PRIMARY KEY,
                    amount REAL NOT NULL,
                    currency TEXT NOT NULL,
                    status TEXT NOT NULL,
                    timestamp TEXT NOT NULL
                );
                """;
            await createTable.ExecuteNonQueryAsync(cancellationToken);

            var createIndex = connection.CreateCommand();
            createIndex.CommandText = """
                CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
                """;
            await createIndex.ExecuteNonQueryAsync(cancellationToken);

            _initialized = true;
        }
        finally
        {
            _initializationLock.Release();
        }
    }

    public async Task AddAsync(Transaction transaction, CancellationToken cancellationToken = default)
    {
        await _writeLock.WaitAsync(cancellationToken);
        try
        {
            await using var connection = CreateConnection();
            await connection.OpenAsync(cancellationToken);
            await ExecutePragmaAsync(connection, "PRAGMA busy_timeout=5000;", cancellationToken);

            var command = connection.CreateCommand();
            command.CommandText = """
                INSERT INTO transactions (id, amount, currency, status, timestamp)
                VALUES ($id, $amount, $currency, $status, $timestamp)
                """;
            command.Parameters.AddWithValue("$id", transaction.TransactionId.ToString());
            command.Parameters.AddWithValue("$amount", transaction.Amount);
            command.Parameters.AddWithValue("$currency", transaction.Currency);
            command.Parameters.AddWithValue("$status", transaction.Status.ToString());
            command.Parameters.AddWithValue("$timestamp", transaction.Timestamp.ToUniversalTime().ToString("O"));

            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            _writeLock.Release();
        }
    }

    public async Task<IReadOnlyList<Transaction>> GetLatestAsync(int limit, CancellationToken cancellationToken = default)
    {
        await using var connection = CreateReadOnlyConnection();
        await connection.OpenAsync(cancellationToken);
        await ExecutePragmaAsync(connection, "PRAGMA busy_timeout=5000;", cancellationToken);

        var command = connection.CreateCommand();
        command.CommandText = """
            SELECT id, amount, currency, status, timestamp
            FROM transactions
            ORDER BY timestamp DESC
            LIMIT $limit
            """;
        command.Parameters.AddWithValue("$limit", limit);

        var results = new List<Transaction>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            results.Add(new Transaction(
                Guid.Parse(reader.GetString(0)),
                reader.GetDecimal(1),
                reader.GetString(2),
                Enum.Parse<TransactionStatus>(reader.GetString(3)),
                DateTimeOffset.Parse(reader.GetString(4))));
        }

        return results;
    }

    private SqliteConnection CreateConnection() => new(_connectionString);

    private SqliteConnection CreateReadOnlyConnection()
    {
        var builder = new SqliteConnectionStringBuilder(_connectionString)
        {
            Mode = SqliteOpenMode.ReadOnly
        };
        return new SqliteConnection(builder.ConnectionString);
    }

    private static async Task ExecutePragmaAsync(
        SqliteConnection connection,
        string pragma,
        CancellationToken cancellationToken)
    {
        var command = connection.CreateCommand();
        command.CommandText = pragma;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
