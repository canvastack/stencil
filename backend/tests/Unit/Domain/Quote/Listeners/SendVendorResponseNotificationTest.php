<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Quote\Listeners;

use Tests\TestCase;
use App\Domain\Quote\Listeners\SendVendorResponseNotification;
use App\Domain\Quote\Events\VendorRespondedToQuote;
use App\Domain\Quote\Entities\Quote;
use App\Infrastructure\Services\Notification\VendorNotificationService;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;

/**
 * SendVendorResponseNotification Listener Test
 * 
 * Tests the event listener that sends notifications when vendors respond to quotes.
 * 
 * Requirements: 18.3, 18.4, 18.5, 18.6, 18.7, 18.8
 */
class SendVendorResponseNotificationTest extends TestCase
{
    use RefreshDatabase;

    private VendorNotificationService $notificationService;
    private SendVendorResponseNotification $listener;

    protected function setUp(): void
    {
        parent::setUp();

        // Mock the notification service
        $this->notificationService = Mockery::mock(VendorNotificationService::class);
        $this->listener = new SendVendorResponseNotification($this->notificationService);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_sends_notification_when_vendor_accepts_quote(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        // Mock the quote entity
        $quote = Mockery::mock(Quote::class);
        $quote->shouldReceive('getUuid')->andReturn('quote-uuid-123');
        $quote->shouldReceive('getTenantId')->andReturn($tenant->id);
        $quote->shouldReceive('getVendorId')->andReturn($vendor->id); // Return integer ID

        $event = new VendorRespondedToQuote($quote, 'accept');

        // Assert
        $this->notificationService
            ->shouldReceive('notifyAdminsOfVendorResponse')
            ->once()
            ->with(
                Mockery::on(fn($q) => $q === $quote),
                Mockery::on(fn($v) => $v->uuid === $vendor->uuid),
                'accept',
                Mockery::type('string')
            );

        // Act
        $this->listener->handle($event);
        
        // Verify Mockery expectations
        $this->assertTrue(true); // Mockery will fail if expectations not met
    }

    /** @test */
    public function it_sends_notification_when_vendor_rejects_quote(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        // Mock the quote entity
        $quote = Mockery::mock(Quote::class);
        $quote->shouldReceive('getUuid')->andReturn('quote-uuid-456');
        $quote->shouldReceive('getTenantId')->andReturn($tenant->id);
        $quote->shouldReceive('getVendorId')->andReturn($vendor->id); // Return integer ID

        $event = new VendorRespondedToQuote($quote, 'reject');

        // Assert
        $this->notificationService
            ->shouldReceive('notifyAdminsOfVendorResponse')
            ->once()
            ->with(
                Mockery::on(fn($q) => $q === $quote),
                Mockery::on(fn($v) => $v->uuid === $vendor->uuid),
                'reject',
                Mockery::type('string')
            );

        // Act
        $this->listener->handle($event);
        
        // Verify Mockery expectations
        $this->assertTrue(true); // Mockery will fail if expectations not met
    }

    /** @test */
    public function it_sends_notification_when_vendor_submits_counter_offer(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        // Mock the quote entity
        $quote = Mockery::mock(Quote::class);
        $quote->shouldReceive('getUuid')->andReturn('quote-uuid-789');
        $quote->shouldReceive('getTenantId')->andReturn($tenant->id);
        $quote->shouldReceive('getVendorId')->andReturn($vendor->id); // Return integer ID

        $event = new VendorRespondedToQuote($quote, 'counter');

        // Assert
        $this->notificationService
            ->shouldReceive('notifyAdminsOfVendorResponse')
            ->once()
            ->with(
                Mockery::on(fn($q) => $q === $quote),
                Mockery::on(fn($v) => $v->uuid === $vendor->uuid),
                'counter',
                Mockery::type('string')
            );

        // Act
        $this->listener->handle($event);
        
        // Verify Mockery expectations
        $this->assertTrue(true); // Mockery will fail if expectations not met
    }

    /** @test */
    public function it_logs_error_when_notification_fails(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        // Mock the quote entity
        $quote = Mockery::mock(Quote::class);
        $quote->shouldReceive('getUuid')->andReturn('quote-uuid-error');
        $quote->shouldReceive('getTenantId')->andReturn($tenant->id);
        $quote->shouldReceive('getVendorId')->andReturn($vendor->id); // Return integer ID

        $event = new VendorRespondedToQuote($quote, 'accept');

        // Assert
        $this->notificationService
            ->shouldReceive('notifyAdminsOfVendorResponse')
            ->once()
            ->andThrow(new \Exception('Notification service error'));

        // Expect exception to be thrown for retry mechanism
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Notification service error');

        // Act
        $this->listener->handle($event);
    }
}
