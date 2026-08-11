using FinancialMonitor.Core.Models;
using FinancialMonitor.Core.Validation;
using FluentAssertions;

namespace FinancialMonitor.Tests.Validation;

public class TransactionValidationTests
{
    private static TransactionRequest ValidRequest() => new(
        Guid.NewGuid(),
        1500.50m,
        "USD",
        TransactionStatus.Pending,
        DateTimeOffset.Parse("2024-01-15T10:00:00Z"));

    [Fact]
    public void Validate_WithValidRequest_DoesNotThrow()
    {
        var act = () => TransactionValidator.Validate(ValidRequest());
        act.Should().NotThrow();
    }

    [Fact]
    public void Validate_WithZeroAmount_Throws()
    {
        var request = ValidRequest() with { Amount = 0 };
        var act = () => TransactionValidator.Validate(request);
        act.Should().Throw<ArgumentException>().WithMessage("*Amount*");
    }

    [Fact]
    public void Validate_WithNegativeAmount_Throws()
    {
        var request = ValidRequest() with { Amount = -10 };
        var act = () => TransactionValidator.Validate(request);
        act.Should().Throw<ArgumentException>().WithMessage("*Amount*");
    }

    [Fact]
    public void Validate_WithEmptyGuid_Throws()
    {
        var request = ValidRequest() with { TransactionId = Guid.Empty };
        var act = () => TransactionValidator.Validate(request);
        act.Should().Throw<ArgumentException>().WithMessage("*TransactionId*");
    }

    [Fact]
    public void Validate_WithInvalidCurrency_Throws()
    {
        var request = ValidRequest() with { Currency = "US" };
        var act = () => TransactionValidator.Validate(request);
        act.Should().Throw<ArgumentException>().WithMessage("*Currency*");
    }

    [Fact]
    public void Validate_WithEmptyCurrency_Throws()
    {
        var request = ValidRequest() with { Currency = "" };
        var act = () => TransactionValidator.Validate(request);
        act.Should().Throw<ArgumentException>().WithMessage("*Currency*");
    }
}
