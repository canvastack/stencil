<?php

namespace App\Console\Commands;

use App\Application\CustomerQuote\Services\CustomerQuoteMonitoringService;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Check and mark expired customer quotes
 * 
 * This command runs hourly to:
 * - Identify quotes past their valid_until date
 * - Mark them as expired
 * - Log expiration events
 * - Track expiration metrics
 */
class CheckExpiredQuotesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'quotes:check-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and mark expired customer quotes';

    /**
     * Execute the console command.
     */
    public function handle(CustomerQuoteMonitoringService $monitoringService): int
    {
        $this->info('Checking for expired quotes...');

        // Find quotes that are expired but not marked as such
        $expiredQuotes = CustomerQuote::whereIn('status', ['sent', 'viewed', 'countered'])
            ->where('valid_until', '<', now())
            ->get();

        if ($expiredQuotes->isEmpty()) {
            $this->info('No expired quotes found.');
            return Command::SUCCESS;
        }

        $count = 0;
        foreach ($expiredQuotes as $quote) {
            try {
                // Mark as expired
                $quote->update([
                    'status' => 'expired',
                    'expired_at' => now(),
                ]);

                // Add history entry
                $quote->addHistoryEntry([
                    'action' => 'quote_expired',
                    'actor_type' => 'system',
                    'timestamp' => now()->toIso8601String(),
                    'details' => [
                        'valid_until' => $quote->valid_until->toIso8601String(),
                        'expired_at' => now()->toIso8601String(),
                    ],
                ]);

                // Log monitoring
                $monitoringService->logQuoteExpiration($quote->id, [
                    'quote_number' => $quote->quote_number,
                    'valid_until' => $quote->valid_until->toIso8601String(),
                    'tenant_id' => $quote->tenant_id,
                ]);

                $count++;
                $this->line("Marked quote {$quote->quote_number} as expired");

            } catch (\Exception $e) {
                $this->error("Failed to mark quote {$quote->quote_number} as expired: {$e->getMessage()}");
                Log::error('Failed to mark quote as expired', [
                    'quote_id' => $quote->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("Marked {$count} quotes as expired.");

        return Command::SUCCESS;
    }
}
