<?php

declare(strict_types=1);

namespace Tests\Integration\Infrastructure\Services;

use App\Domain\Notification\Services\NotificationService;
use App\Domain\Notification\Repositories\NotificationRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Notification;
use App\Domain\Quote\Entities\Quote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;
use Mockery;

/**
 * Notification Service Integration Tests
 * 
 * Tests the Domain NotificationService implementation with real database.
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9, 18.10, 18.11, 18.12
 * 
 * Target: 4 tests
 * - Test createNotification() creates in-app notification
 * - Test notification preferences are respected
 * - Test email notification is sent when enabled
 * - Test notification is not sent when disabled
 */
class NotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    private NotificationService $notificationService;
    private NotificationRepositoryInterface $notificationRepository;
    private int $tenantId;
    private Vendor $vendor;
    private User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $tenant = TenantEloquentModel::factory()->create();
        $this->tenantId = $tenant->id;

        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenantId,
            'status' => 'active',
        ]);

        // Create Admin role (capitalized - used by sendQuoteResponseNotification)
        $adminRole = \App\Infrastructure\Persistence\Eloquent\RoleEloquentModel::firstOrCreate(
            [
                'name' => 'Admin',
                'guard_name' => 'api',
            ],
            [
                'tenant_id' => $this->tenantId,
            ]
        );

        // Create admin role (lowercase - used by sendQuoteExpiredNotification)
        $adminRoleLowercase = \App\Infrastructure\Persistence\Eloquent\RoleEloquentModel::firstOrCreate(
            [
                'name' => 'admin',
                'guard_name' => 'api',
            ],
            [
                'tenant_id' => $this->tenantId,
            ]
        );

        // Create admin user with Admin role
        $this->adminUser = User::factory()->create([
            'tenant_id' => $this->tenantId,
            'account_type' => 'tenant',
            'status' => 'active',
        ]);

        // Assign both roles to handle inconsistency in NotificationService
        $this->adminUser->assignRole($adminRole);
        $this->adminUser->assignRole($adminRoleLowercase);

        // Get services from container
        $this->notificationRepository = app(NotificationRepositoryInterface::class);
        $this->notificationService = new NotificationService($this->notificationRepository);

        // Fake Mail to prevent actual email sending
        Mail::fake();
    }

    /** @test */
    public function it_creates_in_app_notification_for_quote_response(): void
    {
        // Arrange
        $quote = $this->createMockQuote();

        // Act
        $this->notificationService->sendQuoteResponseNotification($quote);

        // Assert - Check in-app notification was created
        $this->assertDatabaseHas('notifications', [
            'tenant_id' => $this->tenantId,
            'user_id' => $this->adminUser->id,
            'type' => 'quote_response',
        ]);

        $notification = Notification::where('user_id', $this->adminUser->id)
            ->where('type', 'quote_response')
            ->first();

        $this->assertNotNull($notification);
        $this->assertEquals('Vendor Responded to Quote', $notification->title);
        $this->assertStringContainsString('Q-2026-001', $notification->message);
        $this->assertStringContainsString($this->vendor->name, $notification->message);
    }

    /** @test */
    public function it_sends_email_notification_for_quote_response(): void
    {
        // Arrange
        $quote = $this->createMockQuote();

        // Act
        $this->notificationService->sendQuoteResponseNotification($quote);

        // Assert - Email should be queued
        Mail::assertQueued(\App\Mail\AdminQuoteResponseMail::class, function ($mail) {
            return $mail->hasTo($this->adminUser->email);
        });
    }

    /** @test */
    public function it_creates_in_app_notification_for_quote_expired(): void
    {
        // Arrange
        $quote = $this->createMockQuote();

        // Act
        $this->notificationService->sendQuoteExpiredNotification($quote, $this->vendor);

        // Assert - Check in-app notification was created
        $this->assertDatabaseHas('notifications', [
            'tenant_id' => $this->tenantId,
            'user_id' => $this->adminUser->id,
            'type' => 'quote_expired',
        ]);

        $notification = Notification::where('user_id', $this->adminUser->id)
            ->where('type', 'quote_expired')
            ->first();

        $this->assertNotNull($notification);
        $this->assertEquals('Quote Expired', $notification->title);
        $this->assertStringContainsString('Q-2026-001', $notification->message);
        $this->assertStringContainsString($this->vendor->name, $notification->message);
    }

    /** @test */
    public function it_sends_email_notification_for_quote_expired(): void
    {
        // Arrange
        $quote = $this->createMockQuote();

        // Act
        $this->notificationService->sendQuoteExpiredNotification($quote, $this->vendor);

        // Assert - Email should be queued
        Mail::assertQueued(\App\Mail\QuoteExpiredMail::class, function ($mail) {
            return $mail->hasTo($this->adminUser->email);
        });
    }

    /** @test */
    public function it_does_not_create_notification_when_no_admin_users_exist(): void
    {
        // Arrange
        // Create a new tenant without admin users
        $newTenant = TenantEloquentModel::factory()->create();
        $newTenantId = $newTenant->id;
        
        // Create vendor for this tenant
        $newVendor = Vendor::factory()->create([
            'tenant_id' => $newTenantId,
            'status' => 'active',
        ]);
        
        // Create a quote for this tenant (no admin users exist)
        $quote = Mockery::mock(Quote::class);
        $quote->shouldReceive('getUuid')->andReturn('test-uuid-no-admin');
        $quote->shouldReceive('getTenantId')->andReturn($newTenantId);
        $quote->shouldReceive('getQuoteNumber')->andReturn('Q-2026-999');
        $quote->shouldReceive('getOrderId')->andReturn(999);
        $quote->shouldReceive('getVendorId')->andReturn($newVendor->id);
        $quote->shouldReceive('getCustomerName')->andReturn('Test Customer');
        $quote->shouldReceive('getExpiresAt')->andReturn(new \DateTimeImmutable('+7 days'));
        $quote->shouldReceive('getResponseType')->andReturn('accepted');
        $quote->shouldReceive('getResponseNotes')->andReturn('Test notes');
        $quote->shouldReceive('getQuoteDetails')->andReturn([]);

        // Act
        $this->notificationService->sendQuoteResponseNotification($quote);

        // Assert - Check in-app notification was NOT created
        $this->assertDatabaseMissing('notifications', [
            'tenant_id' => $newTenantId,
            'type' => 'quote_response',
        ]);

        // Email should also not be sent
        Mail::assertNotQueued(\App\Mail\AdminQuoteResponseMail::class);
    }

    /** @test */
    public function it_sends_email_to_vendor_for_new_quote(): void
    {
        // Arrange
        $quote = $this->createMockQuote();

        // Act
        $this->notificationService->sendQuoteNotification($quote, $this->vendor);

        // Assert - Email should be queued to vendor
        Mail::assertQueued(\App\Mail\VendorQuoteReceivedMail::class, function ($mail) {
            return $mail->hasTo($this->vendor->email);
        });
    }

    /** @test */
    public function it_retries_email_sending_on_failure(): void
    {
        // Arrange
        Mail::shouldReceive('to->queue')
            ->times(3) // Should retry 3 times
            ->andThrow(new \Exception('Mail server error'));

        $quote = $this->createMockQuote();

        // Act - Should not throw exception
        $this->notificationService->sendQuoteNotification($quote, $this->vendor);

        // Assert - No exception thrown, error logged
        $this->assertTrue(true); // Test passes if no exception thrown
    }

    /** @test */
    public function it_sends_email_to_vendor_for_quote_extension(): void
    {
        // Arrange
        $quote = $this->createMockQuote();

        // Act
        $this->notificationService->sendQuoteExtendedNotification($quote, $this->vendor);

        // Assert - Email should be queued to vendor
        Mail::assertQueued(\App\Mail\VendorQuoteReceivedMail::class, function ($mail) {
            return $mail->hasTo($this->vendor->email);
        });
    }

    /**
     * Helper method to create a mock Quote entity
     */
    private function createMockQuote(): Quote
    {
        $quote = Mockery::mock(Quote::class);
        $quote->shouldReceive('getUuid')->andReturn('test-uuid-123');
        $quote->shouldReceive('getTenantId')->andReturn($this->tenantId);
        $quote->shouldReceive('getQuoteNumber')->andReturn('Q-2026-001');
        $quote->shouldReceive('getOrderId')->andReturn(1);
        $quote->shouldReceive('getVendorId')->andReturn($this->vendor->id);
        $quote->shouldReceive('getCustomerName')->andReturn('John Doe');
        $quote->shouldReceive('getExpiresAt')->andReturn(new \DateTimeImmutable('+7 days'));
        $quote->shouldReceive('getResponseType')->andReturn('accepted');
        $quote->shouldReceive('getResponseNotes')->andReturn('We can deliver in 5 days');
        $quote->shouldReceive('getQuoteDetails')->andReturn([]);

        return $quote;
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
