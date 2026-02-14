<?php

namespace Tests\Unit\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Unit tests for Order model vendor quote functionality
 * 
 * Tests the new vendor quote methods added for post-acceptance workflow integration:
 * - setVendorQuoteInfo()
 * - getProductionProgress()
 */
class OrderModelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    /** @test */
    public function it_sets_vendor_quote_info_correctly(): void
    {
        // Arrange
        $tenant = Tenant::factory()->create();
        $customer = Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        
        $order = Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
        ]);
        
        $quoteId = 123;
        $agreedPrice = 15000000; // 150,000.00 IDR in cents
        $estimatedDeliveryDays = 18;
        
        // Act
        $order->setVendorQuoteInfo($quoteId, $agreedPrice, $estimatedDeliveryDays);
        
        // Assert
        $this->assertEquals($quoteId, $order->vendor_quote_id);
        $this->assertEquals($agreedPrice, $order->vendor_agreed_price);
        $this->assertEquals($estimatedDeliveryDays, $order->vendor_estimated_delivery_days);
        $this->assertNotNull($order->vendor_quote_accepted_at);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $order->vendor_quote_accepted_at);
    }

    /** @test */
    public function it_calculates_production_progress_correctly(): void
    {
        // Arrange
        $tenant = Tenant::factory()->create();
        $customer = Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        
        $order = Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'vendor_quote_accepted_at' => now()->subDays(5),
            'vendor_estimated_delivery_days' => 18,
        ]);
        
        // Act
        $progress = $order->getProductionProgress();
        
        // Assert
        $this->assertIsArray($progress);
        $this->assertArrayHasKey('accepted_date', $progress);
        $this->assertArrayHasKey('expected_delivery_date', $progress);
        $this->assertArrayHasKey('days_elapsed', $progress);
        $this->assertArrayHasKey('days_remaining', $progress);
        $this->assertArrayHasKey('progress_percentage', $progress);
        $this->assertArrayHasKey('is_overdue', $progress);
        $this->assertArrayHasKey('overdue_days', $progress);
        
        $this->assertEquals(5, $progress['days_elapsed']);
        // Allow for timing variance (12-13 days remaining)
        $this->assertGreaterThanOrEqual(12, $progress['days_remaining']);
        $this->assertLessThanOrEqual(13, $progress['days_remaining']);
        $this->assertFalse($progress['is_overdue']);
        $this->assertEquals(0, $progress['overdue_days']);
        $this->assertGreaterThan(0, $progress['progress_percentage']);
        $this->assertLessThanOrEqual(100, $progress['progress_percentage']);
    }

    /** @test */
    public function it_detects_overdue_production(): void
    {
        // Arrange - Order accepted 20 days ago with 18 day estimate
        $tenant = Tenant::factory()->create();
        $customer = Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        
        $order = Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'vendor_quote_accepted_at' => now()->subDays(20),
            'vendor_estimated_delivery_days' => 18,
        ]);
        
        // Act
        $progress = $order->getProductionProgress();
        
        // Assert
        $this->assertIsArray($progress);
        $this->assertEquals(20, $progress['days_elapsed']);
        $this->assertEquals(0, $progress['days_remaining']); // Capped at 0
        $this->assertTrue($progress['is_overdue']);
        $this->assertEquals(2, $progress['overdue_days']);
        $this->assertEquals(100, $progress['progress_percentage']); // Capped at 100
    }

    /** @test */
    public function it_returns_null_when_vendor_quote_info_not_available(): void
    {
        // Arrange - Order without vendor quote info
        $tenant = Tenant::factory()->create();
        $customer = Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        
        $order = Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'vendor_quote_accepted_at' => null,
            'vendor_estimated_delivery_days' => null,
        ]);
        
        // Act
        $progress = $order->getProductionProgress();
        
        // Assert
        $this->assertNull($progress);
    }

    /** @test */
    public function it_returns_null_when_only_accepted_date_is_set(): void
    {
        // Arrange
        $tenant = Tenant::factory()->create();
        $customer = Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        
        $order = Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'vendor_quote_accepted_at' => now(),
            'vendor_estimated_delivery_days' => null,
        ]);
        
        // Act
        $progress = $order->getProductionProgress();
        
        // Assert
        $this->assertNull($progress);
    }

    /** @test */
    public function it_returns_null_when_only_estimated_days_is_set(): void
    {
        // Arrange
        $tenant = Tenant::factory()->create();
        $customer = Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        
        $order = Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'vendor_quote_accepted_at' => null,
            'vendor_estimated_delivery_days' => 18,
        ]);
        
        // Act
        $progress = $order->getProductionProgress();
        
        // Assert
        $this->assertNull($progress);
    }

    /** @test */
    public function it_calculates_progress_percentage_correctly_at_various_stages(): void
    {
        // Arrange
        $tenant = Tenant::factory()->create();
        $customer = Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        
        // Test at 0% (just accepted)
        $order = Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'vendor_quote_accepted_at' => now(),
            'vendor_estimated_delivery_days' => 18,
        ]);
        
        $progress = $order->getProductionProgress();
        $this->assertEquals(0, $progress['days_elapsed']);
        $this->assertLessThanOrEqual(10, $progress['progress_percentage']); // Allow small variance for timing
        
        // Test at ~50% (9 days elapsed of 18)
        $order->vendor_quote_accepted_at = now()->subDays(9);
        $order->save();
        
        $progress = $order->getProductionProgress();
        $this->assertEquals(9, $progress['days_elapsed']);
        $this->assertGreaterThanOrEqual(45, $progress['progress_percentage']);
        $this->assertLessThanOrEqual(55, $progress['progress_percentage']);
        
        // Test at ~100% (18 days elapsed of 18)
        $order->vendor_quote_accepted_at = now()->subDays(18);
        $order->save();
        
        $progress = $order->getProductionProgress();
        $this->assertEquals(18, $progress['days_elapsed']);
        $this->assertEquals(100, $progress['progress_percentage']);
    }

    /** @test */
    public function it_formats_dates_as_iso_strings(): void
    {
        // Arrange
        $tenant = Tenant::factory()->create();
        $customer = Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        
        $order = Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'vendor_quote_accepted_at' => now()->subDays(5),
            'vendor_estimated_delivery_days' => 18,
        ]);
        
        // Act
        $progress = $order->getProductionProgress();
        
        // Assert
        $this->assertIsString($progress['accepted_date']);
        $this->assertIsString($progress['expected_delivery_date']);
        
        // Verify ISO 8601 format
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/',
            $progress['accepted_date']
        );
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/',
            $progress['expected_delivery_date']
        );
    }

    /** @test */
    public function it_has_vendor_quote_relationship(): void
    {
        // Arrange
        $tenant = Tenant::factory()->create();
        
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        
        $customer = Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        
        $order = Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'vendor_quote_id' => $quote->id,
        ]);
        
        // Act
        $loadedQuote = $order->vendorQuote;
        
        // Assert
        $this->assertInstanceOf(OrderVendorNegotiation::class, $loadedQuote);
        $this->assertEquals($quote->id, $loadedQuote->id);
    }

    /** @test */
    public function it_persists_vendor_quote_info_to_database(): void
    {
        // Arrange
        $tenant = Tenant::factory()->create();
        $customer = Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        
        // Create a real quote to satisfy foreign key constraint
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        
        $order = Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
        ]);
        
        $agreedPrice = 25000000;
        $estimatedDeliveryDays = 21;
        
        // Act
        $order->setVendorQuoteInfo($quote->id, $agreedPrice, $estimatedDeliveryDays);
        $order->save();
        
        // Assert - Reload from database
        $reloadedOrder = Order::find($order->id);
        $this->assertEquals($quote->id, $reloadedOrder->vendor_quote_id);
        $this->assertEquals($agreedPrice, $reloadedOrder->vendor_agreed_price);
        $this->assertEquals($estimatedDeliveryDays, $reloadedOrder->vendor_estimated_delivery_days);
        $this->assertNotNull($reloadedOrder->vendor_quote_accepted_at);
    }
}
