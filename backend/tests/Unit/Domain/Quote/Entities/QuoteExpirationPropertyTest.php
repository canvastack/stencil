<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Quote\Entities;

use App\Domain\Quote\Entities\Quote;
use App\Domain\Quote\ValueObjects\QuoteStatus;
use Tests\TestCase;
use DateTimeImmutable;

/**
 * Property Test: New Quotes Set Expiration Date
 * 
 * **Property 32: New Quotes Set Expiration Date**
 * **Validates: Requirements 10.1**
 * 
 * For any newly created quote, the expires_at field should be set to the 
 * current date plus the tenant's configured expiration days (default 30).
 * 
 * This property test verifies that:
 * 1. Every new quote has an expiration date set
 * 2. Default expiration is 30 days from creation
 * 3. Custom expiration dates are respected
 * 4. Expiration date is in the future
 * 5. isExpired() returns false for new quotes
 */
class QuoteExpirationPropertyTest extends TestCase
{
    /**
     * Property: New quotes have expiration date set
     * 
     * @test
     */
    public function property_new_quotes_have_expiration_date(): void
    {
        // Run 100 iterations with different scenarios
        for ($i = 0; $i < 100; $i++) {
            // Create a quote without explicit expiration
            $quote = Quote::create(tenantId: rand(1, 100), orderId: rand(1, 1000), vendorId: rand(1, 100), productId: rand(1, 100), quantity: rand(1, 10),
                initialOffer: rand(100000, 1000000),
                quoteDetails: ['test' => 'data'],
                currency: 'IDR'
            );

            // Verify expiration date is set
            $this->assertNotNull($quote->getExpiresAt(), 'New quote should have expiration date');
            
            // Verify expiration is in the future
            $now = new DateTimeImmutable();
            $this->assertGreaterThan(
                $now,
                $quote->getExpiresAt(),
                'Expiration date should be in the future'
            );
            
            // Verify quote is not expired
            $this->assertFalse($quote->isExpired(), 'New quote should not be expired');
        }
    }

