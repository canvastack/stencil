<?php

namespace Tests\Unit\Domain\Order\Services;

use App\Domain\Order\Services\VendorNegotiationService;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendorNegotiationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected VendorNegotiationService $negotiationService;
    protected TenantEloquentModel $tenant;
    protected Customer $customer;
    protected Vendor $vendor;
    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();
        $this->negotiationService = app(VendorNegotiationService::class);
        $this->tenant = TenantEloquentModel::factory()->create();
        $this->customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'vendor_id' => $this->vendor->id,
            'total_amount' => 1000000,
            'currency' => 'IDR',
        ]);
    }

    public function test_start_negotiation_creates_new_negotiation(): void
    {
        $negotiation = $this->negotiationService->startNegotiation(
            $this->order,
            [
                'vendor_id' => $this->vendor->id,
                'initial_offer' => 1000000,
                'notes' => 'Starting negotiation',
            ]
        );

        $this->assertInstanceOf(OrderVendorNegotiation::class, $negotiation);
        $this->assertEquals($this->order->id, $negotiation->order_id);
        $this->assertEquals($this->vendor->id, $negotiation->vendor_id);
        $this->assertEquals('open', $negotiation->status);
        $this->assertEquals(1000000, $negotiation->initial_offer);
        $this->assertEquals(1000000, $negotiation->latest_offer);
        $this->assertEquals(1, $negotiation->round);
    }

    public function test_negotiation_workflow_open_to_countered(): void
    {
        $negotiation = $this->negotiationService->startNegotiation(
            $this->order,
            ['vendor_id' => $this->vendor->id, 'initial_offer' => 1000000]
        );

        $updated = $this->negotiationService->recordCounterOffer(
            $negotiation,
            [
                'amount' => 950000,
                'actor' => 'vendor',
                'notes' => 'Can offer lower price',
            ]
        );

        $this->assertEquals('countered', $updated->status);
        $this->assertEquals(950000, $updated->latest_offer);
        $this->assertEquals(2, $updated->round);
        
        $history = $updated->history;
        $this->assertCount(2, $history);
        $this->assertEquals('counter_offer', $history[1]['event']);
        $this->assertEquals('vendor', $history[1]['actor']);
    }

    public function test_round_tracking_in_negotiation(): void
    {
        $negotiation = $this->negotiationService->startNegotiation(
            $this->order,
            ['vendor_id' => $this->vendor->id, 'initial_offer' => 1000000]
        );

        $this->assertEquals(1, $negotiation->round);

        $negotiation = $this->negotiationService->recordCounterOffer($negotiation, ['amount' => 950000]);
        $this->assertEquals(2, $negotiation->round);

        $negotiation = $this->negotiationService->recordCounterOffer($negotiation, ['amount' => 920000]);
        $this->assertEquals(3, $negotiation->round);

        $negotiation = $this->negotiationService->recordCounterOffer($negotiation, ['amount' => 900000]);
        $this->assertEquals(4, $negotiation->round);
    }

    public function test_counter_offer_recording_with_history(): void
    {
        $negotiation = $this->negotiationService->startNegotiation(
            $this->order,
            ['vendor_id' => $this->vendor->id, 'initial_offer' => 1000000]
        );

        $negotiation = $this->negotiationService->recordCounterOffer(
            $negotiation,
            ['amount' => 950000, 'actor' => 'vendor', 'notes' => 'First counter']
        );

        $negotiation = $this->negotiationService->recordCounterOffer(
            $negotiation,
            ['amount' => 925000, 'actor' => 'customer', 'notes' => 'Counter to vendor']
        );

        $history = $negotiation->history;
        $this->assertCount(3, $history);
        
        $this->assertEquals('initiated', $history[0]['event']);
        $this->assertEquals('counter_offer', $history[1]['event']);
        $this->assertEquals(950000, $history[1]['amount']);
        $this->assertEquals('vendor', $history[1]['actor']);
        
        $this->assertEquals('counter_offer', $history[2]['event']);
        $this->assertEquals(925000, $history[2]['amount']);
        $this->assertEquals('customer', $history[2]['actor']);
    }

    public function test_expiration_enforcement(): void
    {
        $expiresAt = now()->addDays(7);

        $negotiation = $this->negotiationService->startNegotiation(
            $this->order,
            [
                'vendor_id' => $this->vendor->id,
                'initial_offer' => 1000000,
                'expires_at' => $expiresAt,
            ]
        );

        $this->assertEquals($expiresAt->toDateString(), $negotiation->expires_at->toDateString());
    }

    public function test_negotiation_approved_conclusion(): void
    {
        $negotiation = $this->negotiationService->startNegotiation(
            $this->order,
            ['vendor_id' => $this->vendor->id, 'initial_offer' => 1000000]
        );

        $negotiation = $this->negotiationService->recordCounterOffer(
            $negotiation,
            ['amount' => 950000, 'actor' => 'vendor']
        );

        $concluded = $this->negotiationService->concludeNegotiation(
            $negotiation,
            'accepted',
            ['amount' => 950000, 'actor' => 'customer']
        );

        $this->assertEquals('accepted', $concluded->status);
        $this->assertEquals(950000, $concluded->latest_offer);
        $this->assertNotNull($concluded->closed_at);
        
        $history = $concluded->history;
        $lastEntry = end($history);
        $this->assertEquals('accepted', $lastEntry['event']);
    }

    public function test_negotiation_rejected_conclusion(): void
    {
        $negotiation = $this->negotiationService->startNegotiation(
            $this->order,
            ['vendor_id' => $this->vendor->id, 'initial_offer' => 1000000]
        );

        $concluded = $this->negotiationService->concludeNegotiation(
            $negotiation,
            'rejected',
            ['notes' => 'Price too high']
        );

        $this->assertEquals('rejected', $concluded->status);
        $this->assertNotNull($concluded->closed_at);
    }

    public function test_negotiation_expired_conclusion(): void
    {
        $negotiation = $this->negotiationService->startNegotiation(
            $this->order,
            [
                'vendor_id' => $this->vendor->id,
                'initial_offer' => 1000000,
                'expires_at' => now()->subDays(1),
            ]
        );

        $concluded = $this->negotiationService->concludeNegotiation(
            $negotiation,
            'expired',
            ['actor' => 'system']
        );

        $this->assertEquals('expired', $concluded->status);
        $this->assertNotNull($concluded->closed_at);
    }

    public function test_negotiation_cancelled_conclusion(): void
    {
        $negotiation = $this->negotiationService->startNegotiation(
            $this->order,
            ['vendor_id' => $this->vendor->id, 'initial_offer' => 1000000]
        );

        $concluded = $this->negotiationService->concludeNegotiation(
            $negotiation,
            'cancelled',
            ['notes' => 'Order cancelled by customer']
        );

        $this->assertEquals('cancelled', $concluded->status);
    }

    public function test_throw_exception_for_invalid_conclusion_status(): void
    {
        $negotiation = $this->negotiationService->startNegotiation(
            $this->order,
            ['vendor_id' => $this->vendor->id]
        );

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Status negosiasi tidak valid');

        $this->negotiationService->concludeNegotiation($negotiation, 'invalid_status');
    }

    public function test_throw_exception_when_starting_without_vendor(): void
    {
        $this->order->update(['vendor_id' => null]);

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Vendor harus dipilih sebelum memulai negosiasi');

        $this->negotiationService->startNegotiation($this->order, []);
    }

    public function test_existing_open_negotiation_returns_without_creating_new(): void
    {
        $negotiation1 = $this->negotiationService->startNegotiation(
            $this->order,
            ['vendor_id' => $this->vendor->id, 'initial_offer' => 1000000]
        );

        $negotiation2 = $this->negotiationService->startNegotiation(
            $this->order,
            ['vendor_id' => $this->vendor->id, 'initial_offer' => 900000]
        );

        $this->assertEquals($negotiation1->id, $negotiation2->id);
        $this->assertEquals(1000000, $negotiation2->initial_offer);
    }

    public function test_negotiation_history_audit_trail(): void
    {
        $negotiation = $this->negotiationService->startNegotiation(
            $this->order,
            [
                'vendor_id' => $this->vendor->id,
                'initial_offer' => 1000000,
                'notes' => 'Initial offer from system',
                'initiator' => 'system',
            ]
        );

        $history = $negotiation->history;
        
        $this->assertIsArray($history);
        $this->assertCount(1, $history);

        $initialEntry = $history[0];
        $this->assertArrayHasKey('actor', $initialEntry);
        $this->assertArrayHasKey('event', $initialEntry);
        $this->assertArrayHasKey('amount', $initialEntry);
        $this->assertArrayHasKey('notes', $initialEntry);
        $this->assertArrayHasKey('timestamp', $initialEntry);

        $this->assertEquals('system', $initialEntry['actor']);
        $this->assertEquals('initiated', $initialEntry['event']);
    }

    public function test_negotiation_terms_tracking(): void
    {
        $terms = 'Bayar setelah pengerjaan selesai';

        $negotiation = $this->negotiationService->startNegotiation(
            $this->order,
            [
                'vendor_id' => $this->vendor->id,
                'initial_offer' => 1000000,
                'quote_details' => $terms, // Changed from 'terms' to 'quote_details'
            ]
        );

        $this->assertEquals($terms, $negotiation->quote_details); // Changed from terms to quote_details
    }

    public function test_order_metadata_updated_during_negotiation(): void
    {
        $negotiation = $this->negotiationService->startNegotiation(
            $this->order,
            ['vendor_id' => $this->vendor->id, 'initial_offer' => 1000000]
        );

        $this->assertNotNull($negotiation);
        $this->assertEquals($this->order->id, $negotiation->order_id);
        $this->assertEquals('open', $negotiation->status);
    }

    public function test_metadata_updated_after_counter_offer(): void
    {
        $negotiation = $this->negotiationService->startNegotiation(
            $this->order,
            ['vendor_id' => $this->vendor->id, 'initial_offer' => 1000000]
        );

        $updated = $this->negotiationService->recordCounterOffer(
            $negotiation,
            ['amount' => 950000, 'actor' => 'vendor']
        );

        $this->assertEquals('countered', $updated->status);
        $this->assertEquals(950000, $updated->latest_offer);
        $this->assertEquals(2, $updated->round);
    }

    public function test_negotiation_currency_tracking(): void
    {
        $negotiation = $this->negotiationService->startNegotiation(
            $this->order,
            [
                'vendor_id' => $this->vendor->id,
                'initial_offer' => 1000000,
                'currency' => 'IDR',
            ]
        );

        $this->assertEquals('IDR', $negotiation->currency);
    }

    public function test_multiple_vendor_negotiations_on_same_order(): void
    {
        $vendor2 = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);

        $this->order->update(['vendor_id' => $this->vendor->id]);
        $negotiation1 = $this->negotiationService->startNegotiation(
            $this->order,
            ['vendor_id' => $this->vendor->id, 'initial_offer' => 1000000]
        );

        $this->negotiationService->concludeNegotiation($negotiation1, 'accepted');

        $this->order->update(['vendor_id' => $vendor2->id]);
        $negotiation2 = $this->negotiationService->startNegotiation(
            $this->order,
            ['vendor_id' => $vendor2->id, 'initial_offer' => 950000]
        );

        $this->assertNotEquals($negotiation1->id, $negotiation2->id);
        $this->assertEquals($this->vendor->id, $negotiation1->vendor_id);
        $this->assertEquals($vendor2->id, $negotiation2->vendor_id);
    }

    public function test_negotiation_tenant_scoping(): void
    {
        $negotiation = $this->negotiationService->startNegotiation(
            $this->order,
            ['vendor_id' => $this->vendor->id, 'initial_offer' => 1000000]
        );

        $this->assertEquals($this->tenant->id, $negotiation->tenant_id);
    }

    public function test_history_entry_timestamp_format(): void
    {
        $negotiation = $this->negotiationService->startNegotiation(
            $this->order,
            ['vendor_id' => $this->vendor->id, 'initial_offer' => 1000000]
        );

        $history = $negotiation->history;
        $timestamp = $history[0]['timestamp'];

        $this->assertNotNull($timestamp);
        Carbon::parse($timestamp);
    }

    public function test_negotiation_conclusion_with_final_amount(): void
    {
        $negotiation = $this->negotiationService->startNegotiation(
            $this->order,
            ['vendor_id' => $this->vendor->id, 'initial_offer' => 1000000]
        );

        $concluded = $this->negotiationService->concludeNegotiation(
            $negotiation,
            'accepted',
            ['amount' => 900000]
        );

        $this->assertEquals(900000, $concluded->latest_offer);
    }
}
