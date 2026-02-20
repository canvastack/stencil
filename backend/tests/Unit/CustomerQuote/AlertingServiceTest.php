<?php

namespace Tests\Unit\CustomerQuote;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use App\Application\CustomerQuote\Services\CustomerQuoteAlertingService;
use App\Notifications\CustomerQuote\CriticalMetricAlert;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\User;

class AlertingServiceTest extends TestCase
{
    use RefreshDatabase;

    private CustomerQuoteAlertingService $alertingService;

    protected function setUp(): void
    {
        parent::setUp();

        // Initialize service
        $this->alertingService = app(CustomerQuoteAlertingService::class);

        // Clear cache
        Cache::flush();
    }

    /** @test */
    public function it_can_clear_alert_cooldown()
    {
        // Set a cooldown
        Cache::put('alert.last_sent.high_rejection_rate.1', true, 3600);

        // Verify cooldown exists
        $this->assertTrue(Cache::has('alert.last_sent.high_rejection_rate.1'));

        // Clear cooldown
        $this->alertingService->clearAlertCooldown('high_rejection_rate', 1);

        // Verify cooldown cleared
        $this->assertFalse(Cache::has('alert.last_sent.high_rejection_rate.1'));
    }

    /** @test */
    public function alert_notification_has_correct_channels()
    {
        $user = User::factory()->make();
        
        $notification = new CriticalMetricAlert(
            'Test Alert',
            'Test message',
            'warning',
            []
        );

        $channels = $notification->via($user);

        $this->assertContains('mail', $channels);
        $this->assertContains('database', $channels);
    }

    /** @test */
    public function alert_notification_mail_has_correct_content()
    {
        $user = User::factory()->make();
        
        $notification = new CriticalMetricAlert(
            'High Rejection Rate',
            'Quote rejection rate is 25% (threshold: 20%)',
            'critical',
            ['rejection_rate' => 25, 'threshold' => 20]
        );

        $mail = $notification->toMail($user);

        $this->assertStringContainsString('High Rejection Rate', $mail->subject);
        $this->assertStringContainsString('Quote rejection rate is 25%', $mail->introLines[0]);
    }

    /** @test */
    public function alert_notification_array_has_correct_structure()
    {
        $user = User::factory()->make();
        
        $notification = new CriticalMetricAlert(
            'Test Alert',
            'Test message',
            'warning',
            ['key' => 'value']
        );

        $array = $notification->toArray($user);

        $this->assertArrayHasKey('title', $array);
        $this->assertArrayHasKey('message', $array);
        $this->assertArrayHasKey('severity', $array);
        $this->assertArrayHasKey('data', $array);
        $this->assertArrayHasKey('timestamp', $array);
        $this->assertEquals('Test Alert', $array['title']);
        $this->assertEquals('warning', $array['severity']);
    }

    /** @test */
    public function critical_alert_has_correct_severity_label()
    {
        $user = User::factory()->make();
        
        $notification = new CriticalMetricAlert(
            'Critical Issue',
            'This is critical',
            'critical',
            []
        );

        $mail = $notification->toMail($user);

        $this->assertStringContainsString('[CRITICAL]', $mail->subject);
    }

    /** @test */
    public function warning_alert_has_correct_severity_label()
    {
        $user = User::factory()->make();
        
        $notification = new CriticalMetricAlert(
            'Warning Issue',
            'This is a warning',
            'warning',
            []
        );

        $mail = $notification->toMail($user);

        $this->assertStringContainsString('[WARNING]', $mail->subject);
    }
}