    /**
     * Property: Default expiration is 30 days from creation
     * 
     * @test
     */
    public function property_default_expiration_is_30_days(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $beforeCreation = new DateTimeImmutable();
            
            $quote = Quote::create(tenantId: rand(1, 100), orderId: rand(1, 1000), vendorId: rand(1, 100), productId: rand(1, 100), quantity: rand(1, 10)
            );
            
            $afterCreation = new DateTimeImmutable();
            
            // Calculate expected expiration range (30 days +/- 1 second for test execution time)
            $expectedMinExpiration = $beforeCreation->modify('+30 days')->modify('-1 second');
            $expectedMaxExpiration = $afterCreation->modify('+30 days')->modify('+1 second');
            
            $actualExpiration = $quote->getExpiresAt();
            
            // Verify expiration is approximately 30 days from creation
            $this->assertGreaterThanOrEqual(
                $expectedMinExpiration,
                $actualExpiration,
                'Expiration should be at least 30 days from creation'
            );
            
            $this->assertLessThanOrEqual(
                $expectedMaxExpiration,
                $actualExpiration,
                'Expiration should be at most 30 days from creation'
            );
            
            // Verify the difference is approximately 30 days (allow 1 day tolerance)
            $daysDifference = $actualExpiration->diff($quote->getCreatedAt())->days;
            $this->assertGreaterThanOrEqual(29, $daysDifference);
            $this->assertLessThanOrEqual(31, $daysDifference);
        }
    }

    /**
     * Property: Custom expiration dates are respected
     * 
     * @test
     */
    public function property_custom_expiration_dates_are_respected(): void
    {
        for ($i = 0; $i < 100; $i++) {
            // Generate random future date (1 to 90 days)
            $daysInFuture = rand(1, 90);
            $customExpiration = (new DateTimeImmutable())->modify("+{$daysInFuture} days");
            
            $quote = Quote::create(tenantId: rand(1, 100), orderId: rand(1, 1000), vendorId: rand(1, 100), productId: rand(1, 100), quantity: rand(1, 10),
                initialOffer: rand(100000, 1000000),
                quoteDetails: null,
                currency: 'IDR',
                expiresAt: $customExpiration
            );
            
            // Verify custom expiration is used
            $this->assertEquals(
                $customExpiration->format('Y-m-d H:i:s'),
                $quote->getExpiresAt()->format('Y-m-d H:i:s'),
                'Custom expiration date should be respected'
            );
            
            // Verify quote is not expired
            $this->assertFalse($quote->isExpired());
        }
    }

    /**
     * Property: Expiration date is always in the future for new quotes
     * 
     * @test
     */
    public function property_expiration_is_always_future_for_new_quotes(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $quote = Quote::create(tenantId: rand(1, 100), orderId: rand(1, 1000), vendorId: rand(1, 100), productId: rand(1, 100), quantity: rand(1, 10)
            );
            
            $now = new DateTimeImmutable();
            $expiresAt = $quote->getExpiresAt();
            
            // Verify expiration is after current time
            $this->assertGreaterThan(
                $now->getTimestamp(),
                $expiresAt->getTimestamp(),
                'Expiration timestamp should be greater than current timestamp'
            );
            
            // Verify at least 1 day in the future
            $secondsUntilExpiration = $expiresAt->getTimestamp() - $now->getTimestamp();
            $this->assertGreaterThan(
                86400, // 1 day in seconds
                $secondsUntilExpiration,
                'Expiration should be at least 1 day in the future'
            );
        }
    }

    /**
     * Property: isExpired() returns false for new quotes
     * 
     * @test
     */
    public function property_is_expired_returns_false_for_new_quotes(): void
    {
        for ($i = 0; $i < 100; $i++) {
            // Test with default expiration
            $quote1 = Quote::create(tenantId: rand(1, 100), orderId: rand(1, 1000), vendorId: rand(1, 100), productId: rand(1, 100), quantity: rand(1, 10)
            );
            
            $this->assertFalse(
                $quote1->isExpired(),
                'New quote with default expiration should not be expired'
            );
            
            // Test with custom future expiration
            $futureDate = (new DateTimeImmutable())->modify('+' . rand(1, 365) . ' days');
            $quote2 = Quote::create(tenantId: rand(1, 100), orderId: rand(1, 1000), vendorId: rand(1, 100), productId: rand(1, 100), quantity: rand(1, 10),
                expiresAt: $futureDate
            );
            
            $this->assertFalse(
                $quote2->isExpired(),
                'New quote with custom future expiration should not be expired'
            );
        }
    }

    /**
     * Property: Expiration date persists through status changes
     * 
     * @test
     */
    public function property_expiration_persists_through_status_changes(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $customExpiration = (new DateTimeImmutable())->modify('+45 days');
            
            $quote = Quote::create(tenantId: rand(1, 100), orderId: rand(1, 1000), vendorId: rand(1, 100), productId: rand(1, 100), quantity: rand(1, 10),
                expiresAt: $customExpiration
            );
            
            $originalExpiration = $quote->getExpiresAt();
            
            // Change status multiple times
            $quote->markAsSent(rand(1, 100));
            $this->assertEquals(
                $originalExpiration->format('Y-m-d H:i:s'),
                $quote->getExpiresAt()->format('Y-m-d H:i:s'),
                'Expiration should not change when marking as sent'
            );
            
            $quote->updateStatus(QuoteStatus::PENDING_RESPONSE, rand(1, 100));
            $this->assertEquals(
                $originalExpiration->format('Y-m-d H:i:s'),
                $quote->getExpiresAt()->format('Y-m-d H:i:s'),
                'Expiration should not change when updating status'
            );
            
            // Verify still not expired
            $this->assertFalse($quote->isExpired());
        }
    }

    /**
     * Property: Quotes with null expiration never expire
     * 
     * @test
     */
    public function property_null_expiration_never_expires(): void
    {
        for ($i = 0; $i < 100; $i++) {
            // Create quote with explicit null expiration
            $quote = Quote::create(tenantId: rand(1, 100), orderId: rand(1, 1000), vendorId: rand(1, 100), productId: rand(1, 100), quantity: rand(1, 10),
                initialOffer: null,
                quoteDetails: null,
                currency: 'IDR',
                expiresAt: null
            );
            
            // Note: The Quote::create method sets default expiration if null
            // So we need to test the isExpired() logic with reconstituted quotes
            $reconstitutedQuote = Quote::reconstitute(
                id: 1,
                uuid: $quote->getUuid(),
                tenantId: $quote->getTenantId(),
                orderId: $quote->getOrderId(),
                vendorId: $quote->getVendorId(),
                productId: rand(1, 100),
                quantity: rand(1, 10),
                specifications: [],
                notes: null,
                status: QuoteStatus::DRAFT->value,
                initialOffer: null,
                latestOffer: null,
                currency: 'IDR',
                quoteDetails: [],
                history: [],
                statusHistory: [],
                round: 1,
                sentAt: null,
                respondedAt: null,
                responseType: null,
                responseNotes: null,
                expiresAt: null, // Explicitly null
                closedAt: null,
                createdAt: new DateTimeImmutable(),
                updatedAt: new DateTimeImmutable()
            );
            
            // Verify null expiration means never expired
            $this->assertNull($reconstitutedQuote->getExpiresAt());
            $this->assertFalse(
                $reconstitutedQuote->isExpired(),
                'Quote with null expiration should never be expired'
            );
        }
    }

    /**
     * Property: Expiration date format is consistent
     * 
     * @test
     */
    public function property_expiration_date_format_is_consistent(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $quote = Quote::create(tenantId: rand(1, 100), orderId: rand(1, 1000), vendorId: rand(1, 100), productId: rand(1, 100), quantity: rand(1, 10)
            );
            
            $expiresAt = $quote->getExpiresAt();
            
            // Verify it's a DateTimeImmutable instance
            $this->assertInstanceOf(
                DateTimeImmutable::class,
                $expiresAt,
                'Expiration should be DateTimeImmutable instance'
            );
            
            // Verify it can be formatted consistently
            $formatted = $expiresAt->format('Y-m-d H:i:s');
            $this->assertMatchesRegularExpression(
                '/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/',
                $formatted,
                'Expiration should be formattable as Y-m-d H:i:s'
            );
            
            // Verify ISO 8601 format
            $iso8601 = $expiresAt->format('c');
            $this->assertMatchesRegularExpression(
                '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/',
                $iso8601,
                'Expiration should be formattable as ISO 8601'
            );
        }
    }

    /**
     * Property: Expiration calculation is deterministic
     * 
     * @test
     */
    public function property_expiration_calculation_is_deterministic(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $tenantId = rand(1, 100);
            $orderId = rand(1, 1000);
            $vendorId = rand(1, 100);
            
            // Create two quotes with same parameters at nearly the same time
            $quote1 = Quote::create($tenantId, $orderId, $vendorId, rand(1, 100), rand(1, 10));
            $quote2 = Quote::create($tenantId, $orderId + 1, $vendorId, rand(1, 100), rand(1, 10));
            
            // Expiration dates should be very close (within 1 second)
            $diff = abs(
                $quote1->getExpiresAt()->getTimestamp() - 
                $quote2->getExpiresAt()->getTimestamp()
            );
            
            $this->assertLessThanOrEqual(
                1,
                $diff,
                'Expiration dates for quotes created at same time should be within 1 second'
            );
        }
    }
}


