<?php

namespace Tests\Unit\Application\CustomerQuote\Services;

use App\Application\CustomerQuote\Services\ApprovalService;
use App\Domain\CustomerQuote\Repositories\ApprovalSettingsRepositoryInterface;
use App\Domain\CustomerQuote\Services\TrustScoreCalculator;
use App\Domain\CustomerQuote\ValueObjects\ApprovalSettings;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\VendorQuote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class ApprovalServiceTest extends TestCase
{
    use RefreshDatabase;

    private ApprovalService $service;
    private TenantEloquentModel $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant and user for foreign key constraints
        $this->tenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::factory()->create();
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Mock dependencies
        $settingsRepository = Mockery::mock(ApprovalSettingsRepositoryInterface::class);
        $trustScoreCalculator = Mockery::mock(TrustScoreCalculator::class);
        
        // Create service with mocked dependencies
        $this->service = new ApprovalService(
            $settingsRepository,
            $trustScoreCalculator,
            Mockery::mock(\App\Application\CustomerQuote\Services\CustomerNotificationService::class),
            Mockery::mock(\App\Application\CustomerQuote\Services\PaymentTrackingService::class)
        );
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /**
     * Helper method to create a quote with all required relationships
     */
    private function createQuoteWithRelationships(array $quoteData = [], array $orderData = [], array $customerData = []): CustomerQuote
    {
        $customer = Customer::factory()->create(array_merge([
            'tenant_id' => $this->tenant->id,
        ], $customerData));

        $order = Order::factory()->create(array_merge([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'items' => [['product_name' => 'Test Product', 'quantity' => 1]],
        ], $orderData));

        $vendorQuote = VendorQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            // Don't pass order_id - it doesn't exist in vendor_quotes table
        ]);

        return CustomerQuote::factory()->create(array_merge([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_quote_id' => $vendorQuote->id,
            'created_by' => $this->user->id,
        ], $quoteData));
    }

    /** @test */
    public function it_auto_approves_when_all_conditions_are_met(): void
    {
        // Arrange
        $settings = ApprovalSettings::fromArray([
            'auto_approval_enabled' => true,
            'auto_approval_threshold' => 10000000,
            'require_email_verification' => true,
            'min_successful_orders' => 2,
            'min_payment_success_rate' => 80.0,
            'require_approval_custom_products' => true,
        ]);

        $customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email_verified_at' => now(),
        ]);

        // Create 8 completed orders and 2 pending orders
        // This gives 80% payment success rate (8/10)
        // Note: The quote's order will be added to the total, so we need to account for that
        Order::factory()->count(8)->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'status' => 'completed',
            'items' => [['product_name' => 'Test', 'quantity' => 1]],
        ]);

        Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'status' => 'pending',
            'items' => [['product_name' => 'Test', 'quantity' => 1]],
        ]);

        $quote = $this->createQuoteWithRelationships(
            ['grand_total' => 5000000],
            [
                'customer_id' => $customer->id,
                'status' => 'customer_quote', // This order will be counted
                'items' => [['product_name' => 'Standard Product', 'is_custom' => false]],
            ]
        );

        // Act
        $decision = $this->service->shouldAutoApprove($quote->fresh(), $settings);

        // Assert
        $this->assertTrue($decision->shouldAutoApprove());
        $this->assertNull($decision->getReason());
    }

    /** @test */
    public function it_requires_manual_approval_when_order_value_exceeds_threshold(): void
    {
        $settings = ApprovalSettings::fromArray([
            'auto_approval_enabled' => true,
            'auto_approval_threshold' => 5000000,
            'require_email_verification' => false,
            'min_successful_orders' => 0,
            'min_payment_success_rate' => 0.0,
        ]);

        $quote = $this->createQuoteWithRelationships(['grand_total' => 10000000]);

        $decision = $this->service->shouldAutoApprove($quote, $settings);

        $this->assertFalse($decision->shouldAutoApprove());
        $this->assertStringContainsString('exceeds threshold', $decision->getReason());
    }

    /** @test */
    public function it_requires_manual_approval_when_email_not_verified(): void
    {
        $settings = ApprovalSettings::fromArray([
            'auto_approval_enabled' => true,
            'auto_approval_threshold' => 10000000,
            'require_email_verification' => true,
            'min_successful_orders' => 0,
            'min_payment_success_rate' => 0.0,
        ]);

        $quote = $this->createQuoteWithRelationships(
            ['grand_total' => 5000000],
            [],
            ['email_verified_at' => null]
        );

        $decision = $this->service->shouldAutoApprove($quote, $settings);

        $this->assertFalse($decision->shouldAutoApprove());
        $this->assertStringContainsString('email not verified', $decision->getReason());
    }

    /** @test */
    public function it_requires_manual_approval_when_insufficient_successful_orders(): void
    {
        $settings = ApprovalSettings::fromArray([
            'auto_approval_enabled' => true,
            'auto_approval_threshold' => 10000000,
            'require_email_verification' => false,
            'min_successful_orders' => 3,
            'min_payment_success_rate' => 0.0,
        ]);

        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'status' => 'completed',
            'items' => [['product_name' => 'Test', 'quantity' => 1]],
        ]);

        $quote = $this->createQuoteWithRelationships(
            ['grand_total' => 5000000],
            ['customer_id' => $customer->id]
        );

        $decision = $this->service->shouldAutoApprove($quote->fresh(), $settings);

        $this->assertFalse($decision->shouldAutoApprove());
        $this->assertStringContainsString('has 1 successful orders (minimum: 3)', $decision->getReason());
    }

    /** @test */
    public function it_requires_manual_approval_when_payment_success_rate_too_low(): void
    {
        $settings = ApprovalSettings::fromArray([
            'auto_approval_enabled' => true,
            'auto_approval_threshold' => 10000000,
            'require_email_verification' => false,
            'min_successful_orders' => 0,
            'min_payment_success_rate' => 80.0,
        ]);

        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        Order::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'status' => 'completed',
            'items' => [['product_name' => 'Test', 'quantity' => 1]],
        ]);

        Order::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'status' => 'pending',
            'items' => [['product_name' => 'Test', 'quantity' => 1]],
        ]);

        $quote = $this->createQuoteWithRelationships(
            ['grand_total' => 5000000],
            ['customer_id' => $customer->id]
        );

        $decision = $this->service->shouldAutoApprove($quote->fresh(), $settings);

        $this->assertFalse($decision->shouldAutoApprove());
        $this->assertStringContainsString('Payment success rate', $decision->getReason());
    }

    /** @test */
    public function it_requires_manual_approval_when_order_has_custom_products(): void
    {
        $settings = ApprovalSettings::fromArray([
            'auto_approval_enabled' => true,
            'auto_approval_threshold' => 10000000,
            'require_email_verification' => false,
            'min_successful_orders' => 0,
            'min_payment_success_rate' => 0.0,
            'require_approval_custom_products' => true,
        ]);

        $quote = $this->createQuoteWithRelationships(
            ['grand_total' => 5000000],
            ['items' => [['product_name' => 'Custom Etching', 'is_custom' => true]]]
        );

        $decision = $this->service->shouldAutoApprove($quote, $settings);

        $this->assertFalse($decision->shouldAutoApprove());
        $this->assertStringContainsString('custom products', $decision->getReason());
    }

    /** @test */
    public function it_auto_approves_custom_products_when_setting_disabled(): void
    {
        $settings = ApprovalSettings::fromArray([
            'auto_approval_enabled' => true,
            'auto_approval_threshold' => 10000000,
            'require_email_verification' => false,
            'min_successful_orders' => 0,
            'min_payment_success_rate' => 0.0,
            'require_approval_custom_products' => false,
        ]);

        $quote = $this->createQuoteWithRelationships(
            ['grand_total' => 5000000],
            ['items' => [['product_name' => 'Custom Etching', 'is_custom' => true]]]
        );

        $decision = $this->service->shouldAutoApprove($quote, $settings);

        $this->assertTrue($decision->shouldAutoApprove());
    }

    /** @test */
    public function it_combines_multiple_failure_reasons(): void
    {
        $settings = ApprovalSettings::fromArray([
            'auto_approval_enabled' => true,
            'auto_approval_threshold' => 5000000,
            'require_email_verification' => true,
            'min_successful_orders' => 2,
            'min_payment_success_rate' => 80.0,
            'require_approval_custom_products' => true,
        ]);

        $quote = $this->createQuoteWithRelationships(
            ['grand_total' => 10000000],
            ['items' => [['product_name' => 'Custom Product', 'is_custom' => true]]],
            ['email_verified_at' => null]
        );

        $decision = $this->service->shouldAutoApprove($quote, $settings);

        $this->assertFalse($decision->shouldAutoApprove());
        $reason = $decision->getReason();
        
        $this->assertStringContainsString('exceeds threshold', $reason);
        $this->assertStringContainsString('email not verified', $reason);
        $this->assertStringContainsString('successful orders', $reason);
        $this->assertStringContainsString('custom products', $reason);
    }

    /** @test */
    public function it_handles_edge_case_at_exact_threshold(): void
    {
        $settings = ApprovalSettings::fromArray([
            'auto_approval_enabled' => true,
            'auto_approval_threshold' => 5000000,
            'require_email_verification' => false,
            'min_successful_orders' => 0,
            'min_payment_success_rate' => 0.0,
        ]);

        $quote = $this->createQuoteWithRelationships(['grand_total' => 5000000]);

        $decision = $this->service->shouldAutoApprove($quote, $settings);

        $this->assertTrue($decision->shouldAutoApprove());
    }

    /** @test */
    public function it_handles_edge_case_one_cent_above_threshold(): void
    {
        $settings = ApprovalSettings::fromArray([
            'auto_approval_enabled' => true,
            'auto_approval_threshold' => 5000000,
            'require_email_verification' => false,
            'min_successful_orders' => 0,
            'min_payment_success_rate' => 0.0,
        ]);

        $quote = $this->createQuoteWithRelationships(['grand_total' => 5000001]);

        $decision = $this->service->shouldAutoApprove($quote, $settings);

        $this->assertFalse($decision->shouldAutoApprove());
        $this->assertStringContainsString('exceeds threshold', $decision->getReason());
    }
}
