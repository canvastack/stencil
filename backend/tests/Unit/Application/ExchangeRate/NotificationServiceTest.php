<?php

namespace Tests\Unit\Application\ExchangeRate;

use App\Application\ExchangeRate\Services\NotificationService;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class NotificationServiceTest extends TestCase
{
    private NotificationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new NotificationService();
    }

    /** @test */
    public function it_sends_quota_warning_notification(): void
    {
        Log::shouldReceive('warning')
            ->once()
            ->with('Exchange Rate Quota Warning', [
                'provider' => 'Test Provider',
                'remaining' => 45,
                'level' => 'warning',
                'color' => 'orange'
            ]);

        $this->service->sendQuotaWarning('Test Provider', 45);

        $this->assertTrue(true); // Assert log was called
    }

    /** @test */
    public function it_sends_critical_quota_warning_notification(): void
    {
        Log::shouldReceive('error')
            ->once()
            ->with('Exchange Rate Quota Critical', [
                'provider' => 'Provider 1',
                'remaining' => 15,
                'next_provider' => 'Provider 2',
                'next_remaining' => 100,
                'level' => 'critical',
                'color' => 'red'
            ]);

        $this->service->sendCriticalQuotaWarning('Provider 1', 15, 'Provider 2', 100);

        $this->assertTrue(true); // Assert log was called
    }

    /** @test */
    public function it_sends_provider_switched_notification(): void
    {
        Log::shouldReceive('info')
            ->once()
            ->with('Exchange Rate Provider Switched', [
                'new_provider' => 'New Provider',
                'available_quota' => 500,
                'level' => 'success',
                'color' => 'green'
            ]);

        $this->service->sendProviderSwitched('New Provider', 500);

        $this->assertTrue(true); // Assert log was called
    }

    /** @test */
    public function it_sends_provider_switched_notification_with_unlimited_quota(): void
    {
        Log::shouldReceive('info')
            ->once()
            ->with('Exchange Rate Provider Switched', [
                'new_provider' => 'Unlimited Provider',
                'available_quota' => PHP_INT_MAX,
                'level' => 'success',
                'color' => 'green'
            ]);

        $this->service->sendProviderSwitched('Unlimited Provider', PHP_INT_MAX);

        $this->assertTrue(true); // Assert log was called
    }

    /** @test */
    public function it_sends_fallback_notification(): void
    {
        $lastUpdated = now()->subDays(2);

        Log::shouldReceive('warning')
            ->once()
            ->with('Exchange Rate Fallback to Cache', [
                'rate' => 15250.50,
                'last_updated' => $lastUpdated->format('Y-m-d H:i:s'),
                'level' => 'warning',
                'color' => 'yellow'
            ]);

        $this->service->sendFallbackNotification(15250.50, $lastUpdated);

        $this->assertTrue(true); // Assert log was called
    }

    /** @test */
    public function it_formats_quota_warning_message_correctly(): void
    {
        Log::shouldReceive('warning')
            ->once()
            ->withArgs(function ($message, $context) {
                return $message === 'Exchange Rate Quota Warning'
                    && $context['provider'] === 'exchangerate-api.com'
                    && $context['remaining'] === 50
                    && $context['color'] === 'orange';
            });

        $this->service->sendQuotaWarning('exchangerate-api.com', 50);

        $this->assertTrue(true);
    }

    /** @test */
    public function it_formats_critical_warning_message_correctly(): void
    {
        Log::shouldReceive('error')
            ->once()
            ->withArgs(function ($message, $context) {
                return $message === 'Exchange Rate Quota Critical'
                    && $context['provider'] === 'currencyapi.com'
                    && $context['remaining'] === 20
                    && $context['next_provider'] === 'frankfurter.app'
                    && $context['color'] === 'red';
            });

        $this->service->sendCriticalQuotaWarning('currencyapi.com', 20, 'frankfurter.app', 999);

        $this->assertTrue(true);
    }

    /** @test */
    public function it_formats_provider_switched_message_correctly(): void
    {
        Log::shouldReceive('info')
            ->once()
            ->withArgs(function ($message, $context) {
                return $message === 'Exchange Rate Provider Switched'
                    && $context['new_provider'] === 'fawazahmed0'
                    && $context['available_quota'] === PHP_INT_MAX
                    && $context['color'] === 'green';
            });

        $this->service->sendProviderSwitched('fawazahmed0', PHP_INT_MAX);

        $this->assertTrue(true);
    }

    /** @test */
    public function it_formats_fallback_message_correctly(): void
    {
        $lastUpdated = now()->subHours(6);

        Log::shouldReceive('warning')
            ->once()
            ->withArgs(function ($message, $context) use ($lastUpdated) {
                return $message === 'Exchange Rate Fallback to Cache'
                    && $context['rate'] === 15000.00
                    && $context['last_updated'] === $lastUpdated->format('Y-m-d H:i:s')
                    && $context['color'] === 'yellow';
            });

        $this->service->sendFallbackNotification(15000.00, $lastUpdated);

        $this->assertTrue(true);
    }
}
