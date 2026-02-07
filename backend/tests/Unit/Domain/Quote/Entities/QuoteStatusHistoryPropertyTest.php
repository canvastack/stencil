<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Quote\Entities;

use App\Domain\Quote\Entities\Quote;
use App\Domain\Quote\ValueObjects\QuoteStatus;
use Tests\TestCase;

/**
 * Property Test: Status Changes Are Audited
 * 
 * **Property 8: Status Changes Are Audited**
 * **Validates: Requirements 3.5**
 * 
 * For any quote status change, the change should be appended to the 
 * status_history JSON field with timestamp, user_id, old status, and new status.
 * 
 * This property test verifies that:
 * 1. Every status change creates a history entry
 * 2. History entries contain all required fields
 * 3. History is append-only (never overwritten)
 * 4. Multiple status changes create multiple history entries
 * 5. History entries are in chronological order
 */
class QuoteStatusHistoryPropertyTest extends TestCase
{
    /**
     * Property: Every status change appends to history
     * 
     * @test
     */
    public function property_status_changes_append_to_history(): void
    {
        // Run 100 iterations with different scenarios
        for ($i = 0; $i < 100; $i++) {
            // Create a quote
            $quote = Quote::create(tenantId: 1, orderId: rand(1, 1000), vendorId: rand(1, 100), productId: rand(1, 100), quantity: rand(1, 10),
                initialOffer: rand(100000, 1000000),
                quoteDetails: ['test' => 'data'],
                currency: 'IDR'
            );

            // Initial history should have 1 entry (creation)
            $this->assertCount(1, $quote->getStatusHistory());
            $this->assertEquals(QuoteStatus::DRAFT->value, $quote->getStatusHistory()[0]['to']);
            $this->assertNull($quote->getStatusHistory()[0]['from']);

            // Transition to SENT
            $userId1 = rand(1, 100);
            $quote->markAsSent($userId1);

            // History should now have 2 entries
            $this->assertCount(2, $quote->getStatusHistory());
            
            // Verify second entry
            $secondEntry = $quote->getStatusHistory()[1];
            $this->assertEquals(QuoteStatus::DRAFT->value, $secondEntry['from']);
            $this->assertEquals(QuoteStatus::SENT->value, $secondEntry['to']);
            $this->assertEquals($userId1, $secondEntry['changed_by']);
            $this->assertNotNull($secondEntry['changed_at']);
            $this->assertIsString($secondEntry['changed_at']);

            // Transition to PENDING_RESPONSE
            $userId2 = rand(1, 100);
            $quote->updateStatus(QuoteStatus::PENDING_RESPONSE, $userId2, 'Waiting for vendor');

            // History should now have 3 entries
            $this->assertCount(3, $quote->getStatusHistory());
            
            // Verify third entry
            $thirdEntry = $quote->getStatusHistory()[2];
            $this->assertEquals(QuoteStatus::SENT->value, $thirdEntry['from']);
            $this->assertEquals(QuoteStatus::PENDING_RESPONSE->value, $thirdEntry['to']);
            $this->assertEquals($userId2, $thirdEntry['changed_by']);
            $this->assertEquals('Waiting for vendor', $thirdEntry['reason']);
            $this->assertNotNull($thirdEntry['changed_at']);

            // Verify history is in chronological order
            $timestamps = array_map(fn($entry) => $entry['changed_at'], $quote->getStatusHistory());
            $sortedTimestamps = $timestamps;
            sort($sortedTimestamps);
            $this->assertEquals($sortedTimestamps, $timestamps, 'History entries should be in chronological order');
        }
    }

