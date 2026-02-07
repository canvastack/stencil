<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Quote\Entities;

use App\Domain\Quote\Entities\Quote;
use App\Domain\Quote\ValueObjects\QuoteStatus;
use Tests\TestCase;
use DateTimeImmutable;

/**
 * Property Test: Expired Quotes Update Status Automatically
 * 
 * **Property 33: Expired Quotes Update Status Automatically**
 * **Validates: Requirements 10.2**
 * 
 * For any quote where the current date is after expires_at and status is 
 * "sent" or "pending_response", the status should be automatically updated to "expired".
 * 
 * This property test verifies that:
 * 1. Quotes past expiration date are identified correctly
 * 2. Only quotes in expirable statuses are expired
 * 3. Terminal status quotes are not expired
 * 4. Expiration updates status to EXPIRED
 * 5. Expiration creates proper history entry
 */
class QuoteAutoExpirationPropertyTest extends TestCase
{
    /**
     * Property: Quotes past expiration date are identified as expired
     * 
     * @test
     */
    public function property_quotes_past_expiration_are_identified(): void
    {
        // Run 100 iterations with different scenarios
        for ($i = 0; $i < 100; $i++) {
            // Create quote with past expiration date
            $daysInPast = rand(1, 365);
            $pastDate = (new DateTimeImmutable())->modify("-{$daysInPast} days");
            
            $quote = Quote::create(
                tenantId: rand(1, 100),
                orderId: rand(1, 1000),
                vendorId: rand(1, 100),
                productId: rand(1, 100),
                quantity: rand(1, 10),
                initialOffer: rand(100000, 1000000),
                quoteDetails: ['test' => 'data'],
                currency: 'IDR',
                expiresAt: $pastDate
            );
            
            // Verify quote is identified as expired
            $this->assertTrue(
                $quote->isExpired(),
                "Quote with expiration {$daysInPast} days in past should be expired"
            );
        }
    }

    /**
     * Property: Only expirable statuses can be expired
     * 
     * @test
     */
    public function property_only_expirable_statuses_can_be_expired(): void
    {
        $expirableStatuses = [QuoteStatus::SENT, QuoteStatus::PENDING_RESPONSE];
        
        for ($i = 0; $i < 100; $i++) {
            // Create quote with FUTURE expiration initially
            $futureDate = (new DateTimeImmutable())->modify('+30 days');
            
            $quote = Quote::create(
                tenantId: rand(1, 100),
                orderId: rand(1, 1000),
                vendorId: rand(1, 100),
                productId: rand(1, 100),
                quantity: rand(1, 10),
                expiresAt: $futureDate
            );
            
            // Test each expirable status
            foreach ($expirableStatuses as $status) {
                // Set quote to expirable status (while not expired)
                if ($status === QuoteStatus::SENT) {
                    $quote->markAsSent(rand(1, 100));
                } elseif ($status === QuoteStatus::PENDING_RESPONSE) {
                    $quote->markAsSent(rand(1, 100));
                    $quote->updateStatus(QuoteStatus::PENDING_RESPONSE, rand(1, 100));
                }
                
                // Now simulate expiration by setting past date using reflection
                $pastDate = (new DateTimeImmutable())->modify('-1 day');
                $reflection = new \ReflectionClass($quote);
                $property = $reflection->getProperty('expiresAt');
                $property->setAccessible(true);
                $property->setValue($quote, $pastDate);
                
                // Verify quote is expired
                $this->assertTrue($quote->isExpired());
                
                // Mark as expired
                $quote->markAsExpired(null);
                
                // Verify status changed to EXPIRED
                $this->assertEquals(
                    QuoteStatus::EXPIRED,
                    $quote->getStatus(),
                    "Quote in {$status->value} status should be marked as expired"
                );
                
                // Create new quote for next iteration
                $quote = Quote::create(
                tenantId: rand(1, 100),
                orderId: rand(1, 1000),
                vendorId: rand(1, 100),
                productId: rand(1, 100),
                quantity: rand(1, 10),
                expiresAt: $futureDate
                );
            }
        }
    }

