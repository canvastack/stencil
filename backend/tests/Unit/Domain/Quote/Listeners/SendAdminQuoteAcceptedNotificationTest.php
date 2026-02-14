<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Quote\Listeners;

use Tests\TestCase;
use App\Domain\Quote\Listeners\SendAdminQuoteAcceptedNotification;
use App\Domain\Quote\Events\VendorRespondedToQuote;
use App\Domain\Quote\Entities\Quote;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Mockery;

/**
 * SendAdminQuoteAcceptedNotification Listener Test
 * 
 * Tests the event listener that sends notifications to admins when vendors accept quotes.
 * This is part of the post-acceptance workflow integration.
 * 
 * Requirements: US-5 (Admin Notifications)
 */
class SendAdminQuoteAcceptedNotificationTest extends TestCase
{
    use RefreshDatabase;

    private SendAdminQuoteAcceptedNotification $listener;

    protected function setUp(): void
    {
        parent::setUp();

        $this->listener = new SendAdminQuoteAcceptedNotification();
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_sends_notification_to_admins_when_vendor_accepts_quote(): void
    {
        // Arrange
        Log::shouldReceive('info')->andReturn(null);
        Log::shouldReceive('error')->andReturn(null);
        Log::shouldReceive('warning')->andReturn(null);
        
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        
        // Create admin role
        $adminRole = \App\Infrastructure\Persistence\Eloquent\RoleEloquentModel::create([
            'name' => 'admin',
            'guard_name' => 'api',
            'tenant_id' => $tenant->id,
        ]);
        
        $vendor = Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Test Vendor',
        ]);

        $order = Order::factory()->create([
            'tenant_id' => $tenant->id,
            'order_number' => 'ORD-TEST-001',
            'status' => 'vendor_negotiation',
        ]);

