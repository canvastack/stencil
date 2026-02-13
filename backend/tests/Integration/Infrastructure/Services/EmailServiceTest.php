<?php

declare(strict_types=1);

namespace Tests\Integration\Infrastructure\Services;

use App\Infrastructure\Services\Email\EmailServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Config;
use App\Mail\Vendor\WelcomeEmail;
use App\Mail\Vendor\NewQuoteNotification;
use App\Mail\Vendor\QuoteResponseNotification;
use App\Mail\Vendor\QuoteMessageNotification;
use App\Mail\Vendor\QuoteExpiredNotification;
use App\Mail\Vendor\QuoteReminderNotification;
use App\Mail\Vendor\PasswordResetEmail;
use Tests\TestCase;

/**
 * Email Service Integration Tests
 * 
 * Tests the LaravelEmailService implementation with Laravel Mail facade.
 * Requirements: 7.1-7.16, 10.3, 10.4, 13.4, 13.5, 18.9
 * 
 * Target: 9 tests
 * - Test sendVendorWelcomeEmail() sends correctly
 * - Test sendNewQuoteNotification() sends correctly
 * - Test sendQuoteResponseNotification() sends correctly
 * - Test sendQuoteMessageNotification() sends correctly
 * - Test sendQuoteExpiredNotification() sends correctly
 * - Test sendQuoteReminderNotification() sends correctly
 * - Test email queueing works
 * - Test retry logic on failure
 * - Test SMTP configuration loading
 */
class EmailServiceTest extends TestCase
{
    use RefreshDatabase;

    private EmailServiceInterface $emailService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->emailService = app(EmailServiceInterface::class);

        // Fake Mail to prevent actual email sending
        Mail::fake();
        
