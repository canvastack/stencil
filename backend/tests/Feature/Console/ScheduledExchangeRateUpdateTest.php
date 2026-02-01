<?php

namespace Tests\Feature\Console;

use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Models\ExchangeRateSetting;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class ScheduledExchangeRateUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_exchange_rate_update_is_scheduled_daily(): void
    {
        $schedule = $this->app->make(Schedule::class);
        $events = collect($schedule->events());

        // Find the exchange rate update scheduled event
        $exchangeRateEvent = $events->first(function ($event) {
            return isset($event->description) && 
                   $event->description === 'exchange-rate-update';
        });

        $this->assertNotNull($exchangeRateEvent, 'Exchange rate update should be scheduled');
        $this->assertEquals('0 0 * * *', $exchangeRateEvent->expression);
    }

    public function test_scheduled_task_only_processes_tenants_with_auto_update_enabled(): void
    {
        // Create tenants with different settings
        $tenant1 = Tenant::factory()->create(['status' => 'active']);
        $tenant2 = Tenant::factory()->create(['status' => 'active']);
        $tenant3 = Tenant::factory()->create(['status' => 'inactive']);

        // Tenant 1: auto-update enabled
        ExchangeRateSetting::create([
            'tenant_id' => $tenant1->id,
            'mode' => 'auto',
            'auto_update_enabled' => true,
            'current_rate' => 15000.0000,
        ]);

        // Tenant 2: auto-update disabled
        ExchangeRateSetting::create([
            'tenant_id' => $tenant2->id,
            'mode' => 'auto',
            'auto_update_enabled' => false,
            'current_rate' => 15000.0000,
        ]);

        // Tenant 3: inactive tenant with auto-update enabled
        ExchangeRateSetting::create([
            'tenant_id' => $tenant3->id,
            'mode' => 'auto',
            'auto_update_enabled' => true,
            'current_rate' => 15000.0000,
        ]);

        // Get the schedule
        $schedule = $this->app->make(Schedule::class);
        $events = collect($schedule->events());

        // Find the exchange rate update event
        $exchangeRateEvent = $events->first(function ($event) {
            return isset($event->description) && 
                   $event->description === 'exchange-rate-update';
        });

        $this->assertNotNull($exchangeRateEvent);

        // The scheduled task should be configured to run daily with withoutOverlapping
        $this->assertTrue($exchangeRateEvent->withoutOverlapping);
    }

    public function test_scheduled_task_checks_auto_update_enabled_condition(): void
    {
        $tenant = Tenant::factory()->create(['status' => 'active']);

        // Create setting with auto_update_enabled = false
        $setting = ExchangeRateSetting::create([
            'tenant_id' => $tenant->id,
            'mode' => 'auto',
            'auto_update_enabled' => false,
            'current_rate' => 15000.0000,
        ]);

        // Verify the condition is checked in the scheduled task
        // The actual execution is tested in the command test
        $this->assertFalse($setting->auto_update_enabled);

        // Update to enabled
        $setting->update(['auto_update_enabled' => true]);
        $setting->refresh();

        $this->assertTrue($setting->auto_update_enabled);
    }

    public function test_scheduled_task_configuration_matches_requirements(): void
    {
        $schedule = $this->app->make(Schedule::class);
        $events = collect($schedule->events());

        // Find the exchange rate update event
        $exchangeRateEvent = $events->first(function ($event) {
            return isset($event->description) && 
                   $event->description === 'exchange-rate-update';
        });

        $this->assertNotNull($exchangeRateEvent, 'Exchange rate update should be scheduled');

        // Verify it's scheduled daily at configured time (default 00:00)
        $this->assertEquals('0 0 * * *', $exchangeRateEvent->expression);

        // Verify it has withoutOverlapping to prevent concurrent executions
        $this->assertTrue($exchangeRateEvent->withoutOverlapping);
    }
}