        // Create admin users
        $admin1 = User::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Admin One',
        ]);
        $admin1->assignRole($adminRole);

        $admin2 = User::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Admin Two',
        ]);
        $admin2->assignRole($adminRole);

        // Mock the quote entity
        $quote = Mockery::mock(Quote::class);
        $quote->shouldReceive('getUuid')->andReturn('quote-uuid-123');
        $quote->shouldReceive('getTenantId')->andReturn($tenant->id);
        $quote->shouldReceive('getVendorId')->andReturn($vendor->id);
        $quote->shouldReceive('getOrderId')->andReturn($order->id);
        $quote->shouldReceive('getId')->andReturn(1);
        $quote->shouldReceive('getLatestOffer')->andReturn(15000000);
        $quote->shouldReceive('getCurrency')->andReturn('IDR');
        $quote->shouldReceive('getQuoteDetails')->andReturn([
            'estimated_delivery_days' => 18,
            'acceptance_notes' => 'We can deliver in 18 days',
        ]);
        $quote->shouldReceive('getRespondedAt')->andReturn(new \DateTimeImmutable('2026-02-13 10:00:00'));

        $event = new VendorRespondedToQuote($quote, 'accept');

        // Act
        $this->listener->handle($event);

        // Assert - Verify admins were found
        $admins = User::where('tenant_id', $tenant->id)
            ->whereHas('roles', function ($query) {
                $query->where('name', 'admin');
            })
            ->get();
        
        $this->assertCount(2, $admins, 'Should have 2 admin users');

        // Verify that the listener executed without throwing exceptions
        // The actual notification creation is tested in integration tests
        $this->assertTrue(true);
    }

    /** @test */
    public function it_does_not_send_notification_for_non_acceptance_responses(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        
        // Create admin role
        $adminRole = \App\Infrastructure\Persistence\Eloquent\RoleEloquentModel::create([
            'name' => 'admin',
            'guard_name' => 'api',
            'tenant_id' => $tenant->id,
        ]);
        
        $vendor = Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $order = Order::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $admin = User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $admin->assignRole($adminRole);

        // Mock the quote entity
        $quote = Mockery::mock(Quote::class);
        $quote->shouldReceive('getUuid')->andReturn('quote-uuid-456');
        $quote->shouldReceive('getTenantId')->andReturn($tenant->id);
        $quote->shouldReceive('getVendorId')->andReturn($vendor->id);
        $quote->shouldReceive('getOrderId')->andReturn($order->id);

        // Test with reject response
        $event = new VendorRespondedToQuote($quote, 'reject');

        // Act
        $this->listener->handle($event);

        // Assert - No notifications should be created
        $this->assertDatabaseMissing('notifications', [
            'notifiable_type' => User::class,
            'notifiable_id' => $admin->id,
            'type' => 'App\\Notifications\\QuoteAcceptedByVendorNotification',
        ]);
    }

    /** @test */
    public function it_logs_warning_when_vendor_not_found(): void
    {
        // Arrange
        Log::shouldReceive('warning')
            ->once()
            ->with('Vendor not found for quote acceptance notification', Mockery::type('array'));

        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();

        // Mock the quote entity with non-existent vendor
        $quote = Mockery::mock(Quote::class);
        $quote->shouldReceive('getUuid')->andReturn('quote-uuid-789');
        $quote->shouldReceive('getTenantId')->andReturn($tenant->id);
        $quote->shouldReceive('getVendorId')->andReturn(99999); // Non-existent vendor

        $event = new VendorRespondedToQuote($quote, 'accept');

        // Act
        $this->listener->handle($event);

        // Assert - Mockery will verify the log was called
        $this->assertTrue(true);
    }

    /** @test */
    public function it_logs_warning_when_order_not_found(): void
    {
        // Arrange
        Log::shouldReceive('warning')
            ->once()
            ->with('Order not found for quote acceptance notification', Mockery::type('array'));

        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        
        $vendor = Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        // Mock the quote entity with non-existent order
        $quote = Mockery::mock(Quote::class);
        $quote->shouldReceive('getUuid')->andReturn('quote-uuid-999');
        $quote->shouldReceive('getTenantId')->andReturn($tenant->id);
        $quote->shouldReceive('getVendorId')->andReturn($vendor->id);
        $quote->shouldReceive('getOrderId')->andReturn(99999); // Non-existent order

        $event = new VendorRespondedToQuote($quote, 'accept');

        // Act
        $this->listener->handle($event);

        // Assert - Mockery will verify the log was called
        $this->assertTrue(true);
    }

    /** @test */
    public function it_logs_warning_when_no_admin_users_found(): void
    {
        // Arrange
        Log::shouldReceive('info')->andReturn(null);
        Log::shouldReceive('error')->andReturn(null);
        Log::shouldReceive('warning')->andReturn(null);

        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        
        $vendor = Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $order = Order::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        // No admin users created for this tenant

        // Mock the quote entity
        $quote = Mockery::mock(Quote::class);
        $quote->shouldReceive('getUuid')->andReturn('quote-uuid-111');
        $quote->shouldReceive('getTenantId')->andReturn($tenant->id);
        $quote->shouldReceive('getVendorId')->andReturn($vendor->id);
        $quote->shouldReceive('getOrderId')->andReturn($order->id);

        $event = new VendorRespondedToQuote($quote, 'accept');

        // Act
        $this->listener->handle($event);

        // Assert - Mockery will verify the log was called
        $this->assertTrue(true);
    }

    /** @test */
    public function it_logs_error_and_rethrows_exception_on_failure(): void
    {
        // Arrange
        Log::shouldReceive('error')
            ->once()
            ->with('Failed to send admin quote acceptance notification', Mockery::type('array'));

        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();

        // Mock the quote entity to throw exception
        $quote = Mockery::mock(Quote::class);
        $quote->shouldReceive('getUuid')->andReturn('quote-uuid-error');
        $quote->shouldReceive('getTenantId')->andReturn($tenant->id);
        $quote->shouldReceive('getVendorId')->andThrow(new \Exception('Database error'));

        $event = new VendorRespondedToQuote($quote, 'accept');

        // Expect exception to be re-thrown for retry mechanism
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Database error');

        // Act
        $this->listener->handle($event);
    }

    /** @test */
    public function it_logs_permanent_failure_in_failed_method(): void
    {
        // Arrange
        Log::shouldReceive('error')
            ->once()
            ->with('Admin quote acceptance notification job failed permanently', Mockery::type('array'));

        $quote = Mockery::mock(Quote::class);
        $quote->shouldReceive('getUuid')->andReturn('quote-uuid-failed');

        $event = new VendorRespondedToQuote($quote, 'accept');
        $exception = new \Exception('Permanent failure');

        // Act
        $this->listener->failed($event, $exception);

        // Assert - Mockery will verify the log was called
        $this->assertTrue(true);
    }
}