    /**
     * Property: Terminal status quotes are not expired
     * 
     * @test
     */
    public function property_terminal_status_quotes_not_expired(): void
    {
        $terminalStatuses = [
            QuoteStatus::ACCEPTED,
            QuoteStatus::REJECTED,
            QuoteStatus::EXPIRED
        ];
        
        for ($i = 0; $i < 50; $i++) {
            // Create quote with FUTURE expiration initially
            $futureDate = (new DateTimeImmutable())->modify('+30 days');
            
            foreach ($terminalStatuses as $terminalStatus) {
                $quote = Quote::create(
                tenantId: rand(1, 100),
                orderId: rand(1, 1000),
                vendorId: rand(1, 100),
                productId: rand(1, 100),
                quantity: rand(1, 10),
                expiresAt: $futureDate
                );
                
                // Move quote to terminal status (while not expired)
                $quote->markAsSent(1);
                $quote->updateStatus(QuoteStatus::PENDING_RESPONSE, 1);
                
                if ($terminalStatus === QuoteStatus::ACCEPTED) {
                    $quote->recordVendorResponse('accept', 'Accepted', null, 1);
                } elseif ($terminalStatus === QuoteStatus::REJECTED) {
                    $quote->recordVendorResponse('reject', 'Rejected', null, 1);
                } elseif ($terminalStatus === QuoteStatus::EXPIRED) {
                    $quote->markAsExpired(null);
                }
                
                $statusBeforeExpiration = $quote->getStatus();
                
                // Now simulate expiration by setting past date using reflection
                $pastDate = (new DateTimeImmutable())->modify('-1 day');
                $reflection = new \ReflectionClass($quote);
                $property = $reflection->getProperty('expiresAt');
                $property->setAccessible(true);
                $property->setValue($quote, $pastDate);
                
                // Try to mark as expired again
                $quote->markAsExpired(null);
                
                // Verify status didn't change
                $this->assertEquals(
                    $statusBeforeExpiration,
                    $quote->getStatus(),
                    "Quote in terminal status {$terminalStatus->value} should not change when marked as expired"
                );
            }
        }
    }

    /**
     * Property: Expiration updates status to EXPIRED
     * 
     * @test
     */
    public function property_expiration_updates_status_to_expired(): void
    {
        for ($i = 0; $i < 100; $i++) {
            // Create quote with FUTURE expiration initially
            $futureDate = (new DateTimeImmutable())->modify('+30 days');
            
            $quote = Quote::create(
                tenantId: rand(1, 100),
                orderId: rand(1, 1000),
                vendorId: rand(1, 100),
                productId: rand(1, 100),
                quantity: rand(1, 10),
                expiresAt: $futureDate
            );
            
            // Move to expirable status (while not expired)
            $quote->markAsSent(rand(1, 100));
            
            // Verify not in expired status yet
            $this->assertNotEquals(QuoteStatus::EXPIRED, $quote->getStatus());
            
            // Now simulate expiration by setting past date using reflection
            $pastDate = (new DateTimeImmutable())->modify('-' . rand(1, 30) . ' days');
            $reflection = new \ReflectionClass($quote);
            $property = $reflection->getProperty('expiresAt');
            $property->setAccessible(true);
            $property->setValue($quote, $pastDate);
            
            // Mark as expired
            $quote->markAsExpired(null);
            
            // Verify status is now EXPIRED
            $this->assertEquals(
                QuoteStatus::EXPIRED,
                $quote->getStatus(),
                'Quote should have EXPIRED status after markAsExpired()'
            );
            
            // Verify closed_at is set
            $this->assertNotNull(
                $quote->getClosedAt(),
                'Quote should have closed_at timestamp after expiration'
            );
        }
    }

