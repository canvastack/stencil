<?php

namespace App\Console\Commands;

use App\Application\ExchangeRate\Services\ExchangeRateService;
use App\Models\ExchangeRateSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Exception;

class UpdateExchangeRateCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'exchange-rate:update {--tenant= : Specific tenant ID to update}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update exchange rates for tenants with auto-update enabled';

    /**
     * Execute the console command.
     */
    public function handle(ExchangeRateService $exchangeRateService): int
    {
        $this->info('Starting exchange rate update...');
        
        $tenantId = $this->option('tenant');
        
        try {
            // Build query for settings with auto-update enabled
            $query = ExchangeRateSetting::where('auto_update_enabled', true)
                ->where('mode', 'auto');
            
            if ($tenantId) {
                $query->where('tenant_id', $tenantId);
                $this->info("Updating exchange rate for tenant ID: {$tenantId}");
            } else {
                $this->info("Updating exchange rates for all tenants with auto-update enabled");
            }
            
            $settings = $query->get();
            
            if ($settings->isEmpty()) {
                $this->warn('No tenants found with auto-update enabled in auto mode');
                return Command::SUCCESS;
            }
            
            $updated = 0;
            $errors = 0;
            
            foreach ($settings as $setting) {
                try {
                    $this->line("Processing tenant ID: {$setting->tenant_id}");
                    
                    // Call the exchange rate service to update the rate
                    $exchangeRate = $exchangeRateService->updateRate($setting->tenant_id);
                    
                    // Update the current_rate and last_updated_at in settings
                    $setting->current_rate = $exchangeRate->getRate();
                    $setting->last_updated_at = $exchangeRate->getFetchedAt();
                    $setting->save();
                    
                    $provider = $exchangeRate->getProviderCode() ?? $exchangeRate->getSource();
                    $this->info("✓ Tenant {$setting->tenant_id}: Rate updated to {$exchangeRate->getRate()} from {$provider}");
                    $updated++;
                    
                } catch (Exception $e) {
                    $this->error("✗ Tenant {$setting->tenant_id}: {$e->getMessage()}");
                    
                    // Log the error for debugging
                    Log::error('Exchange rate update failed', [
                        'tenant_id' => $setting->tenant_id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    
                    $errors++;
                }
            }
            
            $this->newLine();
            $this->info('Exchange rate update completed!');
            $this->info("Total tenants processed: " . $settings->count());
            $this->info("Successfully updated: {$updated}");
            
            if ($errors > 0) {
                $this->warn("Errors encountered: {$errors}");
                return Command::FAILURE;
            }
            
            return Command::SUCCESS;
            
        } catch (Exception $e) {
            $this->error("Fatal error during exchange rate update: {$e->getMessage()}");
            
            Log::error('Exchange rate update command failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return Command::FAILURE;
        }
    }
}
