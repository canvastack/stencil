<?php

declare(strict_types=1);

namespace Tests\Feature\Quote;

use App\Application\Quote\Commands\RejectQuoteCommand;
use App\Application\Quote\UseCases\RejectQuoteUseCase;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Domain\Notification\Services\NotificationService;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Property 21: Vendor Reject Requires Reason
 * 
 * Feature: quote-workflow-fixes
 * Task: 7.6 Write property test for reject validation
 * 
 * Validates: Requirements 6.6
 */
class VendorRejectPropertyTest extends TestCase
{
    use RefreshDatabase;

    private RejectQuoteUseCase $rejectQuoteUseCase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->rejectQuoteUseCase = new RejectQuoteUseCase(
            app(QuoteRepositoryInterface::class),
            app(NotificationService::class)
        );

        Event::fake();
    }

    /**
     * Property 21: Vendor Reject Requires Reason
     * 
     * Test that rejection without a reason fails validation.
     */
    public function test_property_21_vendor_reject_requires_reason(): void
    {
        $iterations = 10;
        
        for ($i = 0; $i < $iterations; $i++) {
            $tenant = Tenant::factory()->create();
            $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
            $vendor = Vendor::factory()->create(['tenant_id' => $tenant->id]);
            $vendorUser = User::factory()->create(['tenant_id' => $tenant->id]);

            $order = Order::factory()->create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer->id
            ]);

            // Create quote manually to avoid factory issues
            $quote = OrderVendorNegotiation::create([
                'uuid' => Str::uuid()->toString(),
                'tenant_id' => $tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'status' => 'sent',
                'initial_offer' => 150000,
                'latest_offer' => 150000,
                'currency' => 'IDR',
                'quote_details' => ['notes' => 'Test quote'],
                'history' => [],
                'status_history' => [],
                'round' => 1,
                'sent_at' => now()
            ]);

            // Test: Empty reason should fail
            try {
                $command = new RejectQuoteCommand(
                    quoteUuid: $quote->uuid,
                    vendorUserId: $vendorUser->id,
                    tenantId: $tenant->id,
                    reason: ''
                );

                $this->rejectQuoteUseCase->execute($command);
                $this->fail('Expected validation exception for empty rejection reason');
            } catch (\InvalidArgumentException $e) {
                $this->assertStringContainsString('reason', strtolower($e->getMessage()));
            }

            $quote->refresh();
            $this->assertEquals('sent', $quote->status);

            // Test: Whitespace-only reason should fail
            try {
                $command = new RejectQuoteCommand(
                    quoteUuid: $quote->uuid,
                    vendorUserId: $vendorUser->id,
                    tenantId: $tenant->id,
                    reason: '   '
                );

                $this->rejectQuoteUseCase->execute($command);
                $this->fail('Expected validation exception for whitespace rejection reason');
            } catch (\InvalidArgumentException $e) {
                $this->assertStringContainsString('reason', strtolower($e->getMessage()));
            }

            $quote->refresh();
            $this->assertEquals('sent', $quote->status);

            // Test: Valid reason should succeed
            $validReason = 'Price too high for our budget';
            $command = new RejectQuoteCommand(
                quoteUuid: $quote->uuid,
                vendorUserId: $vendorUser->id,
                tenantId: $tenant->id,
                reason: $validReason
            );

            $this->rejectQuoteUseCase->execute($command);

            $quote->refresh();
            $this->assertEquals('rejected', $quote->status);
            $this->assertEquals($validReason, $quote->response_notes);
            $this->assertNotNull($quote->responded_at);
        }
    }

    /**
     * Property 21b: Vendor Reject Stores Complete Data
     */
    public function test_property_21b_vendor_reject_stores_complete_data(): void
    {
        $iterations = 10;
        
        for ($i = 0; $i < $iterations; $i++) {
            $tenant = Tenant::factory()->create();
            $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
            $vendor = Vendor::factory()->create(['tenant_id' => $tenant->id]);
            $vendorUser = User::factory()->create(['tenant_id' => $tenant->id]);

            $order = Order::factory()->create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer->id
            ]);

            // Create quote manually
            $quote = OrderVendorNegotiation::create([
                'uuid' => Str::uuid()->toString(),
                'tenant_id' => $tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'status' => 'sent',
                'initial_offer' => 150000,
                'latest_offer' => 150000,
                'currency' => 'IDR',
                'quote_details' => ['notes' => 'Test quote'],
                'history' => [],
                'status_history' => [],
                'round' => 1,
                'sent_at' => now()
            ]);

            $rejectionReason = 'Material not available in our inventory';
            
            $command = new RejectQuoteCommand(
                quoteUuid: $quote->uuid,
                vendorUserId: $vendorUser->id,
                tenantId: $tenant->id,
                reason: $rejectionReason
            );

            $this->rejectQuoteUseCase->execute($command);

            $quote->refresh();
            
            $this->assertEquals('rejected', $quote->status);
            $this->assertEquals('reject', $quote->response_type);
            $this->assertEquals($rejectionReason, $quote->response_notes);
            $this->assertNotNull($quote->responded_at);
            
            $this->assertNotEmpty($quote->status_history);
            $statusHistory = $quote->status_history;
            $latestHistory = end($statusHistory);
            $this->assertEquals('rejected', $latestHistory['to']);
            $this->assertArrayHasKey('changed_at', $latestHistory);
        }
    }
}
