using Microsoft.EntityFrameworkCore;

namespace FinancialMonitor.Infrastructure.Data;

public sealed class FinancialMonitorDbContext : DbContext
{
    public FinancialMonitorDbContext(DbContextOptions<FinancialMonitorDbContext> options)
        : base(options)
    {
    }

    public DbSet<TransactionEntity> Transactions => Set<TransactionEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TransactionEntity>(entity =>
        {
            entity.ToTable("transactions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Amount).HasColumnName("amount");
            entity.Property(e => e.Currency).HasColumnName("currency").IsRequired();
            entity.Property(e => e.Status).HasColumnName("status").HasConversion<string>();
            entity.Property(e => e.Timestamp).HasColumnName("timestamp");
            entity.HasIndex(e => e.Timestamp).IsDescending();
        });
    }
}