    /**
     * Property: History entries contain all required fields
     * 
     * @test
     */
    public function property_history_entries_contain_required_fields(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $quote = Quote::create(tenantId: 1, orderId: rand(1, 1000), vendorId: rand(1, 100), productId: rand(1, 100), quantity: rand(1, 10)
            );

            $userId = rand(1, 100);
            $reason = 'Test reason ' . $i;
            
            $quote->markAsSent($userId);

            // Get the latest history entry
            $history = $quote->getStatusHistory();
            $latestEntry = end($history);

            // Verify all required fields are present
            $this->assertArrayHasKey('from', $latestEntry);
            $this->assertArrayHasKey('to', $latestEntry);
            $this->assertArrayHasKey('changed_by', $latestEntry);
            $this->assertArrayHasKey('changed_at', $latestEntry);
            $this->assertArrayHasKey('reason', $latestEntry);

            // Verify field types
            $this->assertIsString($latestEntry['from']);
            $this->assertIsString($latestEntry['to']);
            $this->assertIsInt($latestEntry['changed_by']);
            $this->assertIsString($latestEntry['changed_at']);
            $this->assertIsString($latestEntry['reason']);

            // Verify timestamp is valid ISO 8601 format
            $this->assertMatchesRegularExpression(
                '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/',
                $latestEntry['changed_at']
            );
        }
    }

    /**
     * Property: Vendor responses create proper history entries
     * 
     * @test
     */
    public function property_vendor_responses_create_history_entries(): void
    {
        $responseTypes = ['accept', 'reject', 'counter'];

        for ($i = 0; $i < 100; $i++) {
            $quote = Quote::create(tenantId: 1, orderId: rand(1, 1000), vendorId: rand(1, 100), productId: rand(1, 100), quantity: rand(1, 10)
            );

            $quote->markAsSent(1);
            $quote->updateStatus(QuoteStatus::PENDING_RESPONSE, 1);

            $initialHistoryCount = count($quote->getStatusHistory());

            // Random response type
            $responseType = $responseTypes[array_rand($responseTypes)];
            $vendorUserId = rand(1, 100);
            $notes = "Vendor notes for iteration {$i}";

            $quote->recordVendorResponse(
                responseType: $responseType,
                notes: $notes,
                counterOffer: $responseType === 'counter' ? rand(100000, 1000000) : null,
                userId: $vendorUserId
            );

            // History should have one more entry
            $this->assertCount($initialHistoryCount + 1, $quote->getStatusHistory());

            // Verify the new entry
            $history = $quote->getStatusHistory();
            $latestEntry = end($history);
            $this->assertEquals(QuoteStatus::PENDING_RESPONSE->value, $latestEntry['from']);
            $this->assertEquals($vendorUserId, $latestEntry['changed_by']);
            $this->assertStringContainsString($responseType, $latestEntry['reason']);
            
            if ($notes) {
                $this->assertStringContainsString($notes, $latestEntry['reason']);
            }

            // Verify correct target status
            $expectedStatus = match($responseType) {
                'accept' => QuoteStatus::ACCEPTED->value,
                'reject' => QuoteStatus::REJECTED->value,
                'counter' => QuoteStatus::COUNTERED->value,
            };
            $this->assertEquals($expectedStatus, $latestEntry['to']);
        }
    }

    /**
     * Property: History is never overwritten, only appended
     * 
     * @test
     */
    public function property_history_is_append_only(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $quote = Quote::create(tenantId: 1, orderId: rand(1, 1000), vendorId: rand(1, 100), productId: rand(1, 100), quantity: rand(1, 10)
            );

            // Capture initial history
            $initialHistory = $quote->getStatusHistory();
            $initialCount = count($initialHistory);

            // Make multiple status changes
            $quote->markAsSent(1);
            $afterSentHistory = $quote->getStatusHistory();
            
            // Verify initial history is preserved
            for ($j = 0; $j < $initialCount; $j++) {
                $this->assertEquals($initialHistory[$j], $afterSentHistory[$j]);
            }

            $quote->updateStatus(QuoteStatus::PENDING_RESPONSE, 2);
            $afterPendingHistory = $quote->getStatusHistory();
            
            // Verify all previous history is preserved
            for ($j = 0; $j < count($afterSentHistory); $j++) {
                $this->assertEquals($afterSentHistory[$j], $afterPendingHistory[$j]);
            }

            $quote->recordVendorResponse('accept', 'Accepted', null, 3);
            $finalHistory = $quote->getStatusHistory();
            
            // Verify all previous history is still preserved
            for ($j = 0; $j < count($afterPendingHistory); $j++) {
                $this->assertEquals($afterPendingHistory[$j], $finalHistory[$j]);
            }

            // Verify we have all expected entries
            $this->assertCount($initialCount + 3, $finalHistory);
        }
    }

    /**
     * Property: Expiration creates history entry
     * 
     * @test
     */
    public function property_expiration_creates_history_entry(): void
    {
        for ($i = 0; $i < 100; $i++) {
            // Create quote with future expiration
            $quote = Quote::create(tenantId: 1, orderId: rand(1, 1000), vendorId: rand(1, 100), productId: rand(1, 100), quantity: rand(1, 10),
                expiresAt: new \DateTimeImmutable('+30 days')
            );

            $quote->markAsSent(1);
            
            $historyBeforeExpiration = count($quote->getStatusHistory());

            $systemUserId = null; // System action
            $quote->markAsExpired($systemUserId);

            // History should have one more entry
            $this->assertCount($historyBeforeExpiration + 1, $quote->getStatusHistory());

            // Verify expiration entry
            $history = $quote->getStatusHistory();
            $latestEntry = end($history);
            $this->assertEquals(QuoteStatus::EXPIRED->value, $latestEntry['to']);
            $this->assertNull($latestEntry['changed_by']); // System action
            $this->assertStringContainsString('expired', strtolower($latestEntry['reason']));
        }
    }

    /**
     * Property: Multiple transitions maintain complete audit trail
     * 
     * @test
     */
    public function property_complete_workflow_maintains_audit_trail(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $quote = Quote::create(tenantId: 1, orderId: rand(1, 1000), vendorId: rand(1, 100), productId: rand(1, 100), quantity: rand(1, 10)
            );

            // Track all transitions
            $expectedTransitions = [
                ['from' => null, 'to' => QuoteStatus::DRAFT->value],
            ];

            // DRAFT → SENT
            $quote->markAsSent(1);
            $expectedTransitions[] = ['from' => QuoteStatus::DRAFT->value, 'to' => QuoteStatus::SENT->value];

            // SENT → PENDING_RESPONSE
            $quote->updateStatus(QuoteStatus::PENDING_RESPONSE, 2);
            $expectedTransitions[] = ['from' => QuoteStatus::SENT->value, 'to' => QuoteStatus::PENDING_RESPONSE->value];

            // PENDING_RESPONSE → COUNTERED
            $quote->recordVendorResponse('counter', 'Counter offer', 500000, 3);
            $expectedTransitions[] = ['from' => QuoteStatus::PENDING_RESPONSE->value, 'to' => QuoteStatus::COUNTERED->value];

            // COUNTERED → ACCEPTED
            $quote->recordVendorResponse('accept', 'Accepted counter', null, 3);
            $expectedTransitions[] = ['from' => QuoteStatus::COUNTERED->value, 'to' => QuoteStatus::ACCEPTED->value];

            // Verify all transitions are in history
            $history = $quote->getStatusHistory();
            $this->assertCount(count($expectedTransitions), $history);

            for ($j = 0; $j < count($expectedTransitions); $j++) {
                $this->assertEquals($expectedTransitions[$j]['from'], $history[$j]['from']);
                $this->assertEquals($expectedTransitions[$j]['to'], $history[$j]['to']);
            }
        }
    }

    /**
     * Property: History timestamps are sequential
     * 
     * @test
     */
    public function property_history_timestamps_are_sequential(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $quote = Quote::create(tenantId: 1, orderId: rand(1, 1000), vendorId: rand(1, 100), productId: rand(1, 100), quantity: rand(1, 10)
            );

            // Make several status changes
            $quote->markAsSent(1);
            usleep(1000); // Small delay to ensure different timestamps
            
            $quote->updateStatus(QuoteStatus::PENDING_RESPONSE, 2);
            usleep(1000);
            
            $quote->recordVendorResponse('accept', 'Accepted', null, 3);

            // Get all timestamps
            $history = $quote->getStatusHistory();
            $timestamps = array_map(fn($entry) => new \DateTimeImmutable($entry['changed_at']), $history);

            // Verify each timestamp is >= previous timestamp
            for ($j = 1; $j < count($timestamps); $j++) {
                $this->assertGreaterThanOrEqual(
                    $timestamps[$j - 1]->getTimestamp(),
                    $timestamps[$j]->getTimestamp(),
                    "Timestamp at index {$j} should be >= timestamp at index " . ($j - 1)
                );
            }
        }
    }
}


