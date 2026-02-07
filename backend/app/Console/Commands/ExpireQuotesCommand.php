<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domain\Notification\Services\NotificationService;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Domain\Quote\ValueObjects\QuoteStatus;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use DateTimeImmutable;
use Exception;

/**
 * Expire Quotes Command
 * 
 * Scheduled command that runs daily to automatically expire quotes
 * that have passed their expiration date without vendor response.
 * 
 * Business Rules:
 * - Only quotes in 'sent' or 'pending_response' status can be expired
 * - Quotes with expires_at < now() are marked as expired
 * - Admin users are notified when quotes expire
 * - All actions are logged for audit trail
 * 
 * Schedule: Daily at midnight (configured in Kernel.php)
 */
class ExpireQuotesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'quotes:expire {--tenant= : Specific tenant ID to process} {--dry-run : Preview without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically expire quotes that have passed their expiration date';

    /**
     * Execute the console command.
     */
    public function handle(
        QuoteRepositoryInterface $quoteRepository,
        NotificationService $notificationService
    ): int {
        $this->info('Starting quote expiration check...');
        
        $tenantId = $this->option('tenant');
        $dryRun = $this->option('dry-run');
        
        if ($dryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        }
        
        try {
            $now = new DateTimeImmutable();
            
            // Find quotes that should be expired
            $expirableStatuses = [
                QuoteStatus::SENT->value,
                QuoteStatus::PENDING_RESPONSE->value
            ];
            
            if ($tenantId) {
                $this->info("Processing quotes for tenant ID: {$tenantId}");
                $quotes = $quoteRepository->findExpiredQuotes($tenantId, $expirableStatuses, $now);
            } else {
                $this->info("Processing quotes for all tenants");
                $quotes = $quoteRepository->findAllExpiredQuotes($expirableStatuses, $now);
            }
            
            if (empty($quotes)) {
                $this->info('No quotes found that need to be expired');
                return Command::SUCCESS;
            }
            
            $this->info("Found " . count($quotes) . " quote(s) to expire");
            $this->newLine();
            
            $expired = 0;
            $errors = 0;
            
            foreach ($quotes as $quote) {
                try {
                    $quoteNumber = $quote->getQuoteNumber();
                    $quoteUuid = $quote->getUuid();
                    $tenantId = $quote->getTenantId();
                    $vendorId = $quote->getVendorId();
                    
                    $this->line("Processing quote {$quoteNumber} (UUID: {$quoteUuid})");
                    $this->line("  Tenant: {$tenantId}");
                    $this->line("  Status: {$quote->getStatus()->value}");
                    $this->line("  Expires at: {$quote->getExpiresAt()->format('Y-m-d H:i:s')}");
                    
                    if ($dryRun) {
                        $this->info("  [DRY RUN] Would expire this quote");
                        $expired++;
                        continue;
                    }
                    
                    // Mark quote as expired
                    $quote->markAsExpired(null); // null = system action
                    $quoteRepository->save($quote);
                    
                    // Get vendor for notification
                    $vendor = Vendor::find($vendorId);
                    
                    if ($vendor) {
                        // Send notification to admins
                        $notificationService->sendQuoteExpiredNotification($quote, $vendor);
                        $this->info("  ✓ Quote expired and notifications sent");
                    } else {
                        $this->warn("  ✓ Quote expired but vendor not found (ID: {$vendorId})");
                    }
                    
                    // Log the expiration
                    Log::info('Quote expired automatically', [
                        'quote_uuid' => $quoteUuid,
                        'quote_number' => $quoteNumber,
                        'tenant_id' => $tenantId,
                        'vendor_id' => $vendorId,
                        'expired_at' => $now->format('c'),
                        'original_expires_at' => $quote->getExpiresAt()->format('c')
                    ]);
                    
                    $expired++;
                    
                } catch (Exception $e) {
                    $this->error("  ✗ Error: {$e->getMessage()}");
                    
                    // Log the error for debugging
                    Log::error('Quote expiration failed', [
                        'quote_uuid' => $quote->getUuid() ?? 'unknown',
                        'tenant_id' => $quote->getTenantId() ?? 'unknown',
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    
                    $errors++;
                }
                
                $this->newLine();
            }
            
            $this->info('Quote expiration check completed!');
            $this->info("Total quotes processed: " . count($quotes));
            
            if ($dryRun) {
                $this->info("Would expire: {$expired}");
            } else {
                $this->info("Successfully expired: {$expired}");
            }
            
            if ($errors > 0) {
                $this->warn("Errors encountered: {$errors}");
                return Command::FAILURE;
            }
            
            return Command::SUCCESS;
            
        } catch (Exception $e) {
            $this->error("Fatal error during quote expiration: {$e->getMessage()}");
            
            Log::error('Quote expiration command failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return Command::FAILURE;
        }
    }
}
