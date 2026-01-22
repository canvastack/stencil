<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;
use Carbon\Carbon;

class UrlAccessAnalyticSeeder extends Seeder
{
    public function run(): void
    {
        $urlConfigs = DB::table('tenant_url_configurations')
            ->where('is_enabled', true)
            ->take(5)
            ->get();

        if ($urlConfigs->isEmpty()) {
            $this->command->warn('No URL configurations found. Skipping analytics seeding.');
            return;
        }

        $this->command->info('Seeding URL access analytics for ' . $urlConfigs->count() . ' configurations...');

        $analytics = [];
        $countryCodes = ['ID', 'SG', 'MY', 'TH', 'PH', 'VN', 'US', 'AU', 'JP', 'GB'];
        $cities = [
            'ID' => ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'],
            'SG' => ['Singapore'],
            'MY' => ['Kuala Lumpur', 'Penang', 'Johor Bahru'],
            'US' => ['New York', 'Los Angeles', 'Chicago', 'Houston'],
            'JP' => ['Tokyo', 'Osaka', 'Nagoya'],
        ];

        $userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
            'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
            'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
        ];

        $referrers = [
            'https://google.com/search',
            'https://facebook.com',
            'https://instagram.com',
            'https://twitter.com',
            'direct',
            null,
        ];

        foreach ($urlConfigs as $config) {
            $accessCount = rand(50, 200);

            for ($i = 0; $i < $accessCount; $i++) {
                $countryCode = $countryCodes[array_rand($countryCodes)];
                $city = $cities[$countryCode][array_rand($cities[$countryCode] ?? ['Unknown'])] ?? 'Unknown';
                $isSuccess = rand(0, 100) > 10;
                $httpStatusCode = $isSuccess 
                    ? [200, 200, 200, 201, 301, 302][array_rand([200, 200, 200, 201, 301, 302])]
                    : [400, 404, 500, 503][array_rand([400, 404, 500, 503])];

                $urlPattern = DB::table('tenant_url_configurations')
                    ->where('id', $config->id)
                    ->value('url_pattern');

                $accessedUrl = match($urlPattern) {
                    'subdomain' => 'https://' . $config->subdomain . '.stencil.canvastack.com',
                    'path' => 'https://stencil.canvastack.com/' . $config->url_path,
                    'custom_domain' => 'https://example.com',
                    default => 'https://stencil.canvastack.com',
                };

                $analytics[] = [
                    'uuid' => Uuid::uuid4()->toString(),
                    'tenant_id' => $config->tenant_id,
                    'url_config_id' => $config->id,
                    'accessed_url' => $accessedUrl . '/' . $this->generateRandomPath(),
                    'url_pattern_used' => $urlPattern,
                    'ip_address' => $this->generateRandomIp(),
                    'user_agent' => $userAgents[array_rand($userAgents)],
                    'referrer' => $referrers[array_rand($referrers)],
                    'country_code' => $countryCode,
                    'city' => $city,
                    'http_status_code' => $httpStatusCode,
                    'response_time_ms' => rand(50, 1500),
                    'accessed_at' => Carbon::now()->subDays(rand(0, 30))
                        ->subHours(rand(0, 23))
                        ->subMinutes(rand(0, 59)),
                ];
            }
        }

        foreach (array_chunk($analytics, 500) as $chunk) {
            DB::table('url_access_analytics')->insert($chunk);
        }

        $this->command->info('Successfully seeded ' . count($analytics) . ' analytics records.');
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

    private function generateRandomPath(): string
    {
        $paths = [
            'products',
            'products/category/electronics',
            'about',
            'contact',
            'cart',
            'checkout',
            'account',
            'orders',
            'products/search?q=laptop',
            'blog',
            'faq',
        ];

        return $paths[array_rand($paths)];
    }
}
