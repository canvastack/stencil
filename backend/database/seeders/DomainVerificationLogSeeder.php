<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;
use Carbon\Carbon;

class DomainVerificationLogSeeder extends Seeder
{
    public function run(): void
    {
        $customDomains = DB::table('custom_domains')->take(5)->get();

        if ($customDomains->isEmpty()) {
            $this->command->warn('No custom domains found. Skipping verification log seeding.');
            return;
        }

        $this->command->info('Seeding verification logs for ' . $customDomains->count() . ' domains...');

        $logs = [];

        foreach ($customDomains as $domain) {
            $attemptCount = rand(1, 5);

            for ($i = 0; $i < $attemptCount; $i++) {
                $isLastAttempt = ($i === $attemptCount - 1);
                $isSuccess = $domain->is_verified && $isLastAttempt;
                $verificationStatus = $isSuccess ? 'success' : ($isLastAttempt ? 'failed' : 'pending');

                $dnsRecords = $isSuccess || rand(0, 1) === 1 ? [
                    ['type' => 'TXT', 'name' => '_canvastencil-verify', 'value' => substr($domain->verification_token, 0, 32)],
                    ['type' => 'A', 'name' => '@', 'value' => '104.21.45.67'],
                ] : [];

                $errorMessage = !$isSuccess && $isLastAttempt ? 
                    $this->getRandomError() : null;

                $logs[] = [
                    'uuid' => Uuid::uuid4()->toString(),
                    'custom_domain_id' => $domain->id,
                    'verification_attempt_at' => Carbon::parse($domain->created_at)->addMinutes(30 + ($i * 120)),
                    'verification_method' => $domain->verification_method,
                    'verification_status' => $verificationStatus,
                    'verification_response' => json_encode([
                        'checked_at' => Carbon::now()->toIso8601String(),
                        'dns_propagated' => $isSuccess || rand(0, 1) === 1,
                        'token_match' => $isSuccess,
                        'response_time_ms' => rand(150, 2500),
                    ]),
                    'error_message' => $errorMessage,
                    'dns_records_found' => json_encode($dnsRecords),
                    'ip_address' => $this->generateRandomIp(),
                    'user_agent' => 'CanvaStencil-DomainVerifier/1.0 (Automated)',
                    'created_at' => Carbon::parse($domain->created_at)->addMinutes(30 + ($i * 120)),
                ];
            }
        }

        DB::table('domain_verification_logs')->insert($logs);

        $this->command->info('Successfully seeded ' . count($logs) . ' verification logs.');
    }

    private function getRandomError(): string
    {
        $errors = [
            'DNS TXT record not found for _canvastencil-verify',
            'Verification token mismatch',
            'DNS propagation timeout - records not yet propagated',
            'CNAME record pointing to incorrect target',
            'File not found at domain root: canvastencil-verify.txt',
            'File content does not match verification token',
            'Domain DNS servers not responding',
            'NXDOMAIN: Domain does not exist in DNS',
        ];

        return $errors[array_rand($errors)];
    }

    private function generateRandomIp(): string
    {
        return implode('.', [
            rand(1, 255),
            rand(0, 255),
            rand(0, 255),
            rand(1, 254)
        ]);
    }
}
