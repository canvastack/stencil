<?php

namespace App\Infrastructure\Adapters;

use App\Domain\TenantConfiguration\Services\DNSProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CloudflareDNSAdapter implements DNSProviderInterface
{
    private string $apiUrl;
    private string $apiToken;
    private ?string $apiEmail;
    private ?string $apiKey;
    private int $defaultTtl;
    private bool $proxied;

    public function __construct()
    {
        $this->apiUrl = config('dns-providers.cloudflare.api_url');
        $this->apiToken = config('dns-providers.cloudflare.api_token');
        $this->apiEmail = config('dns-providers.cloudflare.api_email');
        $this->apiKey = config('dns-providers.cloudflare.api_key');
        $this->defaultTtl = config('dns-providers.cloudflare.default_ttl');
        $this->proxied = config('dns-providers.cloudflare.proxied');
    }

    public function createTxtRecord(
        string $zoneId,
        string $name,
        string $content,
        int $ttl = 300
    ): array {
        try {
            $response = $this->makeRequest('POST', "/zones/{$zoneId}/dns_records", [
                'type' => 'TXT',
                'name' => $name,
                'content' => $content,
                'ttl' => $ttl,
                'proxied' => false,
            ]);

            if ($response['success'] ?? false) {
                return [
                    'success' => true,
                    'record_id' => $response['result']['id'],
                    'record' => $response['result'],
                ];
            }

            throw new \Exception($response['errors'][0]['message'] ?? 'Failed to create TXT record');
        } catch (\Throwable $e) {
            Log::error('[CloudflareDNSAdapter] Failed to create TXT record', [
                'zone_id' => $zoneId,
                'name' => $name,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function createCnameRecord(
        string $zoneId,
        string $name,
        string $target,
        int $ttl = 300
    ): array {
        try {
            $response = $this->makeRequest('POST', "/zones/{$zoneId}/dns_records", [
                'type' => 'CNAME',
                'name' => $name,
                'content' => $target,
                'ttl' => $ttl,
                'proxied' => false,
            ]);

            if ($response['success'] ?? false) {
                return [
                    'success' => true,
                    'record_id' => $response['result']['id'],
                    'record' => $response['result'],
                ];
            }

            throw new \Exception($response['errors'][0]['message'] ?? 'Failed to create CNAME record');
        } catch (\Throwable $e) {
            Log::error('[CloudflareDNSAdapter] Failed to create CNAME record', [
                'zone_id' => $zoneId,
                'name' => $name,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function createARecord(
        string $zoneId,
        string $name,
        string $ipAddress,
        int $ttl = 300
    ): array {
        try {
            $response = $this->makeRequest('POST', "/zones/{$zoneId}/dns_records", [
                'type' => 'A',
                'name' => $name,
                'content' => $ipAddress,
                'ttl' => $ttl,
                'proxied' => $this->proxied,
            ]);

            if ($response['success'] ?? false) {
                return [
                    'success' => true,
                    'record_id' => $response['result']['id'],
                    'record' => $response['result'],
                ];
            }

            throw new \Exception($response['errors'][0]['message'] ?? 'Failed to create A record');
        } catch (\Throwable $e) {
            Log::error('[CloudflareDNSAdapter] Failed to create A record', [
                'zone_id' => $zoneId,
                'name' => $name,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function updateRecord(
        string $zoneId,
        string $recordId,
        array $data
    ): array {
        try {
            $response = $this->makeRequest('PATCH', "/zones/{$zoneId}/dns_records/{$recordId}", $data);

            if ($response['success'] ?? false) {
                return [
                    'success' => true,
                    'record' => $response['result'],
                ];
            }

            throw new \Exception($response['errors'][0]['message'] ?? 'Failed to update record');
        } catch (\Throwable $e) {
            Log::error('[CloudflareDNSAdapter] Failed to update record', [
                'zone_id' => $zoneId,
                'record_id' => $recordId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function deleteRecord(
        string $zoneId,
        string $recordId
    ): array {
        try {
            $response = $this->makeRequest('DELETE', "/zones/{$zoneId}/dns_records/{$recordId}");

            if ($response['success'] ?? false) {
                return [
                    'success' => true,
                    'record_id' => $recordId,
                ];
            }

            throw new \Exception($response['errors'][0]['message'] ?? 'Failed to delete record');
        } catch (\Throwable $e) {
            Log::error('[CloudflareDNSAdapter] Failed to delete record', [
                'zone_id' => $zoneId,
                'record_id' => $recordId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function getRecord(
        string $zoneId,
        string $recordId
    ): array {
        try {
            $response = $this->makeRequest('GET', "/zones/{$zoneId}/dns_records/{$recordId}");

            if ($response['success'] ?? false) {
                return [
                    'success' => true,
                    'record' => $response['result'],
                ];
            }

            throw new \Exception($response['errors'][0]['message'] ?? 'Failed to get record');
        } catch (\Throwable $e) {
            Log::error('[CloudflareDNSAdapter] Failed to get record', [
                'zone_id' => $zoneId,
                'record_id' => $recordId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function listRecords(
        string $zoneId,
        ?string $type = null,
        ?string $name = null
    ): array {
        try {
            $params = [];
            if ($type) {
                $params['type'] = $type;
            }
            if ($name) {
                $params['name'] = $name;
            }

            $response = $this->makeRequest('GET', "/zones/{$zoneId}/dns_records", $params);

            if ($response['success'] ?? false) {
                return [
                    'success' => true,
                    'records' => $response['result'] ?? [],
                    'pagination' => [
                        'total_count' => $response['result_info']['total_count'] ?? count($response['result'] ?? []),
                        'total_pages' => $response['result_info']['total_pages'] ?? 1,
                        'page' => $response['result_info']['page'] ?? 1,
                        'per_page' => $response['result_info']['per_page'] ?? count($response['result'] ?? []),
                    ],
                ];
            }

            throw new \Exception($response['errors'][0]['message'] ?? 'Failed to list records');
        } catch (\Throwable $e) {
            Log::error('[CloudflareDNSAdapter] Failed to list records', [
                'zone_id' => $zoneId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'records' => [],
            ];
        }
    }

    public function getZoneByDomain(string $domain): array
    {
        try {
            $response = $this->makeRequest('GET', '/zones', [
                'name' => $domain,
            ]);

            if (($response['success'] ?? false) && !empty($response['result'])) {
                return [
                    'success' => true,
                    'zone' => $response['result'][0],
                ];
            }

            return [
                'success' => false,
                'error' => 'Zone not found for domain: ' . $domain,
            ];
        } catch (\Throwable $e) {
            Log::error('[CloudflareDNSAdapter] Failed to get zone by domain', [
                'domain' => $domain,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function listZones(): array
    {
        try {
            $response = $this->makeRequest('GET', '/zones');

            if ($response['success'] ?? false) {
                return [
                    'success' => true,
                    'zones' => $response['result'] ?? [],
                ];
            }

            throw new \Exception($response['errors'][0]['message'] ?? 'Failed to list zones');
        } catch (\Throwable $e) {
            Log::error('[CloudflareDNSAdapter] Failed to list zones', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'zones' => [],
            ];
        }
    }

    public function verifyConnection(): bool
    {
        try {
            $response = $this->makeRequest('GET', '/user/tokens/verify');
            return $response['success'] ?? false;
        } catch (\Throwable $e) {
            Log::error('[CloudflareDNSAdapter] Connection verification failed', [
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    private function makeRequest(string $method, string $endpoint, array $data = []): array
    {
        $url = $this->apiUrl . $endpoint;

        $headers = [
            'Content-Type' => 'application/json',
        ];

        if ($this->apiToken) {
            $headers['Authorization'] = 'Bearer ' . $this->apiToken;
        } elseif ($this->apiEmail && $this->apiKey) {
            $headers['X-Auth-Email'] = $this->apiEmail;
            $headers['X-Auth-Key'] = $this->apiKey;
        }

        $request = Http::withHeaders($headers)->timeout(10);

        $response = match (strtoupper($method)) {
            'GET' => $request->get($url, $data),
            'POST' => $request->post($url, $data),
            'PATCH' => $request->patch($url, $data),
            'DELETE' => $request->delete($url),
            default => throw new \InvalidArgumentException("Unsupported HTTP method: {$method}"),
        };

        if (!$response->successful()) {
            Log::error('[CloudflareDNSAdapter] HTTP request failed', [
                'method' => $method,
                'endpoint' => $endpoint,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        }

        return $response->json() ?? [];
    }
}
