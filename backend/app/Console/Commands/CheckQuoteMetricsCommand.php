<?php

namespace App\Console\Commands;

use App\Application\CustomerQuote\Services\CustomerQuoteAlertingService;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Check customer quote metrics and send alerts
 * 
 * This command runs periodically to:
 * - Check critical metrics for all tenants
 * - Send alerts when thresholds are exceeded
 * - Log monitoring activities
 */
class CheckQuoteMetricsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'quotes:check-metrics {--tenant= : Specific tenant ID to check}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check customer quote metrics and send alerts for critical thresholds';

    /**
     * Execute the console command.
     */
    public function handle(CustomerQuoteAlertingService $alertingService): int
    {
        $this->info('Checking customer quote metrics...');

        try {
            $tenantId = $this->option('tenant');

            if ($tenantId) {
                // Check specific tenant
                $this->checkTenant($tenantId, $alertingService);
            } else {
                // Check all tenants
                $tenants = Tenant::all();
                
                if ($tenants->isEmpty()) {
                    $this->warn('No tenants found.');
                    return Command::SUCCESS;
                }

                $this->info("Checking metrics for {$tenants->count()} tenants...");

                foreach ($tenants as $tenant) {
                    $this->checkTenant($tenant->id, $alertingService);
                }
            }

            $this->info('Metrics check completed successfully.');
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("Failed to check metrics: {$e->getMessage()}");
            Log::error('Quote metrics check failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return Command::FAILURE;
        }
    }

    /**
     * Check metrics for a specific tenant
     */
    private function checkTenant(int $tenantId, CustomerQuoteAlertingService $alertingService): void
    {
        try {
            $this->line("Checking tenant {$tenantId}...");
            $alertingService->checkCriticalMetrics($tenantId);
        } catch (\Exception $e) {
            $this->error("Failed to check tenant {$tenantId}: {$e->getMessage()}");
            Log::error('Tenant metrics check failed', [
                'tenant_id' => $tenantId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
