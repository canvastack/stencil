<?php

namespace App\Console\Commands;

use App\Application\TenantConfiguration\Services\SSLCertificateService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class RenewSSLCertificatesCommand extends Command
{
    protected $signature = 'ssl:renew 
                            {--days=30 : Number of days before expiry to trigger renewal}
                            {--force : Force renewal regardless of expiry date}
                            {--domain= : Renew specific domain only}';

    protected $description = 'Renew SSL certificates expiring within specified threshold';

    public function __construct(
        private SSLCertificateService $sslService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $daysThreshold = (int) $this->option('days');
        $forceDomain = $this->option('domain');

        $this->info('🔒 SSL Certificate Renewal Process Started');
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->newLine();

        if ($forceDomain) {
            return $this->renewSpecificDomain($forceDomain);
        }

        $this->info("📋 Checking for certificates expiring within {$daysThreshold} days...");
        $this->newLine();

        $expiringDomains = $this->sslService->getExpiringCertificates($daysThreshold);

        if (empty($expiringDomains)) {
            $this->info('✅ No certificates need renewal at this time');
            $this->newLine();
            $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return Command::SUCCESS;
        }

        $this->warn("⚠️  Found " . count($expiringDomains) . " certificate(s) that need attention");
        $this->newLine();

        $this->table(
            ['Domain', 'Expires At', 'Days Left', 'Auto-Renew', 'Status'],
            array_map(function ($domain) {
                return [
                    $domain['domain_name'],
                    $domain['ssl_certificate_expires_at'] ? $domain['ssl_certificate_expires_at']->format('Y-m-d H:i:s') : 'N/A',
                    $domain['days_until_expiry'] ?? 'N/A',
                    $domain['auto_renew_ssl'] ? '✓' : '✗',
                    $domain['is_expired'] ? '🔴 Expired' : '🟡 Expiring Soon',
                ];
            }, $expiringDomains)
        );

        $this->newLine();
        $this->info('🔄 Starting renewal process...');
        $this->newLine();

        $results = $this->sslService->renewExpiringCertificates($daysThreshold);

        $this->displayResults($results);

        if ($results['failed'] > 0) {
            $this->sendFailureNotification($results);
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }

    private function renewSpecificDomain(string $domainUuid): int
    {
        $this->info("🔄 Renewing certificate for domain: {$domainUuid}");
        $this->newLine();

        try {
            $result = $this->sslService->renewCertificate($domainUuid);

            if ($result['success']) {
                $this->info("✅ Certificate renewed successfully");
                $this->info("   Domain: " . $result['domain']['domain_name']);
                $this->info("   New Expiry: " . $result['domain']['ssl_certificate_expires_at']->format('Y-m-d H:i:s'));
                $this->newLine();
                $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                return Command::SUCCESS;
            } else {
                $this->error("✗ Renewal failed: " . ($result['error'] ?? 'Unknown error'));
                $this->newLine();
                $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                return Command::FAILURE;
            }
        } catch (\Throwable $e) {
            $this->error("✗ Renewal failed: " . $e->getMessage());
            Log::error('[RenewSSLCertificatesCommand] Domain renewal failed', [
                'domain_uuid' => $domainUuid,
                'error' => $e->getMessage(),
            ]);
            $this->newLine();
            $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return Command::FAILURE;
        }
    }

    private function displayResults(array $results): void
    {
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->info('📊 Renewal Summary');
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->newLine();

        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Certificates', $results['total']],
                ['✅ Renewed Successfully', $results['renewed']],
                ['✗ Failed', $results['failed']],
                ['⊘ Skipped (Auto-Renew Disabled)', $results['skipped']],
            ]
        );

        $this->newLine();

        if (!empty($results['details'])) {
            $this->info('📋 Detailed Results:');
            $this->newLine();

            foreach ($results['details'] as $detail) {
                $icon = match($detail['status']) {
                    'renewed' => '✅',
                    'failed' => '✗',
                    'skipped' => '⊘',
                    default => '•',
                };

                $this->line("  {$icon} {$detail['domain']} - " . strtoupper($detail['status']));
                
                if (isset($detail['new_expiry'])) {
                    $this->line("     New Expiry: {$detail['new_expiry']}");
                }
                
                if (isset($detail['error'])) {
                    $this->error("     Error: {$detail['error']}");
                }
                
                if (isset($detail['reason'])) {
                    $this->line("     Reason: {$detail['reason']}");
                }

                $this->newLine();
            }
        }

        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if ($results['renewed'] > 0) {
            $this->info("✅ Successfully renewed {$results['renewed']} certificate(s)");
        }

        if ($results['failed'] > 0) {
            $this->error("✗ {$results['failed']} renewal(s) failed");
        }

        if ($results['skipped'] > 0) {
            $this->warn("⊘ Skipped {$results['skipped']} certificate(s) (auto-renewal disabled)");
        }

        $this->newLine();
    }

    private function sendFailureNotification(array $results): void
    {
        if (!config('ssl.renewal.failure_notification_enabled', true)) {
            return;
        }

        $notificationEmail = config('ssl.renewal.notification_email');

        if (!$notificationEmail) {
            $this->warn('⚠️  Failure notification email not configured');
            return;
        }

        try {
            Log::warning('[RenewSSLCertificatesCommand] Sending failure notification', [
                'failed_count' => $results['failed'],
                'to' => $notificationEmail,
            ]);

            $this->info("📧 Sending failure notification to: {$notificationEmail}");
        } catch (\Throwable $e) {
            Log::error('[RenewSSLCertificatesCommand] Failed to send notification email', [
                'error' => $e->getMessage(),
            ]);
            $this->error('✗ Failed to send notification email');
        }
    }
}