    /**
     * Property: Expiration creates proper history entry
     * 
     * @test
     */
    public function property_expiration_creates_history_entry(): void
    {
        for ($i = 0; $i < 100; $i++) {
            // Create quote with FUTURE expiration initially
            $futureDate = (new DateTimeImmutable())->modify('+30 days');
            
            $quote = Quote::create(
                tenantId: rand(1, 100),
                orderId: rand(1, 1000),
                vendorId: rand(1, 100),
                productId: rand(1, 100),
                quantity: rand(1, 10),
                expiresAt: $futureDate
            );
            
            $quote->markAsSent(rand(1, 100));
            
            $historyCountBefore = count($quote->getStatusHistory());
            $statusBefore = $quote->getStatus();
            
            // Now simulate expiration by setting past date using reflection
            $pastDate = (new DateTimeImmutable())->modify('-1 day');
            $reflection = new \ReflectionClass($quote);
            $property = $reflection->getProperty('expiresAt');
            $property->setAccessible(true);
            $property->setValue($quote, $pastDate);
            
            // Mark as expired
            $systemUserId = null; // System action
            $quote->markAsExpired($systemUserId);
            
            // Verify history has one more entry
            $this->assertCount(
                $historyCountBefore + 1,
                $quote->getStatusHistory(),
                'Expiration should add one history entry'
            );
            
            // Get the latest history entry
            $history = $quote->getStatusHistory();
            $latestEntry = end($history);
            
            // Verify history entry fields
            $this->assertEquals($statusBefore->value, $latestEntry['from']);
            $this->assertEquals(QuoteStatus::EXPIRED->value, $latestEntry['to']);
            $this->assertNull($latestEntry['changed_by'], 'System action should have null user');
            $this->assertNotNull($latestEntry['changed_at']);
            $this->assertIsString($latestEntry['reason']);
            $this->assertStringContainsString('expired', strtolower($latestEntry['reason']));
        }
    }