        // Fake Queue to test queueing behavior
        Queue::fake();
    }

    /** @test */
    public function it_sends_vendor_welcome_email_correctly(): void
    {
        // Arrange
        $vendorEmail = 'vendor@example.com';
        $vendorName = 'Test Vendor';
        $temporaryPassword = 'TempPass123!';
        $portalUrl = 'https://portal.example.com/vendor/login';

        // Act
        $result = $this->emailService->sendVendorWelcomeEmail(
            $vendorEmail,
            $vendorName,
            $temporaryPassword,
            $portalUrl
        );

        // Assert
        $this->assertTrue($result);
        
        Mail::assertQueued(WelcomeEmail::class, function ($mail) use ($vendorEmail) {
            return $mail->hasTo($vendorEmail);
        });
    }

    /** @test */
    public function it_sends_new_quote_notification_correctly(): void
    {
        // Arrange
        $vendorEmail = 'vendor@example.com';
        $vendorName = 'Test Vendor';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'John Doe',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => now()->addDays(7)->toDateTimeString(),
            'quote_url' => 'https://portal.example.com/vendor/quotes/uuid-123',
        ];

        // Act
        $result = $this->emailService->sendNewQuoteNotification(
            $vendorEmail,
            $vendorName,
            $quoteData
        );

        // Assert
        $this->assertTrue($result);
        
        Mail::assertQueued(NewQuoteNotification::class, function ($mail) use ($vendorEmail) {
            return $mail->hasTo($vendorEmail);
        });
    }

    /** @test */
    public function it_sends_quote_response_notification_correctly(): void
    {
        // Arrange
        $adminEmails = ['admin1@example.com', 'admin2@example.com'];
        $responseType = 'accepted';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'vendor_name' => 'Test Vendor',
            'order_number' => 'ORD-2026-001',
            'quote_url' => 'https://admin.example.com/quotes/uuid-123',
        ];

        // Act
        $result = $this->emailService->sendQuoteResponseNotification(
            $adminEmails,
            $responseType,
            $quoteData
        );

        // Assert
        $this->assertTrue($result);
        
        // Verify email queued for each admin
        Mail::assertQueued(QuoteResponseNotification::class, 2);
        
        foreach ($adminEmails as $adminEmail) {
            Mail::assertQueued(QuoteResponseNotification::class, function ($mail) use ($adminEmail) {
                return $mail->hasTo($adminEmail);
            });
        }
    }

    /** @test */
    public function it_sends_quote_message_notification_correctly(): void
    {
        // Arrange
        $recipientEmail = 'admin@example.com';
        $recipientName = 'Admin User';
        $senderName = 'Test Vendor';
        $messageData = [
            'quote_number' => 'Q-2026-001',
            'message_preview' => 'I have a question about the specifications...',
            'quote_url' => 'https://admin.example.com/quotes/uuid-123',
        ];

        // Act
        $result = $this->emailService->sendQuoteMessageNotification(
            $recipientEmail,
            $recipientName,
            $senderName,
            $messageData
        );

        // Assert
        $this->assertTrue($result);
        
        Mail::assertQueued(QuoteMessageNotification::class, function ($mail) use ($recipientEmail) {
            return $mail->hasTo($recipientEmail);
        });
    }

    /** @test */
    public function it_sends_quote_expired_notification_correctly(): void
    {
        // Arrange
        $vendorEmail = 'vendor@example.com';
        $vendorName = 'Test Vendor';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'expired_at' => now()->toDateTimeString(),
        ];

        // Act
        $result = $this->emailService->sendQuoteExpiredNotification(
            $vendorEmail,
            $vendorName,
            $quoteData
        );

        // Assert
        $this->assertTrue($result);
        
        Mail::assertQueued(QuoteExpiredNotification::class, function ($mail) use ($vendorEmail) {
            return $mail->hasTo($vendorEmail);
        });
    }

    /** @test */
    public function it_sends_quote_reminder_notification_correctly(): void
    {
        // Arrange
        $vendorEmail = 'vendor@example.com';
        $vendorName = 'Test Vendor';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'expires_at' => now()->addDays(3)->toDateTimeString(),
            'days_remaining' => 3,
            'quote_url' => 'https://portal.example.com/vendor/quotes/uuid-123',
        ];

        // Act
        $result = $this->emailService->sendQuoteReminderNotification(
            $vendorEmail,
            $vendorName,
            $quoteData
        );

        // Assert
        $this->assertTrue($result);
        
        Mail::assertQueued(QuoteReminderNotification::class, function ($mail) use ($vendorEmail) {
            return $mail->hasTo($vendorEmail);
        });
    }

    /** @test */
    public function it_sends_password_reset_email_correctly(): void
    {
        // Arrange
        $vendorEmail = 'vendor@example.com';
        $vendorName = 'Test Vendor';
        $resetToken = 'reset-token-123456';
        $resetUrl = 'https://portal.example.com/vendor/password/reset?token=reset-token-123456';

        // Act
        $result = $this->emailService->sendPasswordResetEmail(
            $vendorEmail,
            $vendorName,
            $resetToken,
            $resetUrl
        );

        // Assert
        $this->assertTrue($result);
        
        Mail::assertQueued(PasswordResetEmail::class, function ($mail) use ($vendorEmail) {
            return $mail->hasTo($vendorEmail);
        });
    }

    /** @test */
    public function it_queues_emails_for_asynchronous_processing(): void
    {
        // Arrange
        $vendorEmail = 'vendor@example.com';
        $vendorName = 'Test Vendor';
        $temporaryPassword = 'TempPass123!';
        $portalUrl = 'https://portal.example.com/vendor/login';

        // Act
        $result = $this->emailService->sendVendorWelcomeEmail(
            $vendorEmail,
            $vendorName,
            $temporaryPassword,
            $portalUrl
        );

        // Assert
        $this->assertTrue($result);
        
        // Verify email is queued, not sent immediately
        Mail::assertQueued(WelcomeEmail::class);
        Mail::assertNotSent(WelcomeEmail::class);
    }

    /** @test */
    public function it_handles_email_sending_failure_gracefully(): void
    {
        // Arrange
        // Force Mail facade to throw exception
        Mail::shouldReceive('to')
            ->andThrow(new \Exception('SMTP connection failed'));

        // Recreate service to use mocked Mail
        $emailService = new \App\Infrastructure\Services\Email\LaravelEmailService();

        $vendorEmail = 'vendor@example.com';
        $vendorName = 'Test Vendor';
        $temporaryPassword = 'TempPass123!';
        $portalUrl = 'https://portal.example.com/vendor/login';

        // Act
        $result = $emailService->sendVendorWelcomeEmail(
            $vendorEmail,
            $vendorName,
            $temporaryPassword,
            $portalUrl
        );

        // Assert
        $this->assertFalse($result);
    }
}

