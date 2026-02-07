<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Domain\Inventory\Jobs\InventoryReconciliationJob;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Jobs\CheckPluginExpiry;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Models\ExchangeRateSetting;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        $schedule->call(function () {
            TenantEloquentModel::where('status', 'active')->chunk(50, function ($tenants) {
                foreach ($tenants as $tenant) {
                    $userId = User::where('tenant_id', $tenant->id)
                        ->where('status', 'active')
                        ->orderBy('id')
                        ->value('id');
                    if ($userId) {
                        InventoryReconciliationJob::dispatch($tenant->id, $userId, 'scheduled');
                    }
                }
            });
        })->hourly();

        $schedule->job(new CheckPluginExpiry)->daily();

        $schedule->command('ssl:renew')
            ->daily()
            ->at('02:00')
            ->withoutOverlapping()
            ->runInBackground()
            ->onFailure(function () {
                \Illuminate\Support\Facades\Log::error('[SSL Renewal] Scheduled renewal failed');
            })
            ->onSuccess(function () {
                \Illuminate\Support\Facades\Log::info('[SSL Renewal] Scheduled renewal completed successfully');
            });

        // Exchange Rate Update - Daily execution for each tenant with auto-update enabled
        // This runs daily and processes all tenants that have auto-update enabled
        $schedule->call(function () {
            Tenant::where('status', 'active')->chunk(50, function ($tenants) {
                foreach ($tenants as $tenant) {
                    $setting = ExchangeRateSetting::where('tenant_id', $tenant->id)->first();
                    
                    // Only run if auto_update_enabled is true
                    if ($setting && $setting->auto_update_enabled) {
                        try {
                            \Artisan::call('exchange-rate:update', [
                                '--tenant' => $tenant->id
                            ]);
                            \Illuminate\Support\Facades\Log::info(
                                "[Exchange Rate] Updated rate for tenant {$tenant->id}"
                            );
                        } catch (\Exception $e) {
                            \Illuminate\Support\Facades\Log::error(
                                "[Exchange Rate] Failed to update rate for tenant {$tenant->id}: {$e->getMessage()}"
                            );
                        }
                    }
                }
            });
        })
        ->daily()
        ->at('00:00') // Default time, can be customized per tenant in the command
        ->name('exchange-rate-update')
        ->withoutOverlapping();

        // Quote Expiration - Daily execution to automatically expire quotes
        // This runs daily at midnight and processes all quotes that have passed their expiration date
        $schedule->command('quotes:expire')
            ->daily()
            ->at('00:00')
            ->name('quotes-expire')
            ->withoutOverlapping()
            ->runInBackground()
            ->onFailure(function () {
                \Illuminate\Support\Facades\Log::error('[Quote Expiration] Scheduled expiration check failed');
            })
            ->onSuccess(function () {
                \Illuminate\Support\Facades\Log::info('[Quote Expiration] Scheduled expiration check completed successfully');
            });
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