    /**
     * Property: Quotes with future expiration are not expired
     * 
     * @test
     */
    public function property_future_expiration_not_expired(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $daysInFuture = rand(1, 365);
            $futureDate = (new DateTimeImmutable())->modify("+{$daysInFuture} days");
            
            $quote = Quote::create(
                tenantId: rand(1, 100),
                orderId: rand(1, 1000),
                vendorId: rand(1, 100),
                productId: rand(1, 100),
                quantity: rand(1, 10),
                expiresAt: $futureDate
            );
            
            $quote->markAsSent(rand(1, 100));
            
            // Verify quote is not expired
            $this->assertFalse(
                $quote->isExpired(),
                "Quote with expiration {$daysInFuture} days in future should not be expired"
            );
        }
    }

    /**
     * Property: Expiration boundary is precise
     * 
     * @test
     */
    public function property_expiration_boundary_is_precise(): void
    {
        for ($i = 0; $i < 100; $i++) {
            // Create quote expiring in exactly 1 second
            $almostExpired = (new DateTimeImmutable())->modify('+1 second');
            
            $quote1 = Quote::create(
                tenantId: rand(1, 100),
                orderId: rand(1, 1000),
                vendorId: rand(1, 100),
                productId: rand(1, 100),
                quantity: rand(1, 10),
                expiresAt: $almostExpired
            );
            
            // Should not be expired yet
            $this->assertFalse(
                $quote1->isExpired(),
                'Quote expiring in 1 second should not be expired yet'
            );
            
            // Create quote that expired 1 second ago
            $justExpired = (new DateTimeImmutable())->modify('-1 second');
            
            $quote2 = Quote::create(
                tenantId: rand(1, 100),
                orderId: rand(1, 1000),
                vendorId: rand(1, 100),
                productId: rand(1, 100),
                quantity: rand(1, 10),
                expiresAt: $justExpired
            );
            
            // Should be expired
            $this->assertTrue(
                $quote2->isExpired(),
                'Quote that expired 1 second ago should be expired'
            );
        }
    }

    /**
     * Property: Multiple expirations maintain history
     * 
     * @test
     */
    public function property_multiple_expirations_maintain_history(): void
    {
        for ($i = 0; $i < 50; $i++) {
            // Create quote with FUTURE expiration initially
            $futureDate = (new DateTimeImmutable())->modify('+30 days');
            
            $quote = Quote::create(
                tenantId: rand(1, 100),
                orderId: rand(1, 1000),
                vendorId: rand(1, 100),
                productId: rand(1, 100),
                quantity: rand(1, 10),
                expiresAt: $futureDate
            );
            
            $quote->markAsSent(1);
            
            // Now simulate expiration by setting past date using reflection
            $pastDate = (new DateTimeImmutable())->modify('-1 day');
            $reflection = new \ReflectionClass($quote);
            $property = $reflection->getProperty('expiresAt');
            $property->setAccessible(true);
            $property->setValue($quote, $pastDate);
            
            // First expiration
            $quote->markAsExpired(null);
            $firstExpirationHistory = $quote->getStatusHistory();
            $firstExpirationCount = count($firstExpirationHistory);
            
            // Try to expire again (should not add new history)
            $quote->markAsExpired(null);
            $secondExpirationHistory = $quote->getStatusHistory();
            
            // History count should be the same (terminal status)
            $this->assertEquals(
                $firstExpirationCount,
                count($secondExpirationHistory),
                'Expiring an already expired quote should not add new history'
            );
            
            // Verify all history is preserved
            for ($j = 0; $j < $firstExpirationCount; $j++) {
                $this->assertEquals(
                    $firstExpirationHistory[$j],
                    $secondExpirationHistory[$j],
                    'Previous history entries should be preserved'
                );
            }
        }
    }

    /**
     * Property: Expiration works across different statuses
     * 
     * @test
     */
    public function property_expiration_works_across_statuses(): void
    {
        $expirableStatuses = [
            QuoteStatus::SENT,
            QuoteStatus::PENDING_RESPONSE,
            QuoteStatus::COUNTERED
        ];
        
        for ($i = 0; $i < 50; $i++) {
            // Create quote with FUTURE expiration initially
            $futureDate = (new DateTimeImmutable())->modify('+30 days');
            
            foreach ($expirableStatuses as $status) {
                $quote = Quote::create(
                tenantId: rand(1, 100),
                orderId: rand(1, 1000),
                vendorId: rand(1, 100),
                productId: rand(1, 100),
                quantity: rand(1, 10),
                expiresAt: $futureDate
                );
                
                // Move to target status (while not expired)
                $quote->markAsSent(1);
                
                if ($status === QuoteStatus::PENDING_RESPONSE) {
                    $quote->updateStatus(QuoteStatus::PENDING_RESPONSE, 1);
                } elseif ($status === QuoteStatus::COUNTERED) {
                    $quote->updateStatus(QuoteStatus::PENDING_RESPONSE, 1);
                    $quote->recordVendorResponse('counter', 'Counter offer', 500000, 1);
                }
                
                // Now simulate expiration by setting past date using reflection
                $pastDate = (new DateTimeImmutable())->modify('-1 day');
                $reflection = new \ReflectionClass($quote);
                $property = $reflection->getProperty('expiresAt');
                $property->setAccessible(true);
                $property->setValue($quote, $pastDate);
                
                // Verify quote is expired
                $this->assertTrue($quote->isExpired());
                
                // Mark as expired
                $quote->markAsExpired(null);
                
                // Verify status changed to EXPIRED
                $this->assertEquals(
                    QuoteStatus::EXPIRED,
                    $quote->getStatus(),
                    "Quote in {$status->value} status should be expired"
                );
            }
        }
    }

    /**
     * Property: Expiration timestamp is recorded
     * 
     * @test
     */
    public function property_expiration_timestamp_is_recorded(): void
    {
        for ($i = 0; $i < 100; $i++) {
            // Create quote with FUTURE expiration initially
            $futureDate = (new DateTimeImmutable())->modify('+30 days');
            
            $quote = Quote::create(
                tenantId: rand(1, 100),
                orderId: rand(1, 1000),
                vendorId: rand(1, 100),
                productId: rand(1, 100),
                quantity: rand(1, 10),
                expiresAt: $futureDate
            );
            
            $quote->markAsSent(1);
            
            // Now simulate expiration by setting past date using reflection
            $pastDate = (new DateTimeImmutable())->modify('-1 day');
            $reflection = new \ReflectionClass($quote);
            $property = $reflection->getProperty('expiresAt');
            $property->setAccessible(true);
            $property->setValue($quote, $pastDate);
            
            $beforeExpiration = new DateTimeImmutable();
            
            // Mark as expired
            $quote->markAsExpired(null);
            
            $afterExpiration = new DateTimeImmutable();
            
            // Verify closed_at is set
            $closedAt = $quote->getClosedAt();
            $this->assertNotNull($closedAt);
            
            // Verify closed_at is between before and after
            $this->assertGreaterThanOrEqual(
                $beforeExpiration->getTimestamp(),
                $closedAt->getTimestamp(),
                'Closed timestamp should be >= before expiration'
            );
            
            $this->assertLessThanOrEqual(
                $afterExpiration->getTimestamp(),
                $closedAt->getTimestamp(),
                'Closed timestamp should be <= after expiration'
            );
        }
    }
}



