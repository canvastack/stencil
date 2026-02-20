<?php

namespace Tests\Unit\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\VendorQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\VendorSourcing;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Unit tests for CustomerQuote model
 * 
 * Tests the CustomerQuote model functionality:
 * - Relationships
 * - Scopes
 * - Attributes/Accessors
 * - UUID generation
 */
class CustomerQuoteModelTest extends TestCase
{
    use RefreshDatabase;

    protected $tenant;
    protected $customer;
    protected $user;
    protected $order;
    protected $vendorQuote;
    protected $vendor;
    protected $vendorSourcing;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);
        
        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        
        // Create vendor sourcing request
        $this->vendorSourcing = VendorSourcing::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
        ]);
        
        // Create vendor quote with proper foreign keys
        $this->vendorQuote = VendorQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'sourcing_request_id' => $this->vendorSourcing->id,
            'vendor_id' => $this->vendor->id,
            'amount' => 10000000,
            'status' => 'accepted',
            'valid_until' => now()->addDays(30),
        ]);
    }

    private function createQuote(array $overrides = []): CustomerQuote
    {
        return CustomerQuote::create(array_merge([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_quote_id' => $this->vendorQuote->id,
            'quote_number' => 'CQ-2024-' . str_pad((string)rand(1, 9999), 4, '0', STR_PAD_LEFT),
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
            'valid_until' => now()->addDays(7),
            'payment_terms' => 'DP 50% + Balance 50%',
            'created_by' => $this->user->id,
        ], $overrides));
    }

    /** @test */
    public function it_generates_uuid_on_creation(): void
    {
        // Arrange & Act
        $quote = $this->createQuote();

        // Assert
        $this->assertNotNull($quote->uuid);
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/',
            $quote->uuid
        );
    }

    /** @test */
    public function it_generates_response_token_on_creation(): void
    {
        // Arrange & Act
        $quote = $this->createQuote();

        // Assert
        $this->assertNotNull($quote->response_token);
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/',
            $quote->response_token
        );
    }

    /** @test */
    public function it_initializes_history_and_metadata_as_empty_arrays(): void
    {
        // Arrange & Act
        $quote = $this->createQuote();

        // Assert
        $this->assertIsArray($quote->history);
        $this->assertEmpty($quote->history);
        $this->assertIsArray($quote->metadata);
        $this->assertEmpty($quote->metadata);
    }

    /** @test */
    public function it_checks_if_quote_is_expired(): void
    {
        // Arrange - Expired quote
        $expiredQuote = $this->createQuote([
            'valid_until' => now()->subDays(1),
        ]);

        // Arrange - Valid quote
        $validQuote = $this->createQuote([
            'valid_until' => now()->addDays(7),
        ]);

        // Assert
        $this->assertTrue($expiredQuote->isExpired());
        $this->assertFalse($validQuote->isExpired());
    }

    /** @test */
    public function it_checks_if_quote_can_be_accepted(): void
    {
        // Arrange - Can be accepted (sent status, not expired)
        $acceptableQuote = $this->createQuote([
            'status' => 'sent',
        ]);

        // Arrange - Cannot be accepted (expired)
        $expiredQuote = $this->createQuote([
            'status' => 'sent',
            'valid_until' => now()->subDays(1),
        ]);

        // Arrange - Cannot be accepted (wrong status)
        $acceptedQuote = $this->createQuote([
            'status' => 'accepted',
        ]);

        // Assert
        $this->assertTrue($acceptableQuote->canBeAccepted());
        $this->assertFalse($expiredQuote->canBeAccepted());
        $this->assertFalse($acceptedQuote->canBeAccepted());
    }

    /** @test */
    public function it_checks_if_quote_can_be_countered(): void
    {
        // Arrange - Can be countered
        $counterableQuote = $this->createQuote([
            'status' => 'sent',
            'counter_offer_round' => 0,
            'max_negotiation_rounds' => 3,
        ]);

        // Arrange - Cannot be countered (max rounds reached)
        $maxRoundsQuote = $this->createQuote([
            'status' => 'sent',
            'counter_offer_round' => 3,
            'max_negotiation_rounds' => 3,
        ]);

        // Assert
        $this->assertTrue($counterableQuote->canBeCountered());
        $this->assertFalse($maxRoundsQuote->canBeCountered());
    }

    /** @test */
    public function it_adds_history_entry(): void
    {
        // Arrange
        $quote = $this->createQuote();

        $historyEntry = [
            'action' => 'quote_sent',
            'actor_type' => 'admin',
            'actor_id' => $this->user->id,
            'timestamp' => now()->toIso8601String(),
        ];

        // Act
        $quote->addHistoryEntry($historyEntry);

        // Assert
        $quote->refresh();
        $this->assertCount(1, $quote->history);
        $this->assertEquals('quote_sent', $quote->history[0]['action']);
        $this->assertEquals('admin', $quote->history[0]['actor_type']);
    }

    /** @test */
    public function it_has_pending_approval_scope(): void
    {
        // Arrange
        $this->createQuote(['status' => 'pending_approval']);
        $this->createQuote(['status' => 'sent']);

        // Act
        $pendingQuotes = CustomerQuote::pendingApproval()->get();

        // Assert
        $this->assertCount(1, $pendingQuotes);
        $this->assertEquals('pending_approval', $pendingQuotes->first()->status);
    }

    /** @test */
    public function it_has_expired_scope(): void
    {
        // Arrange
        $this->createQuote(['valid_until' => now()->subDays(1)]);
        $this->createQuote(['valid_until' => now()->addDays(7)]);

        // Act
        $expiredQuotes = CustomerQuote::expired()->get();

        // Assert
        $this->assertCount(1, $expiredQuotes);
        $this->assertTrue($expiredQuotes->first()->isExpired());
    }

    /** @test */
    public function it_has_active_scope(): void
    {
        // Arrange
        $this->createQuote(['status' => 'sent', 'valid_until' => now()->addDays(7)]);
        $this->createQuote(['status' => 'rejected', 'valid_until' => now()->addDays(7)]);
        $this->createQuote(['status' => 'sent', 'valid_until' => now()->subDays(1)]);

        // Act
        $activeQuotes = CustomerQuote::active()->get();

        // Assert
        $this->assertCount(1, $activeQuotes);
        $this->assertEquals('sent', $activeQuotes->first()->status);
        $this->assertFalse($activeQuotes->first()->isExpired());
    }

    /** @test */
    public function it_uses_uuid_as_route_key(): void
    {
        // Arrange
        $quote = $this->createQuote();

        // Assert
        $this->assertEquals('uuid', $quote->getRouteKeyName());
    }
}

