<?php

namespace Tests\Unit\Application\CustomerQuote\Services;

use App\Application\CustomerQuote\Services\NegotiationService;
use App\Application\CustomerQuote\Services\CustomerNotificationService;
use App\Domain\CustomerQuote\Services\NegotiationRoundValidator;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\VendorQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\VendorSourcing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class NegotiationServiceTest extends TestCase
{
    use RefreshDatabase;

    private NegotiationService $service;
    private $tenant;
    private $customer;
    private $user;
    private $order;
    private $vendorQuote;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test data
        $this->tenant = Tenant::factory()->create();
        $this->customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);

        $vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $vendorSourcing = VendorSourcing::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
        ]);

        $this->vendorQuote = VendorQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'sourcing_request_id' => $vendorSourcing->id,
            'vendor_id' => $vendor->id,
            'amount' => 10000000,
            'status' => 'accepted',
        ]);

        // Initialize service
        $this->service = app(NegotiationService::class);
    }

    /** @test */
    public function it_validates_max_negotiation_rounds(): void
    {
        // Arrange - Create quote with max rounds = 3
        $quote = $this->createTestQuote([
            'status' => 'sent',
            'max_negotiation_rounds' => 3,
            'counter_offer_round' => 0,
        ]);

        // Act & Assert - First counter offer should succeed
        $quote1 = $this->service->submitCounterOffer(
            $quote->uuid,
            $this->customer->id,
            12000000,
            'First counter offer - requesting lower price'
        );
        $this->assertEquals(1, $quote1->counter_offer_round);
        $this->assertEquals('countered', $quote1->status);

        // Second counter offer (admin sends counter)
        $quote2 = $this->service->sendAdminCounterOffer(
            $quote1->uuid,
            $this->user->id,
            12500000,
            'Admin counter offer - this is our best price'
        );
        $this->assertEquals(2, $quote2->counter_offer_round);

        // Third counter offer (customer)
        $quote3 = $this->service->submitCounterOffer(
            $quote2->uuid,
            $this->customer->id,
            12200000,
            'Final counter offer from customer'
        );
        $this->assertEquals(3, $quote3->counter_offer_round);

        // Fourth counter offer should fail - max rounds reached
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Quote cannot be countered in current state or max rounds reached');

        $this->service->submitCounterOffer(
            $quote3->uuid,
            $this->customer->id,
            12100000,
            'This should fail - max rounds reached'
        );
    }

    /** @test */
    public function it_enforces_minimum_reason_length_for_counter_offer(): void
    {
        // Arrange
        $quote = $this->createTestQuote(['status' => 'sent']);

        // Assert
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Counter offer reason must be at least 20 characters');

        // Act
        $this->service->submitCounterOffer(
            $quote->uuid,
            $this->customer->id,
            12000000,
            'Too short' // Less than 20 characters
        );
    }

    /** @test */
    public function it_validates_positive_counter_amount(): void
    {
        // Arrange
        $quote = $this->createTestQuote(['status' => 'sent']);

        // Assert
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Counter amount must be positive');

        // Act
        $this->service->submitCounterOffer(
            $quote->uuid,
            $this->customer->id,
            0, // Invalid amount
            'This is a valid reason with more than 20 characters'
        );
    }

    /** @test */
    public function it_prevents_counter_offer_on_non_negotiable_status(): void
    {
        // Arrange - Create quote with 'accepted' status (not negotiable)
        $quote = $this->createTestQuote(['status' => 'accepted']);

        // Assert
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Quote cannot be countered in current state or max rounds reached');

        // Act
        $this->service->submitCounterOffer(
            $quote->uuid,
            $this->customer->id,
            12000000,
            'This should fail - quote is already accepted'
        );
    }

    /** @test */
    public function it_tracks_negotiation_rounds_correctly(): void
    {
        // Arrange
        $quote = $this->createTestQuote([
            'status' => 'sent',
            'max_negotiation_rounds' => 5,
        ]);

        // Act - Customer counter offer (round 1)
        $quote = $this->service->submitCounterOffer(
            $quote->uuid,
            $this->customer->id,
            12000000,
            'Customer first counter offer'
        );
        $this->assertEquals(1, $quote->counter_offer_round);

        // Admin counter offer (round 2)
        $quote = $this->service->sendAdminCounterOffer(
            $quote->uuid,
            $this->user->id,
            12500000,
            'Admin counter offer response'
        );
        $this->assertEquals(2, $quote->counter_offer_round);

        // Customer counter offer (round 3)
        $quote = $this->service->submitCounterOffer(
            $quote->uuid,
            $this->customer->id,
            12200000,
            'Customer second counter offer'
        );
        $this->assertEquals(3, $quote->counter_offer_round);
    }

    /** @test */
    public function it_accepts_counter_offer_successfully(): void
    {
        // Arrange
        $quote = $this->createTestQuote([
            'status' => 'sent',
            'grand_total' => 13320000,
        ]);

        // Customer submits counter offer
        $quote = $this->service->submitCounterOffer(
            $quote->uuid,
            $this->customer->id,
            12000000,
            'Requesting lower price due to budget constraints'
        );

        // Act - Admin accepts counter offer
        $acceptedQuote = $this->service->acceptCounterOffer(
            $quote->uuid,
            $this->user->id,
            'Accepted customer counter offer'
        );

        // Assert
        $this->assertEquals('accepted', $acceptedQuote->status);
        $this->assertEquals(12000000, $acceptedQuote->grand_total);
        $this->assertNotNull($acceptedQuote->approved_at);
        $this->assertEquals($this->user->id, $acceptedQuote->approved_by);
        $this->assertEquals('manual', $acceptedQuote->approval_method);
    }

    /** @test */
    public function it_rejects_counter_offer_with_reason(): void
    {
        // Arrange
        $quote = $this->createTestQuote(['status' => 'sent']);

        // Customer submits counter offer
        $quote = $this->service->submitCounterOffer(
            $quote->uuid,
            $this->customer->id,
            10000000,
            'Requesting very low price below our cost'
        );

        // Act - Admin rejects counter offer
        $rejectedQuote = $this->service->rejectCounterOffer(
            $quote->uuid,
            $this->user->id,
            'Counter offer amount is below our cost, cannot accept this price'
        );

        // Assert
        $this->assertEquals('rejected', $rejectedQuote->status);
        $this->assertNotNull($rejectedQuote->rejected_at);
        $this->assertEquals($this->user->id, $rejectedQuote->rejected_by);
        $this->assertStringContainsString('below our cost', $rejectedQuote->rejection_reason);
    }

    /** @test */
    public function it_enforces_minimum_rejection_reason_length(): void
    {
        // Arrange
        $quote = $this->createTestQuote(['status' => 'countered']);

        // Assert
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Rejection reason must be at least 20 characters');

        // Act
        $this->service->rejectCounterOffer(
            $quote->uuid,
            $this->user->id,
            'Too short' // Less than 20 characters
        );
    }

    /** @test */
    public function it_sends_admin_counter_offer_successfully(): void
    {
        // Arrange
        $quote = $this->createTestQuote(['status' => 'sent']);

        // Customer submits counter offer
        $quote = $this->service->submitCounterOffer(
            $quote->uuid,
            $this->customer->id,
            11000000,
            'Customer requesting lower price'
        );

        // Act - Admin sends counter offer
        $counterQuote = $this->service->sendAdminCounterOffer(
            $quote->uuid,
            $this->user->id,
            12000000,
            'We can offer this middle ground price as our best offer'
        );

        // Assert
        $this->assertEquals('sent', $counterQuote->status);
        $this->assertEquals(12000000, $counterQuote->grand_total);
        $this->assertEquals(2, $counterQuote->counter_offer_round);
        
        // Check history contains admin counter offer
        $history = $counterQuote->history;
        $adminCounterEntry = collect($history)->firstWhere('action', 'admin_counter_offer');
        $this->assertNotNull($adminCounterEntry);
        $this->assertEquals('admin', $adminCounterEntry['actor_type']);
        $this->assertEquals($this->user->id, $adminCounterEntry['actor_id']);
    }

    /** @test */
    public function it_extends_validity_when_admin_sends_counter_offer(): void
    {
        // Arrange
        $originalValidUntil = Carbon::now()->addDays(2);
        $quote = $this->createTestQuote([
            'status' => 'sent',
            'valid_until' => $originalValidUntil,
        ]);

        // Customer submits counter offer
        $quote = $this->service->submitCounterOffer(
            $quote->uuid,
            $this->customer->id,
            12000000,
            'Customer counter offer'
        );

        // Act - Admin sends counter offer
        $counterQuote = $this->service->sendAdminCounterOffer(
            $quote->uuid,
            $this->user->id,
            12500000,
            'Admin counter offer with extended validity'
        );

        // Assert - Validity should be extended to 7 days from now
        $this->assertGreaterThan($originalValidUntil, $counterQuote->valid_until);
        $expectedValidUntil = Carbon::now()->addDays(7);
        $this->assertEquals(
            $expectedValidUntil->format('Y-m-d'),
            $counterQuote->valid_until->format('Y-m-d')
        );
    }

    /** @test */
    public function it_gets_negotiation_history(): void
    {
        // Arrange
        $quote = $this->createTestQuote(['status' => 'sent']);

        // Create negotiation history
        $quote = $this->service->submitCounterOffer(
            $quote->uuid,
            $this->customer->id,
            12000000,
            'First customer counter offer'
        );

        $quote = $this->service->sendAdminCounterOffer(
            $quote->uuid,
            $this->user->id,
            12500000,
            'Admin counter offer response'
        );

        // Act
        $history = $this->service->getNegotiationHistory($quote->uuid);

        // Assert
        $this->assertIsArray($history);
        $this->assertCount(2, $history);
        
        // Check first entry is customer counter offer
        $this->assertEquals('customer_counter_offer', $history[0]['action']);
        
        // Check second entry is admin counter offer
        $this->assertEquals('admin_counter_offer', $history[1]['action']);
    }

    /** @test */
    public function it_checks_if_customer_can_submit_counter_offer(): void
    {
        // Arrange - Quote in 'sent' status
        $quote = $this->createTestQuote([
            'status' => 'sent',
            'max_negotiation_rounds' => 3,
            'counter_offer_round' => 0,
        ]);

        // Act & Assert - Should be able to counter
        $this->assertTrue($this->service->canSubmitCounterOffer($quote));

        // Submit counter offers until max rounds
        $quote = $this->service->submitCounterOffer(
            $quote->uuid,
            $this->customer->id,
            12000000,
            'First counter offer with valid reason length'
        );
        $quote = $this->service->sendAdminCounterOffer(
            $quote->uuid,
            $this->user->id,
            12500000,
            'Admin counter offer with valid reason length'
        );
        $quote = $this->service->submitCounterOffer(
            $quote->uuid,
            $this->customer->id,
            12200000,
            'Final counter offer with valid reason length'
        );

        // Refresh quote
        $quote = $quote->fresh();

        // Act & Assert - Should NOT be able to counter (max rounds reached)
        $this->assertFalse($this->service->canSubmitCounterOffer($quote));
    }

    private function createTestQuote(array $overrides = []): CustomerQuote
    {
        return CustomerQuote::create(array_merge([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_quote_id' => $this->vendorQuote->id,
            'quote_number' => 'CQ-' . now()->format('Ym') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
            'title' => 'Test Quote',
            'vendor_total_cost' => 10000000,
            'base_profit_amount' => 2000000,
            'base_profit_percentage' => 20.00,
            'subtotal' => 12000000,
            'tax_rate' => 11.00,
            'tax_amount' => 1320000,
            'grand_total' => 13320000,
            'total_profit_amount' => 2000000,
            'total_profit_percentage' => 15.00,
            'valid_until' => Carbon::now()->addDays(7),
            'payment_terms' => 'DP 50%',
            'status' => 'draft',
            'created_by' => $this->user->id,
            'max_negotiation_rounds' => 3,
            'counter_offer_round' => 0,
        ], $overrides));
    }
}
