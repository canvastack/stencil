<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;
use Illuminate\Support\Str;
use Carbon\Carbon;

class CustomDomainSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = TenantEloquentModel::take(5)->get();

        if ($tenants->isEmpty()) {
            $this->command->warn('No tenants found. Skipping custom domain seeding.');
            return;
        }

        $this->command->info('Seeding custom domains for ' . $tenants->count() . ' tenants...');

        $domains = [];
        $domainExamples = [
            'shop.premiummetalworks.com',
            'store.crystalglass.co.id',
            'etching-warehouse.com',
            'custometch.id',
            'premium-plaques.com',
            'glassengraving.co.id',
            'metalcraft-online.com',
            'artisan-etching.id',
        ];

        $index = 0;
        foreach ($tenants as $tenant) {
            if ($index >= count($domainExamples)) break;

            $admin = UserEloquentModel::where('tenant_id', $tenant->id)
                ->whereHas('roles', function($q) {
                    $q->where('name', 'admin');
                })
                ->first();

            $isVerified = rand(0, 100) > 40;
            $status = $isVerified 
                ? (rand(0, 100) > 30 ? 'active' : 'verified')
                : (rand(0, 100) > 20 ? 'pending_verification' : 'failed');

            $sslEnabled = $isVerified && $status === 'active';

            $domains[] = [
                'uuid' => Uuid::uuid4()->toString(),
                'tenant_id' => $tenant->id,
                'domain_name' => $domainExamples[$index],
                'is_verified' => $isVerified,
                'verification_method' => ['dns_txt', 'dns_cname', 'file_upload'][rand(0, 2)],
                'verification_token' => Str::random(64),
                'verified_at' => $isVerified ? Carbon::now()->subDays(rand(10, 60)) : null,
                'ssl_enabled' => $sslEnabled,
                'ssl_certificate_path' => $sslEnabled ? '/etc/letsencrypt/live/' . $domainExamples[$index] . '/fullchain.pem' : null,
                'ssl_certificate_issued_at' => $sslEnabled ? Carbon::now()->subDays(rand(5, 50)) : null,
                'ssl_certificate_expires_at' => $sslEnabled ? Carbon::now()->addDays(rand(60, 80)) : null,
                'auto_renew_ssl' => true,
                'dns_provider' => $sslEnabled ? (['cloudflare', 'route53'][rand(0, 1)]) : null,
                'dns_record_id' => $sslEnabled ? 'rec_' . Str::random(16) : null,
                'dns_zone_id' => $sslEnabled ? 'zone_' . Str::random(16) : null,
                'status' => $status,
                'redirect_to_https' => true,
                'www_redirect' => ['add_www', 'remove_www', 'both'][rand(0, 2)],
                'metadata' => json_encode([
                    'cloudflare_proxy' => $sslEnabled,
                    'cdn_enabled' => $sslEnabled,
                    'dns_records' => [
                        ['type' => 'A', 'name' => '@', 'value' => '104.21.45.67'],
                        ['type' => 'CNAME', 'name' => 'www', 'value' => $domainExamples[$index]],
                    ]
                ]),
                'created_by' => $admin ? $admin->id : null,
                'created_at' => Carbon::now()->subDays(rand(30, 150)),
                'updated_at' => Carbon::now()->subDays(rand(1, 20)),
                'deleted_at' => null,
            ];

            $index++;
        }

        DB::table('custom_domains')->insert($domains);

        $this->command->info('Successfully seeded ' . count($domains) . ' custom domains.');
    }
}
