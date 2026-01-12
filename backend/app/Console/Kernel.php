<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Domain\Inventory\Jobs\InventoryReconciliationJob;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Jobs\CheckPluginExpiry;

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
