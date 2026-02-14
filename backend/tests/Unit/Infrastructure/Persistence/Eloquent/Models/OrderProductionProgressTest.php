<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure\Persistence\Eloquent\Models;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

/**
 * OrderProductionProgressTest
 * 
 * Tests the production progress calculation methods on the Order model.
 * These methods are part of the post-acceptance workflow integration.
 * 
 * Requirements: TR-1, US-4 (Production Timeline Tracking)
 */
class OrderProductionProgressTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = TenantEloquentModel::factory()->create();
    }

    /** @test */
    public function it_calculates_production_progress_correctly(): void
    {
        // Arrange
        Carbon::setTestNow('2026-02-13 12:00:00');
        
        $acceptedDate = Carbon::now()->subDays(5);
        $estimatedDays = 20;
        
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_quote_accepted_at' => $acceptedDate,
            'vendor_estimated_delivery_days' => $estimatedDays,
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
        $this->assertEquals(15, $progress['days_remaining']);
        $this->assertEquals(25.0, $progress['progress_percentage']);
        $this->assertFalse($progress['is_overdue']);
        $this->assertEquals(0, $progress['overdue_days']);
        
        Carbon::setTestNow(); // Reset
    }

    /** @test */
    public function it_returns_null_when_vendor_quote_not_accepted(): void
    {
        // Arrange
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_quote_accepted_at' => null,
            'vendor_estimated_delivery_days' => 20,
        ]);

        // Act
        $progress = $order->getProductionProgress();

        // Assert
        $this->assertNull($progress);
    }

    /** @test */
    public function it_returns_null_when_estimated_delivery_days_not_set(): void
    {
        // Arrange
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_quote_accepted_at' => Carbon::now(),
            'vendor_estimated_delivery_days' => null,
        ]);

        // Act
        $progress = $order->getProductionProgress();

        // Assert
        $this->assertNull($progress);
    }

    /** @test */
    public function it_detects_overdue_production(): void
    {
        // Arrange
        $acceptedDate = Carbon::now()->subDays(25);
        $estimatedDays = 20;
        
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_quote_accepted_at' => $acceptedDate,
            'vendor_estimated_delivery_days' => $estimatedDays,
        ]);

        // Act
        $progress = $order->getProductionProgress();

        // Assert
        $this->assertTrue($progress['is_overdue']);
        $this->assertEquals(5, $progress['overdue_days']);
        $this->assertEquals(0, $progress['days_remaining']);
        $this->assertEquals(100.0, $progress['progress_percentage']);
    }

    /** @test */
    public function it_caps_progress_percentage_at_100(): void
    {
        // Arrange
        $acceptedDate = Carbon::now()->subDays(30);
        $estimatedDays = 20;
        
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_quote_accepted_at' => $acceptedDate,
            'vendor_estimated_delivery_days' => $estimatedDays,
        ]);

        // Act
        $progress = $order->getProductionProgress();

        // Assert
        $this->assertEquals(100.0, $progress['progress_percentage']);
        $this->assertTrue($progress['is_overdue']);
    }

    /** @test */
    public function it_calculates_correct_expected_delivery_date(): void
    {
        // Arrange
        $acceptedDate = Carbon::parse('2026-02-01 10:00:00');
        $estimatedDays = 15;
        
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_quote_accepted_at' => $acceptedDate,
            'vendor_estimated_delivery_days' => $estimatedDays,
        ]);

        // Act
        $progress = $order->getProductionProgress();

        // Assert
        $expectedDate = $acceptedDate->copy()->addDays($estimatedDays);
        $this->assertEquals($expectedDate->toISOString(), $progress['expected_delivery_date']);
    }

    /** @test */
    public function it_handles_just_accepted_quote(): void
    {
        // Arrange
        Carbon::setTestNow('2026-02-13 12:00:00');
        
        $acceptedDate = Carbon::now();
        $estimatedDays = 20;
        
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_quote_accepted_at' => $acceptedDate,
            'vendor_estimated_delivery_days' => $estimatedDays,
        ]);

        // Act
        $progress = $order->getProductionProgress();

        // Assert
        $this->assertEquals(0, $progress['days_elapsed']);
        $this->assertEquals(20, $progress['days_remaining']);
        $this->assertEquals(0.0, $progress['progress_percentage']);
        $this->assertFalse($progress['is_overdue']);
        
        Carbon::setTestNow(); // Reset
    }

    /** @test */
    public function it_handles_approaching_deadline(): void
    {
        // Arrange
        Carbon::setTestNow('2026-02-13 12:00:00');
        
        $acceptedDate = Carbon::now()->subDays(18);
        $estimatedDays = 20;
        
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_quote_accepted_at' => $acceptedDate,
            'vendor_estimated_delivery_days' => $estimatedDays,
        ]);

        // Act
        $progress = $order->getProductionProgress();

        // Assert
        $this->assertEquals(18, $progress['days_elapsed']);
        $this->assertEquals(2, $progress['days_remaining']);
        $this->assertEquals(90.0, $progress['progress_percentage']);
        $this->assertFalse($progress['is_overdue']);
        
        Carbon::setTestNow(); // Reset
    }

    /** @test */
    public function it_sets_vendor_quote_info_correctly(): void
    {
        // Arrange
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_quote_id' => null,
            'vendor_quote_accepted_at' => null,
            'vendor_agreed_price' => null,
            'vendor_estimated_delivery_days' => null,
        ]);

        $quoteId = 123;
        $agreedPrice = 15000000;
        $estimatedDays = 18;

        // Act
        $order->setVendorQuoteInfo($quoteId, $agreedPrice, $estimatedDays);

        // Assert
        $this->assertEquals($quoteId, $order->vendor_quote_id);
        $this->assertNotNull($order->vendor_quote_accepted_at);
        $this->assertEquals($agreedPrice, $order->vendor_agreed_price);
        $this->assertEquals($estimatedDays, $order->vendor_estimated_delivery_days);
    }

    /** @test */
    public function it_sets_accepted_at_to_current_time(): void
    {
        // Arrange
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $beforeTime = Carbon::now()->subSecond();

        // Act
        $order->setVendorQuoteInfo(123, 15000000, 18);

        $afterTime = Carbon::now()->addSecond();

        // Assert
        $this->assertNotNull($order->vendor_quote_accepted_at);
        $this->assertTrue($order->vendor_quote_accepted_at->between($beforeTime, $afterTime));
    }

    /** @test */
    public function it_returns_correct_iso_date_format(): void
    {
        // Arrange
        $acceptedDate = Carbon::parse('2026-02-13 14:30:00');
        
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_quote_accepted_at' => $acceptedDate,
            'vendor_estimated_delivery_days' => 20,
        ]);

        // Act
        $progress = $order->getProductionProgress();

        // Assert
        $this->assertStringContainsString('2026-02-13', $progress['accepted_date']);
        $this->assertStringContainsString('T', $progress['accepted_date']);
        $this->assertStringContainsString('Z', $progress['accepted_date']);
    }

    /** @test */
    public function it_handles_fractional_days_correctly(): void
    {
        // Arrange
        $acceptedDate = Carbon::now()->subHours(36); // 1.5 days
        $estimatedDays = 10;
        
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_quote_accepted_at' => $acceptedDate,
            'vendor_estimated_delivery_days' => $estimatedDays,
        ]);

        // Act
        $progress = $order->getProductionProgress();

        // Assert
        $this->assertIsInt($progress['days_elapsed']);
        $this->assertIsInt($progress['days_remaining']);
        $this->assertIsFloat($progress['progress_percentage']);
    }

    /** @test */
    public function it_never_returns_negative_days_remaining(): void
    {
        // Arrange
        $acceptedDate = Carbon::now()->subDays(30);
        $estimatedDays = 20;
        
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_quote_accepted_at' => $acceptedDate,
            'vendor_estimated_delivery_days' => $estimatedDays,
        ]);

        // Act
        $progress = $order->getProductionProgress();

        // Assert
        $this->assertGreaterThanOrEqual(0, $progress['days_remaining']);
    }

    /** @test */
    public function it_rounds_progress_percentage_to_two_decimals(): void
    {
        // Arrange
        $acceptedDate = Carbon::now()->subDays(7);
        $estimatedDays = 30;
        
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_quote_accepted_at' => $acceptedDate,
            'vendor_estimated_delivery_days' => $estimatedDays,
        ]);

        // Act
        $progress = $order->getProductionProgress();

        // Assert
        $this->assertEquals(23.33, $progress['progress_percentage']);
    }
}
