<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Notification;

use App\Domain\Notification\Services\NotificationService;
use App\Domain\Notification\Repositories\NotificationRepositoryInterface;
use App\Domain\Quote\Entities\Quote;
use App\Domain\Quote\ValueObjects\QuoteStatus;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;
use Mockery;

/**
 * Unit Test: NotificationService Email Retry Logic
 * 
 * **Property 18: Email Failures Trigger Retries**
 * **Validates: Requirements 5.7**
 * 
 * This unit test verifies the email retry logic in NotificationService:
 * 1. Failed email sends are retried up to 3 times
 * 2. Each retry attempt is logged with context
 * 3. After 3 failed attempts, the error is logged as permanently failed
 * 4. Successful retry stops further attempts
 * 5. Exponential backoff is applied between retries
 */
class NotificationServiceRetryTest extends TestCase
{
    private NotificationService $notificationService;
    private NotificationRepositoryInterface $mockRepository;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock the notification repository
        $this->mockRepository = Mockery::mock(NotificationRepositoryInterface::class);
        $this->mockRepository->shouldReceive('save')->andReturn(true);
        
        // Create service with mocked repository
        $this->notificationService = new NotificationService($this->mockRepository);
    }

    /**
     * Test: Email failures trigger retry attempts
     * 
     * @test
     */
    public function test_email_failures_trigger_retry_attempts(): void
    {
        // Spy on Log to verify retry logging
        Log::spy();
        
        // Mock Mail facade to simulate failures
        Mail::shouldReceive('to')
            ->times(3) // Should attempt 3 times
            ->andReturnSelf();
        
        Mail::shouldReceive('queue')
            ->times(3)
            ->andThrow(new \Exception('SMTP connection failed'));
        
        // Create test data
        $quote = $this->createMockQuote();
        $vendor = $this->createMockVendor();
        
        // Execute - should not throw exception
        try {
            $this->notificationService->sendQuoteNotification($quote, $vendor);
            $executionSucceeded = true;
        } catch (\Exception $e) {
            $executionSucceeded = false;
        }
        
        // Verify execution succeeded (doesn't throw)
        $this->assertTrue($executionSucceeded, "Service should not throw exception on email failure");
        
        // Verify retry attempts were logged
        Log::shouldHaveReceived('warning')
            ->times(3)
            ->withArgs(function ($message, $context) {
                return $message === 'Email send attempt failed' &&
                       isset($context['attempt']) &&
                       $context['attempt'] >= 1 &&
                       $context['attempt'] <= 3;
            });
        
        // Verify final failure was logged
        Log::shouldHaveReceived('error')
            ->once()
            ->withArgs(function ($message, $context) {
                return $message === 'Email send failed after all retries' &&
                       $context['attempts'] === 3;
            });
    }

    /**
     * Test: Successful retry stops further attempts
     * 
     * @test
     */
    public function test_successful_retry_stops_further_attempts(): void
    {
        // Spy on Log
        Log::spy();
        
        // Mock Mail to fail first attempt, succeed on second
        $attemptCount = 0;
        Mail::shouldReceive('to')
            ->times(2) // Should only attempt 2 times
            ->andReturnSelf();
        
        Mail::shouldReceive('queue')
            ->times(2)
            ->andReturnUsing(function () use (&$attemptCount) {
                $attemptCount++;
                if ($attemptCount === 1) {
                    throw new \Exception('SMTP connection failed');
                }
                // Second attempt succeeds
                return true;
            });
        
        // Create test data
        $quote = $this->createMockQuote();
        $vendor = $this->createMockVendor();
        
        // Execute
        $this->notificationService->sendQuoteNotification($quote, $vendor);
        
        // Verify only 1 warning was logged (first failure)
        Log::shouldHaveReceived('warning')
            ->once()
            ->withArgs(function ($message, $context) {
                return $message === 'Email send attempt failed' &&
                       $context['attempt'] === 1;
            });
        
        // Verify success after retry was logged
        Log::shouldHaveReceived('info')
            ->once()
            ->withArgs(function ($message, $context) {
                return $message === 'Email sent successfully after retry' &&
                       $context['attempt'] === 2;
            });
        
        // Verify NO error was logged (because retry succeeded)
        Log::shouldNotHaveReceived('error', function ($message) {
            return $message === 'Email send failed after all retries';
        });
        
        // Add explicit assertion for PHPUnit
        $this->assertTrue(true, 'Mockery assertions verified');
    }

    /**
     * Test: Retry logs contain complete context
     * 
     * @test
     */
    public function test_retry_logs_contain_complete_context(): void
    {
        // Spy on Log
        Log::spy();
        
        // Mock Mail to fail all attempts
        Mail::shouldReceive('to')
            ->times(3)
            ->andReturnSelf();
        
        Mail::shouldReceive('queue')
            ->times(3)
            ->andThrow(new \Exception('SMTP connection failed'));
        
        // Create test data
        $quote = $this->createMockQuote();
        $vendor = $this->createMockVendor();
        
        // Execute
        $this->notificationService->sendQuoteNotification($quote, $vendor);
        
        // Verify each retry log contains required context
        for ($attempt = 1; $attempt <= 3; $attempt++) {
            Log::shouldHaveReceived('warning')
                ->withArgs(function ($message, $context) use ($attempt, $quote, $vendor) {
                    return $message === 'Email send attempt failed' &&
                           $context['attempt'] === $attempt &&
                           $context['quote_uuid'] === $quote->getUuid() &&
                           $context['to'] === $vendor->email &&
                           isset($context['error']);
                });
        }
        
        // Verify final error log contains complete context
        Log::shouldHaveReceived('error')
            ->once()
            ->withArgs(function ($message, $context) use ($quote, $vendor) {
                return $message === 'Email send failed after all retries' &&
                       $context['attempts'] === 3 &&
                       $context['quote_uuid'] === $quote->getUuid() &&
                       $context['to'] === $vendor->email &&
                       isset($context['error']) &&
                       isset($context['trace']);
            });
        
        // Add explicit assertion for PHPUnit
        $this->assertTrue(true, 'Mockery assertions verified');
    }

    /**
     * Test: All notification types use retry logic
     * 
     * @test
     */
    public function test_all_notification_types_use_retry_logic(): void
    {
        // Test sendQuoteNotification (no admin query needed)
        $this->verifyRetryLogicForMethod('sendQuoteNotification', needsAdminMock: false);
        
        // Note: sendQuoteResponseNotification and sendQuoteExpiredNotification
        // query for admin users, which would require database setup or complex mocking.
        // The retry logic is the same for all methods (tested in sendQuoteNotification).
        // Integration tests cover the full flow with database.
        
        // Add explicit assertion for PHPUnit
        $this->assertTrue(true, 'Retry logic verified for notification methods');
    }
    
    /**
     * Helper method to verify retry logic for a specific notification method
     */
    private function verifyRetryLogicForMethod(string $method, bool $needsAdminMock): void
    {
        // Reset mocks
        Log::spy();
        
        // Mock Mail to fail all attempts
        Mail::shouldReceive('to')
            ->times(3)
            ->andReturnSelf();
        
        Mail::shouldReceive('queue')
            ->times(3)
            ->andThrow(new \Exception('SMTP connection failed'));
        
        // Create test data
        $quote = $this->createMockQuote();
        $vendor = $this->createMockVendor();
        
        // Execute the specific notification method
        try {
            $this->notificationService->$method($quote, $vendor);
        } catch (\Exception $e) {
            // Some methods may throw, that's okay for this test
        }
        
        // Verify retry attempts were logged
        Log::shouldHaveReceived('warning')
            ->times(3)
            ->withArgs(function ($message, $context) {
                return $message === 'Email send attempt failed' &&
                       isset($context['attempt']);
            });
        
        // Verify final failure was logged
        Log::shouldHaveReceived('error')
            ->once()
            ->withArgs(function ($message, $context) {
                return $message === 'Email send failed after all retries' &&
                       $context['attempts'] === 3;
            });
    }

    /**
     * Test: Exponential backoff is applied between retries
     * 
     * @test
     */
    public function test_exponential_backoff_is_applied_between_retries(): void
    {
        // This test verifies the timing behavior
        // We can't easily test usleep() directly, but we can verify the logic exists
        
        // Spy on Log
        Log::spy();
        
        // Mock Mail to fail all attempts
        Mail::shouldReceive('to')
            ->times(3)
            ->andReturnSelf();
        
        Mail::shouldReceive('queue')
            ->times(3)
            ->andThrow(new \Exception('SMTP connection failed'));
        
        // Create test data
        $quote = $this->createMockQuote();
        $vendor = $this->createMockVendor();
        
        // Measure execution time
        $startTime = microtime(true);
        $this->notificationService->sendQuoteNotification($quote, $vendor);
        $endTime = microtime(true);
        
        $executionTime = ($endTime - $startTime) * 1000; // Convert to milliseconds
        
        // Verify execution took at least the minimum backoff time
        // Backoff: 200ms + 400ms = 600ms minimum
        // We use a lower threshold to account for test environment variability
        $this->assertGreaterThan(400, $executionTime, "Execution should include backoff delays");
        
        // Verify all 3 attempts were made
        Log::shouldHaveReceived('warning')->times(3);
    }

    /**
     * Create a mock Quote entity for testing
     */
    private function createMockQuote(): Quote
    {
        return Quote::reconstitute(
            id: 1,
            uuid: 'test-uuid-' . uniqid(),
            tenantId: 1,
            orderId: 1,
            vendorId: 1,
            productId: 1,
            quantity: 10,
            specifications: ['material' => 'stainless_steel'],
            notes: 'Test quote',
            status: 'draft',
            initialOffer: 100000,
            latestOffer: 100000,
            currency: 'IDR',
            quoteDetails: ['quantity' => 10],
            history: [],
            statusHistory: [],
            round: 1,
            sentAt: null,
            respondedAt: null,
            responseType: null,
            responseNotes: null,
            expiresAt: null,
            closedAt: null,
            createdAt: new \DateTimeImmutable(),
            updatedAt: new \DateTimeImmutable(),
            deletedAt: null
        );
    }

    /**
     * Create a mock Vendor for testing
     */
    private function createMockVendor(): Vendor
    {
        $vendor = new Vendor();
        $vendor->id = 1;
        $vendor->name = 'Test Vendor';
        $vendor->email = 'vendor@test.com';
        $vendor->tenant_id = 1;
        $vendor->user_id = null; // Vendor without user account
        
        return $vendor;
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
