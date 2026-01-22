<?php

namespace App\Application\TenantConfiguration\Services;

use App\Infrastructure\Persistence\Eloquent\UrlAccessAnalyticEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantUrlConfigurationEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class UrlAccessAnalyticsService
{
    private const GEO_LOCATION_CACHE_TTL = 86400;
    private bool $geoLocationEnabled;
    private ?string $geoLocationApiKey;
    private string $geoLocationProvider;

    public function __construct()
    {
        $this->geoLocationEnabled = config('tenant-url.analytics.geo_location.enabled', false);
        $this->geoLocationApiKey = config('tenant-url.analytics.geo_location.api_key');
        $this->geoLocationProvider = config('tenant-url.analytics.geo_location.provider', 'ipapi');
    }

    public function trackAccess(array $data): void
    {
        try {
            $tenantId = $this->resolveTenantInternalId($data['tenant_uuid'] ?? null);
            
            if (!$tenantId) {
                Log::warning('[UrlAccessAnalyticsService] Cannot track access - tenant not found', [
                    'tenant_uuid' => $data['tenant_uuid'] ?? null,
                ]);
                return;
            }

            $urlConfigId = isset($data['url_config_uuid']) 
                ? $this->resolveUrlConfigInternalId($data['url_config_uuid'])
                : null;

            $geoData = $this->geoLocationEnabled && !empty($data['ip_address'])
                ? $this->getGeoLocation($data['ip_address'])
                : [];

            $analyticsData = [
                'tenant_id' => $tenantId,
                'url_config_id' => $urlConfigId,
                'accessed_url' => $data['accessed_url'] ?? '',
                'url_pattern_used' => $data['url_pattern_used'] ?? 'unknown',
                'ip_address' => $data['ip_address'] ?? null,
                'user_agent' => $data['user_agent'] ?? null,
                'referrer' => $data['referrer'] ?? null,
                'country_code' => $geoData['country_code'] ?? null,
                'city' => $geoData['city'] ?? null,
                'http_status_code' => $data['http_status_code'] ?? 200,
                'response_time_ms' => $data['response_time_ms'] ?? null,
                'accessed_at' => $data['accessed_at'] ?? now(),
            ];

            UrlAccessAnalyticEloquentModel::create($analyticsData);

            Log::debug('[UrlAccessAnalyticsService] Access tracked', [
                'tenant_id' => $tenantId,
                'url_pattern' => $data['url_pattern_used'] ?? 'unknown',
            ]);

        } catch (\Exception $e) {
            Log::error('[UrlAccessAnalyticsService] Failed to track access', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);
        }
    }

    public function getAccessOverview(string $tenantUuid, ?string $period = '30days'): array
    {
        $tenantId = $this->resolveTenantInternalId($tenantUuid);
        
        if (!$tenantId) {
            return $this->emptyOverviewResponse();
        }

        $startDate = $this->getStartDate($period);

        $cacheKey = "url_analytics:overview:{$tenantUuid}:{$period}";
        $cacheTtl = config('tenant-url.analytics.performance.aggregate_cache_ttl', 600);

        return cache()->remember($cacheKey, $cacheTtl, function () use ($tenantId, $startDate, $period) {
            $baseQuery = UrlAccessAnalyticEloquentModel::byTenant($tenantId)
                ->dateRange($startDate, now());

            $aggregates = $baseQuery->selectRaw('
                COUNT(*) as total_access,
                COUNT(DISTINCT ip_address) as unique_visitors,
                SUM(CASE WHEN http_status_code >= 200 AND http_status_code < 300 THEN 1 ELSE 0 END) as successful_access,
                SUM(CASE WHEN http_status_code >= 400 THEN 1 ELSE 0 END) as failed_access,
                AVG(CASE WHEN response_time_ms IS NOT NULL THEN response_time_ms END) as avg_response_time
            ')->first();

            $totalAccess = (int) $aggregates->total_access;
            $successRate = $totalAccess > 0 
                ? (($aggregates->successful_access / $totalAccess) * 100)
                : 0;

            $accessByPattern = UrlAccessAnalyticEloquentModel::byTenant($tenantId)
                ->dateRange($startDate, now())
                ->select('url_pattern_used', DB::raw('COUNT(*) as count'))
                ->groupBy('url_pattern_used')
                ->get()
                ->pluck('count', 'url_pattern_used')
                ->toArray();

            return [
                'period' => $period,
                'start_date' => $startDate->toIso8601String(),
                'end_date' => now()->toIso8601String(),
                'total_access' => $totalAccess,
                'unique_visitors' => (int) $aggregates->unique_visitors,
                'successful_access' => (int) $aggregates->successful_access,
                'failed_access' => (int) $aggregates->failed_access,
                'success_rate' => round($successRate, 2),
                'average_response_time_ms' => round($aggregates->avg_response_time ?? 0, 2),
                'access_by_pattern' => $accessByPattern,
            ];
        });
    }

    public function getAccessTrends(string $tenantUuid, ?string $period = '30days', ?string $groupBy = 'day'): array
    {
        $tenantId = $this->resolveTenantInternalId($tenantUuid);
        
        if (!$tenantId) {
            return [];
        }

        $startDate = $this->getStartDate($period);

        $driver = config('database.default');
        $isPgsql = $driver === 'pgsql';

        $dateFormat = match($groupBy) {
            'hour' => $isPgsql ? 'YYYY-MM-DD HH24:00:00' : 'Y-m-d H:00:00',
            'day' => $isPgsql ? 'YYYY-MM-DD' : 'Y-m-d',
            'week' => $isPgsql ? 'IYYY-IW' : 'Y-W',
            'month' => $isPgsql ? 'YYYY-MM' : 'Y-m',
            default => $isPgsql ? 'YYYY-MM-DD' : 'Y-m-d',
        };

        $dateFunc = $isPgsql ? "TO_CHAR(accessed_at, '{$dateFormat}')" : "DATE_FORMAT(accessed_at, '%{$dateFormat}')";

        $trends = UrlAccessAnalyticEloquentModel::byTenant($tenantId)
            ->dateRange($startDate, now())
            ->select(
                DB::raw("{$dateFunc} as period"),
                DB::raw('COUNT(*) as total_access'),
                DB::raw('COUNT(DISTINCT ip_address) as unique_visitors'),
                DB::raw('AVG(response_time_ms) as avg_response_time')
            )
            ->groupBy('period')
            ->orderBy('period', 'asc')
            ->get()
            ->map(function ($item) {
                return [
                    'period' => $item->period,
                    'total_access' => (int) $item->total_access,
                    'unique_visitors' => (int) $item->unique_visitors,
                    'avg_response_time' => round($item->avg_response_time ?? 0, 2),
                ];
            })
            ->toArray();

        return $trends;
    }

    public function getGeographicDistribution(string $tenantUuid, ?string $period = '30days'): array
    {
        $tenantId = $this->resolveTenantInternalId($tenantUuid);
        
        if (!$tenantId) {
            return [];
        }

        $startDate = $this->getStartDate($period);

        $byCountry = UrlAccessAnalyticEloquentModel::byTenant($tenantId)
            ->dateRange($startDate, now())
            ->whereNotNull('country_code')
            ->select(
                'country_code',
                DB::raw('COUNT(*) as access_count'),
                DB::raw('COUNT(DISTINCT ip_address) as unique_visitors')
            )
            ->groupBy('country_code')
            ->orderByDesc('access_count')
            ->limit(20)
            ->get()
            ->map(function ($item) {
                return [
                    'country_code' => $item->country_code,
                    'country_name' => $this->getCountryName($item->country_code),
                    'access_count' => (int) $item->access_count,
                    'unique_visitors' => (int) $item->unique_visitors,
                ];
            })
            ->toArray();

        $byCity = UrlAccessAnalyticEloquentModel::byTenant($tenantId)
            ->dateRange($startDate, now())
            ->whereNotNull('city')
            ->select(
                'city',
                'country_code',
                DB::raw('COUNT(*) as access_count')
            )
            ->groupBy('city', 'country_code')
            ->orderByDesc('access_count')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'city' => $item->city,
                    'country_code' => $item->country_code,
                    'access_count' => (int) $item->access_count,
                ];
            })
            ->toArray();

        return [
            'by_country' => $byCountry,
            'by_city' => $byCity,
        ];
    }

    public function getUrlConfigPerformance(string $tenantUuid, ?string $period = '30days'): array
    {
        $tenantId = $this->resolveTenantInternalId($tenantUuid);
        
        if (!$tenantId) {
            return [];
        }

        $startDate = $this->getStartDate($period);

        $cacheKey = "url_analytics:performance:{$tenantUuid}:{$period}";
        $cacheTtl = config('tenant-url.analytics.performance.aggregate_cache_ttl', 600);

        return cache()->remember($cacheKey, $cacheTtl, function () use ($tenantId, $startDate) {
            $performance = UrlAccessAnalyticEloquentModel::byTenant($tenantId)
                ->with(['urlConfiguration' => function ($query) {
                    $query->select('id', 'uuid', 'url_pattern', 'subdomain', 'url_path', 'is_primary');
                }])
                ->dateRange($startDate, now())
                ->whereNotNull('url_config_id')
                ->select(
                    'url_config_id',
                    DB::raw('COUNT(*) as access_count'),
                    DB::raw('AVG(response_time_ms) as avg_response_time'),
                    DB::raw('MIN(response_time_ms) as min_response_time'),
                    DB::raw('MAX(response_time_ms) as max_response_time'),
                    DB::raw('SUM(CASE WHEN http_status_code >= 200 AND http_status_code < 300 THEN 1 ELSE 0 END) as successful_requests'),
                    DB::raw('SUM(CASE WHEN http_status_code >= 400 THEN 1 ELSE 0 END) as failed_requests')
                )
                ->groupBy('url_config_id')
                ->orderByDesc('access_count')
                ->get()
                ->map(function ($item) {
                    $totalRequests = $item->access_count;
                    $successRate = $totalRequests > 0 
                        ? ($item->successful_requests / $totalRequests) * 100 
                        : 0;

                    return [
                        'url_config_uuid' => $item->urlConfiguration?->uuid,
                        'url_pattern' => $item->urlConfiguration?->url_pattern,
                        'subdomain' => $item->urlConfiguration?->subdomain,
                        'url_path' => $item->urlConfiguration?->url_path,
                        'is_primary' => $item->urlConfiguration?->is_primary,
                        'access_count' => (int) $item->access_count,
                        'avg_response_time' => round($item->avg_response_time ?? 0, 2),
                        'min_response_time' => round($item->min_response_time ?? 0, 2),
                        'max_response_time' => round($item->max_response_time ?? 0, 2),
                        'success_rate' => round($successRate, 2),
                        'successful_requests' => (int) $item->successful_requests,
                        'failed_requests' => (int) $item->failed_requests,
                    ];
                })
                ->toArray();

            return $performance;
        });
    }

    public function getTopReferrers(string $tenantUuid, ?string $period = '30days', int $limit = 20): array
    {
        $tenantId = $this->resolveTenantInternalId($tenantUuid);
        
        if (!$tenantId) {
            return [];
        }

        $startDate = $this->getStartDate($period);

        return UrlAccessAnalyticEloquentModel::byTenant($tenantId)
            ->dateRange($startDate, now())
            ->whereNotNull('referrer')
            ->where('referrer', '!=', '')
            ->select(
                'referrer',
                DB::raw('COUNT(*) as access_count'),
                DB::raw('COUNT(DISTINCT ip_address) as unique_visitors')
            )
            ->groupBy('referrer')
            ->orderByDesc('access_count')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'referrer' => $item->referrer,
                    'access_count' => (int) $item->access_count,
                    'unique_visitors' => (int) $item->unique_visitors,
                ];
            })
            ->toArray();
    }

    public function getDeviceStats(string $tenantUuid, ?string $period = '30days'): array
    {
        $tenantId = $this->resolveTenantInternalId($tenantUuid);
        
        if (!$tenantId) {
            return [];
        }

        $startDate = $this->getStartDate($period);

        $userAgents = UrlAccessAnalyticEloquentModel::byTenant($tenantId)
            ->dateRange($startDate, now())
            ->whereNotNull('user_agent')
            ->pluck('user_agent');

        $deviceTypes = [
            'mobile' => 0,
            'desktop' => 0,
            'tablet' => 0,
            'bot' => 0,
            'unknown' => 0,
        ];

        foreach ($userAgents as $userAgent) {
            $deviceType = $this->detectDeviceType($userAgent);
            $deviceTypes[$deviceType]++;
        }

        return [
            'total_analyzed' => $userAgents->count(),
            'device_distribution' => $deviceTypes,
            'device_percentages' => $this->calculatePercentages($deviceTypes),
        ];
    }

    private function resolveTenantInternalId(?string $tenantUuid): ?int
    {
        if (!$tenantUuid) {
            return null;
        }

        return TenantEloquentModel::where('uuid', $tenantUuid)->value('id');
    }

    private function resolveUrlConfigInternalId(?string $urlConfigUuid): ?int
    {
        if (!$urlConfigUuid) {
            return null;
        }

        return TenantUrlConfigurationEloquentModel::where('uuid', $urlConfigUuid)->value('id');
    }

    private function getGeoLocation(string $ipAddress): array
    {
        if ($ipAddress === '127.0.0.1' || $ipAddress === '::1') {
            return [
                'country_code' => 'LOCAL',
                'city' => 'localhost',
            ];
        }

        try {
            $cacheKey = "geo_location:{$ipAddress}";
            
            return cache()->remember($cacheKey, self::GEO_LOCATION_CACHE_TTL, function () use ($ipAddress) {
                return $this->fetchGeoLocationFromProvider($ipAddress);
            });
        } catch (\Exception $e) {
            Log::warning('[UrlAccessAnalyticsService] Geo-location lookup failed', [
                'ip' => $ipAddress,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    private function fetchGeoLocationFromProvider(string $ipAddress): array
    {
        return match($this->geoLocationProvider) {
            'ipapi' => $this->fetchFromIpApi($ipAddress),
            'ipgeolocation' => $this->fetchFromIpGeolocation($ipAddress),
            default => [],
        };
    }

    private function fetchFromIpApi(string $ipAddress): array
    {
        try {
            $response = Http::timeout(3)->get("http://ip-api.com/json/{$ipAddress}");

            if ($response->successful() && $response->json('status') === 'success') {
                return [
                    'country_code' => $response->json('countryCode'),
                    'city' => $response->json('city'),
                ];
            }

            return [];
        } catch (\Exception $e) {
            Log::debug('[UrlAccessAnalyticsService] IP-API lookup failed', [
                'ip' => $ipAddress,
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    private function fetchFromIpGeolocation(string $ipAddress): array
    {
        if (!$this->geoLocationApiKey) {
            return [];
        }

        try {
            $response = Http::timeout(3)->get('https://api.ipgeolocation.io/ipgeo', [
                'apiKey' => $this->geoLocationApiKey,
                'ip' => $ipAddress,
            ]);

            if ($response->successful()) {
                return [
                    'country_code' => $response->json('country_code2'),
                    'city' => $response->json('city'),
                ];
            }

            return [];
        } catch (\Exception $e) {
            Log::debug('[UrlAccessAnalyticsService] IPGeolocation lookup failed', [
                'ip' => $ipAddress,
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    private function getStartDate(?string $period): Carbon
    {
        return match($period) {
            'today' => now()->startOfDay(),
            '7days' => now()->subDays(7),
            '30days' => now()->subDays(30),
            '90days' => now()->subDays(90),
            '1year' => now()->subYear(),
            default => now()->subDays(30),
        };
    }

    private function detectDeviceType(string $userAgent): string
    {
        $userAgent = strtolower($userAgent);

        if (str_contains($userAgent, 'bot') || 
            str_contains($userAgent, 'crawler') || 
            str_contains($userAgent, 'spider')) {
            return 'bot';
        }

        if (str_contains($userAgent, 'mobile') || 
            str_contains($userAgent, 'android') || 
            str_contains($userAgent, 'iphone')) {
            return 'mobile';
        }

        if (str_contains($userAgent, 'tablet') || 
            str_contains($userAgent, 'ipad')) {
            return 'tablet';
        }

        if (str_contains($userAgent, 'windows') || 
            str_contains($userAgent, 'macintosh') || 
            str_contains($userAgent, 'linux')) {
            return 'desktop';
        }

        return 'unknown';
    }

    private function calculatePercentages(array $distribution): array
    {
        $total = array_sum($distribution);
        
        if ($total === 0) {
            return array_map(fn() => 0.0, $distribution);
        }

        return array_map(
            fn($count) => round(($count / $total) * 100, 2),
            $distribution
        );
    }

    private function getCountryName(string $countryCode): string
    {
        $countries = [
            'ID' => 'Indonesia',
            'US' => 'United States',
            'SG' => 'Singapore',
            'MY' => 'Malaysia',
            'TH' => 'Thailand',
            'PH' => 'Philippines',
            'VN' => 'Vietnam',
            'JP' => 'Japan',
            'KR' => 'South Korea',
            'CN' => 'China',
            'IN' => 'India',
            'AU' => 'Australia',
            'GB' => 'United Kingdom',
            'DE' => 'Germany',
            'FR' => 'France',
            'LOCAL' => 'Local/Localhost',
        ];

        return $countries[$countryCode] ?? $countryCode;
    }

    private function emptyOverviewResponse(): array
    {
        return [
            'period' => '30days',
            'start_date' => now()->subDays(30)->toIso8601String(),
            'end_date' => now()->toIso8601String(),
            'total_access' => 0,
            'unique_visitors' => 0,
            'successful_access' => 0,
            'failed_access' => 0,
            'success_rate' => 0,
            'average_response_time_ms' => 0,
            'access_by_pattern' => [],
        ];
    }
}
