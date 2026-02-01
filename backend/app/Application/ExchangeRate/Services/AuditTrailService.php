<?php

namespace App\Application\ExchangeRate\Services;

use App\Models\ExchangeRateHistory;
use App\Models\ProviderSwitchEvent;
use App\Models\ExchangeRateProvider;
use App\Domain\ExchangeRate\Entities\ExchangeRate;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AuditTrailService
{
    /**
     * Log a rate update event
     *
     * @param int $tenantId
     * @param float $rate
     * @param int|null $providerId
     * @param string $source 'manual' or 'api'
     * @param array $metadata Additional metadata
     * @return ExchangeRateHistory
     */
    public function logRateUpdate(
        int $tenantId,
        float $rate,
        ?int $providerId,
        string $source,
        array $metadata = []
    ): ExchangeRateHistory {
        return ExchangeRateHistory::create([
            'tenant_id' => $tenantId,
            'rate' => $rate,
            'provider_id' => $providerId,
            'source' => $source,
            'event_type' => $source === 'manual' ? 'manual_update' : 'rate_change',
            'metadata' => array_merge($metadata, [
                'timestamp' => now()->toIso8601String(),
            ]),
        ]);
    }

    /**
     * Log a provider switch event
     *
     * @param int $tenantId
     * @param int|null $oldProviderId
     * @param int $newProviderId
     * @param string $reason
     * @param array $metadata Additional metadata
     * @return ProviderSwitchEvent
     */
    public function logProviderSwitch(
        int $tenantId,
        ?int $oldProviderId,
        int $newProviderId,
        string $reason,
        array $metadata = []
    ): ProviderSwitchEvent {
        return ProviderSwitchEvent::create([
            'tenant_id' => $tenantId,
            'old_provider_id' => $oldProviderId,
            'new_provider_id' => $newProviderId,
            'reason' => $reason,
            'metadata' => array_merge($metadata, [
                'timestamp' => now()->toIso8601String(),
            ]),
        ]);
    }

    /**
     * Log an API request event
     *
     * @param int $tenantId
     * @param int $providerId
     * @param bool $success
     * @param array $metadata Additional metadata (error message, response time, etc.)
     * @return ExchangeRateHistory
     */
    public function logApiRequest(
        int $tenantId,
        int $providerId,
        bool $success,
        array $metadata = []
    ): ExchangeRateHistory {
        return ExchangeRateHistory::create([
            'tenant_id' => $tenantId,
            'rate' => $metadata['rate'] ?? null,
            'provider_id' => $providerId,
            'source' => 'api',
            'event_type' => 'api_request',
            'metadata' => array_merge($metadata, [
                'success' => $success,
                'timestamp' => now()->toIso8601String(),
            ]),
        ]);
    }

    /**
     * Get history with filtering options
     *
     * @param int $tenantId
     * @param array $filters Available filters:
     *   - date_from: Start date for filtering
     *   - date_to: End date for filtering
     *   - provider_id: Filter by provider ID
     *   - event_type: Filter by event type (rate_change, api_request, manual_update, provider_switch)
     *   - source: Filter by source (manual, api, cached)
     *   - limit: Number of records to return (default: 50)
     * @return Collection
     */
    public function getHistory(int $tenantId, array $filters = []): Collection
    {
        $query = ExchangeRateHistory::query()
            ->forTenant($tenantId)
            ->with(['provider'])
            ->orderBy('created_at', 'desc');

        // Apply date range filter
        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        // Apply provider filter
        if (isset($filters['provider_id'])) {
            $query->byProvider($filters['provider_id']);
        }

        // Apply event type filter
        if (isset($filters['event_type'])) {
            $query->byEventType($filters['event_type']);
        }

        // Apply source filter
        if (isset($filters['source'])) {
            $query->bySource($filters['source']);
        }

        // Apply limit
        $limit = $filters['limit'] ?? 50;
        $query->limit($limit);

        return $query->get();
    }

    /**
     * Get provider switch history with filtering
     *
     * @param int $tenantId
     * @param array $filters Available filters:
     *   - date_from: Start date for filtering
     *   - date_to: End date for filtering
     *   - reason: Filter by switch reason
     *   - limit: Number of records to return (default: 50)
     * @return Collection
     */
    public function getProviderSwitchHistory(int $tenantId, array $filters = []): Collection
    {
        $query = ProviderSwitchEvent::query()
            ->forTenant($tenantId)
            ->with(['oldProvider', 'newProvider'])
            ->orderBy('created_at', 'desc');

        // Apply date range filter
        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        // Apply reason filter
        if (isset($filters['reason'])) {
            $query->byReason($filters['reason']);
        }

        // Apply limit
        $limit = $filters['limit'] ?? 50;
        $query->limit($limit);

        return $query->get();
    }

    /**
     * Get combined audit trail (rate updates and provider switches)
     *
     * @param int $tenantId
     * @param array $filters
     * @return Collection
     */
    public function getCombinedHistory(int $tenantId, array $filters = []): Collection
    {
        $rateHistory = $this->getHistory($tenantId, $filters);
        $switchHistory = $this->getProviderSwitchHistory($tenantId, $filters);

        // Combine and sort by created_at
        $combined = $rateHistory->concat($switchHistory)
            ->sortByDesc('created_at')
            ->values();

        // Apply limit if specified
        if (isset($filters['limit'])) {
            $combined = $combined->take($filters['limit']);
        }

        return $combined;
    }

    /**
     * Get audit statistics for a tenant
     *
     * @param int $tenantId
     * @param int $days Number of days to look back (default: 30)
     * @return array
     */
    public function getAuditStatistics(int $tenantId, int $days = 30): array
    {
        $dateFrom = now()->subDays($days);

        $totalRateUpdates = ExchangeRateHistory::forTenant($tenantId)
            ->whereIn('event_type', ['rate_change', 'manual_update'])
            ->where('created_at', '>=', $dateFrom)
            ->count();

        $totalApiRequests = ExchangeRateHistory::forTenant($tenantId)
            ->byEventType('api_request')
            ->where('created_at', '>=', $dateFrom)
            ->count();

        $totalProviderSwitches = ProviderSwitchEvent::forTenant($tenantId)
            ->where('created_at', '>=', $dateFrom)
            ->count();

        $manualUpdates = ExchangeRateHistory::forTenant($tenantId)
            ->byEventType('manual_update')
            ->where('created_at', '>=', $dateFrom)
            ->count();

        $apiUpdates = ExchangeRateHistory::forTenant($tenantId)
            ->byEventType('rate_change')
            ->bySource('api')
            ->where('created_at', '>=', $dateFrom)
            ->count();

        return [
            'period_days' => $days,
            'total_rate_updates' => $totalRateUpdates,
            'total_api_requests' => $totalApiRequests,
            'total_provider_switches' => $totalProviderSwitches,
            'manual_updates' => $manualUpdates,
            'api_updates' => $apiUpdates,
            'date_from' => $dateFrom->toIso8601String(),
            'date_to' => now()->toIso8601String(),
        ];
    }

    /**
     * Clean up old audit records (older than retention period)
     *
     * @param int $tenantId
     * @param int $retentionMonths Number of months to retain (default: 12)
     * @return array Number of deleted records
     */
    public function cleanupOldRecords(int $tenantId, int $retentionMonths = 12): array
    {
        $cutoffDate = now()->subMonths($retentionMonths);

        $deletedHistory = ExchangeRateHistory::forTenant($tenantId)
            ->where('created_at', '<', $cutoffDate)
            ->delete();

        $deletedSwitches = ProviderSwitchEvent::forTenant($tenantId)
            ->where('created_at', '<', $cutoffDate)
            ->delete();

        return [
            'deleted_history_records' => $deletedHistory,
            'deleted_switch_events' => $deletedSwitches,
            'cutoff_date' => $cutoffDate->toIso8601String(),
        ];
    }
}
