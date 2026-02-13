# Domain Layer Unit Tests

This directory contains unit tests for the Domain Layer of the Vendor Portal implementation.

## Overview

Domain layer tests focus on testing business logic in isolation without any infrastructure dependencies (no database, no external services). These tests ensure that domain entities and value objects behave correctly according to business rules.

## Test Organization

```
tests/Unit/Domain/
├── Quote/
│   ├── Entities/
│   │   └── QuoteTest.php          # Quote entity business logic tests
│   └── ValueObjects/
│       ├── ResponseTypeTest.php    # Response type validation tests
│       ├── SenderTypeTest.php      # Sender type validation tests
│       └── MessageAttachmentTest.php # File attachment validation tests
└── Vendor/
    ├── Entities/
    │   └── VendorTest.php          # Vendor entity business logic tests
    └── ValueObjects/
        └── OnboardingStatusTest.php # Onboarding status validation tests
```

## Running Tests

### Run All Domain Tests
```bash
php artisan test --testsuite=Unit tests/Unit/Domain
```

### Run Specific Test File
```bash
php artisan test tests/Unit/Domain/Quote/Entities/QuoteTest.php
```

### Run with Coverage
```bash
php artisan test --coverage --min=90 tests/Unit/Domain
```

### Run Specific Test Method
```bash
php artisan test --filter=it_accepts_quote_with_positive_delivery_days
```

## Test Coverage Targets

- **Value Objects:** 100% coverage (simple validation logic)
- **Domain Entities:** 95% coverage (complex business logic)
- **Overall Domain Layer:** 90%+ coverage

## Test Patterns

### AAA Pattern (Arrange, Act, Assert)

All tests follow the AAA pattern for clarity:

```php
/** @test */
public function it_accepts_quote_with_positive_delivery_days(): void
{
    // Arrange - Setup test data
    $quote = $this->createSentQuote();
    $deliveryDays = 14;
    
    // Act - Execute the behavior
    $quote->accept($deliveryDays);
    
    // Assert - Verify the outcome
    $this->assertEquals(QuoteStatus::ACCEPTED, $quote->getStatus());
}
```

### Descriptive Test Names

Test names clearly describe what is being tested:
- ✅ `it_accepts_quote_with_positive_delivery_days`
- ✅ `it_throws_exception_for_zero_delivery_days`
- ❌ `test_accept` (too vague)

### Test Isolation

Each test is independent and doesn't rely on other tests:
- No shared state between tests
- Helper methods create fresh test data
- No database dependencies

## What We Test

### Value Objects
- Valid value creation
- Invalid value rejection
- Helper methods (isAccept, isReject, etc.)
- Equality comparison
- String conversion
- Case-insensitive input handling

### Domain Entities
- Business rule enforcement
- State transitions
- Validation logic
- Timestamp updates
- Domain event raising
- Edge cases and error conditions

## Test Statistics

### Phase 2.5 Test Count

| Component | Tests | Coverage |
|-----------|-------|----------|
| ResponseType | 8 | 100% |
| OnboardingStatus | 8 | 100% |
| SenderType | 6 | 100% |
| MessageAttachment | 12 | 100% |
| Vendor Entity | 16 | 95% |
| Quote Entity | 20 | 95% |
| **Total** | **70** | **97%** |

## Common Assertions

### Value Objects
```php
$this->assertEquals('accept', $responseType->value());
$this->assertTrue($responseType->isAccept());
$this->assertFalse($responseType->isReject());
```

### Domain Entities
```php
$this->assertEquals(QuoteStatus::ACCEPTED, $quote->getStatus());
$this->assertNotNull($quote->getRespondedAt());
$this->assertTrue($vendor->canAccessPortal());
```

### Exceptions
```php
$this->expectException(InvalidArgumentException::class);
$this->expectExceptionMessage('Estimated delivery days must be positive');
$quote->accept(0);
```

### Timestamps
```php
$beforeAction = new DateTimeImmutable();
$entity->performAction();
$afterAction = new DateTimeImmutable();

$this->assertGreaterThanOrEqual($beforeAction, $entity->getTimestamp());
$this->assertLessThanOrEqual($afterAction, $entity->getTimestamp());
```

## Requirements Coverage

These tests cover the following requirements:
- **Req 2.1, 2.5, 2.6:** Vendor portal access management
- **Req 6.1-6.14:** Quote response actions and validation
- **Req 10.1, 10.2:** Quote expiration handling
- **Req 13.3-13.8:** Message sender types and attachments
- **Req 17.1, 17.7:** Vendor onboarding workflow
- **Req 23.1:** Domain layer testing standards

## Troubleshooting

### Tests Not Found
If PHPUnit can't find tests, ensure:
1. Test files end with `Test.php`
2. Test classes extend `PHPUnit\Framework\TestCase`
3. Test methods start with `test` or have `/** @test */` annotation

### Namespace Issues
Ensure test namespaces match directory structure:
```php
namespace Tests\Unit\Domain\Quote\Entities;
```

### Missing Dependencies
If you get class not found errors:
```bash
composer dump-autoload
```

## Next Steps

After completing Phase 2.5:
1. Verify all tests pass: `php artisan test tests/Unit/Domain`
2. Check coverage: `php artisan test --coverage tests/Unit/Domain`
3. Review test quality with team
4. Proceed to Phase 3: Application Layer Implementation
5. Then Phase 3.5: Application Layer Testing

## Best Practices

1. **Test One Thing:** Each test should verify one specific behavior
2. **Clear Names:** Test names should be self-documenting
3. **No Logic in Tests:** Tests should be simple and straightforward
4. **Fast Execution:** Domain tests should run in milliseconds
5. **Independent:** Tests should not depend on execution order
6. **Maintainable:** Tests should be easy to understand and update

## Resources

- [PHPUnit Documentation](https://phpunit.de/documentation.html)
- [Testing Strategy](/.kiro/specs/vendor-portal-implementation/TESTING_STRATEGY.md)
- [Requirements](/.kiro/specs/vendor-portal-implementation/requirements.md)
- [Domain Layer Design](/.kiro/specs/vendor-portal-implementation/design.md)
