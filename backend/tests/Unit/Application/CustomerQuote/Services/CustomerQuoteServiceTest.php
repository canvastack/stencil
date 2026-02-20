<?php

namespace Tests\Unit\Application\CustomerQuote\Services;

use App\Application\CustomerQuote\Services\CustomerQuoteService;
use App\Domain\CustomerQuote\Repositories\CustomerQuoteRepositoryInterface;
use App\Domain\CustomerQuote\Repositories\ApprovalSettingsRepositoryInterface;
use App\Domain\CustomerQuote\Services\PricingCalculatorService;
use App\Domain\CustomerQuote\Services\TrustScoreCalculator;
use App\Domain\CustomerQuote\Services\QuoteExpirationChecker;
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

class CustomerQuoteServiceTest extends TestCase
{
    use RefreshDatabase;

    private CustomerQuoteService $service;
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
        $this->service = app(CustomerQuoteService::class);
    }

    /** @test */
    public function it_creates_customer_quote_from_vendor_quote(): void
    {
        // Arrange
        $additionalCosts = [
            'base_profit' => 2000000,
            'handling_fee' => 500000,
        ];

        $terms = [
            'title' => 'Test Quote',
            'tax_rate' => 11.00,
            'payment_terms' => 'DP 50%',
            'valid_until' => Carbon::now()->addDays(7),
        ];

        // Act
        $quote = $this->service->createFromVendorQuote(
            tenantId: $this->tenant->id,
            orderId: $this->order->id,
            vendorQuoteId: $this->vendorQuote->id,
            additionalCosts: $additionalCosts,
            terms: $terms,
            createdBy: $this->user->id
        );

        // Assert
        $this->assertInstanceOf(CustomerQuote::class, $quote);
        $this->assertEquals($this->tenant->id, $quote->tenant_id);
        $this->assertEquals($this->order->id, $quote->order_id);
        $this->assertEquals($this->vendorQuote->id, $quote->vendor_quote_id);
        $this->assertEquals('draft', $quote->status);
        $this->assertNotNull($quote->quote_number);
        $this->assertNotNull($quote->uuid);
        $this->assertIsArray($quote->history);
        $this->assertNotEmpty($quote->history);
    }

    /** @test */
    public function it_sends_quote_to_customer(): void
    {
        // Arrange
        $quote = $this->createTestQuote();

        // Act
        $sentQuote = $this->service->sendToCustomer($quote->uuid, $this->user->id);

        // Assert
        $this->assertEquals('sent', $sentQuote->status);
        $this->assertNotNull($sentQuote->sent_at);
        $this->assertEquals($this->user->id, $sentQuote->sent_by);
    }

    /** @test */
    public function it_cannot_send_non_draft_quote(): void
    {
        // Arrange
        $quote = $this->createTestQuote(['status' => 'sent']);

        // Assert
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Only draft quotes can be sent');

        // Act
        $this->service->sendToCustomer($quote->uuid, $this->user->id);
    }

    /** @test */
    public function it_gets_quote_by_uuid(): void
    {
        // Arrange
        $quote = $this->createTestQuote();

        // Act
        $found = $this->service->getByUuid($quote->uuid);

        // Assert
        $this->assertNotNull($found);
        $this->assertEquals($quote->id, $found->id);
    }

    /** @test */
    public function it_gets_quote_by_token(): void
    {
        // Arrange
        $quote = $this->createTestQuote();

        // Act
        $found = $this->service->getByToken($quote->response_token);

        // Assert
        $this->assertNotNull($found);
        $this->assertEquals($quote->id, $found->id);
    }

    /** @test */
    public function it_marks_quote_as_viewed(): void
    {
        // Arrange
        $quote = $this->createTestQuote();
        $this->assertNull($quote->viewed_at);

        // Act
        $viewedQuote = $this->service->markAsViewed($quote->uuid);

        // Assert
        $this->assertNotNull($viewedQuote->viewed_at);
    }

    /** @test */
    public function it_rejects_quote_with_reason(): void
    {
        // Arrange
        $quote = $this->createTestQuote(['status' => 'sent']);
        $reason = 'Price is too high for our budget';

        // Act
        $rejectedQuote = $this->service->rejectQuote(
            $quote->uuid,
            $this->user->id, // Use user ID, not customer ID
            $reason
        );

        // Assert
        $this->assertEquals('rejected', $rejectedQuote->status);
        $this->assertEquals($reason, $rejectedQuote->rejection_reason);
        $this->assertNotNull($rejectedQuote->rejected_at);
    }

    private function createTestQuote(array $overrides = []): CustomerQuote
    {
        return CustomerQuote::create(array_merge([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_quote_id' => $this->vendorQuote->id,
            'quote_number' => 'CQ-202602-0001',
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
        ], $overrides));
    }
}
