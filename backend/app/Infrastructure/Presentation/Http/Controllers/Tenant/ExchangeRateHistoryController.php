<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\ExchangeRateHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ExchangeRateHistoryController extends Controller
{
    /**
     * Get exchange rate history with filtering and pagination.
     *
     * Requirements: 8.4, 8.5, 8.6
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $tenantId = auth()->user()->tenant_id;

            // Validate query parameters
            $validator = Validator::make($request->all(), [
                'page' => 'sometimes|integer|min:1',
                'per_page' => 'sometimes|integer|min:1|max:100',
                'date_from' => 'sometimes|nullable|date',
                'start_date' => 'sometimes|nullable|date',
                'date_to' => 'sometimes|nullable|date|after_or_equal:date_from',
                'end_date' => 'sometimes|nullable|date',
                'provider_id' => 'sometimes|nullable|uuid|exists:exchange_rate_providers,uuid',
                'provider' => 'sometimes|nullable|uuid|exists:exchange_rate_providers,uuid',
                'event_type' => 'sometimes|nullable|string|in:rate_change,provider_switch,api_request,manual_update',
                'source' => 'sometimes|nullable|string|in:manual,api,cached',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Build query with tenant scoping
            $query = ExchangeRateHistory::with('provider')
                ->where('tenant_id', $tenantId);

            // Apply date range filter (support both parameter formats)
            $dateFrom = $request->input('date_from') ?? $request->input('start_date');
            $dateTo = $request->input('date_to') ?? $request->input('end_date');
            
            if ($dateFrom && $dateFrom !== '') {
                $query->where('created_at', '>=', $dateFrom);
            }

            if ($dateTo && $dateTo !== '') {
                $query->where('created_at', '<=', $dateTo . ' 23:59:59');
            }

            // Apply provider filter (support both parameter formats)
            $providerId = $request->input('provider_id') ?? $request->input('provider');
            if ($providerId && $providerId !== '') {
                // Convert UUID to internal ID
                $provider = \App\Models\ExchangeRateProvider::where('uuid', $providerId)
                    ->where('tenant_id', $tenantId)
                    ->first();

                if ($provider) {
                    $query->where('provider_id', $provider->id);
                }
            }

            // Apply event type filter
            if ($request->has('event_type') && $request->input('event_type') !== '') {
                $query->where('event_type', $request->input('event_type'));
            }

            // Apply source filter
            if ($request->has('source') && $request->input('source') !== '') {
                $query->where('source', $request->input('source'));
            }

            // Order by created_at DESC (newest first) - Requirement 8.5
            $query->orderBy('created_at', 'desc');

            // Paginate results
            $perPage = $request->input('per_page', 15);
            $history = $query->paginate($perPage);

            // Transform data for response
            $data = $history->map(function ($record) {
                return [
                    'uuid' => $record->uuid,
                    'rate' => $record->rate,
                    'provider' => $record->provider ? [
                        'uuid' => $record->provider->uuid,
                        'name' => $record->provider->name,
                    ] : null,
                    'source' => $record->source,
                    'event_type' => $record->event_type,
                    'metadata' => $record->metadata,
                    'created_at' => $record->created_at?->toIso8601String(),
                ];
            });

            return response()->json([
                'message' => 'Exchange rate history retrieved successfully',
                'data' => $data,
                'meta' => [
                    'current_page' => $history->currentPage(),
                    'from' => $history->firstItem(),
                    'last_page' => $history->lastPage(),
                    'per_page' => $history->perPage(),
                    'to' => $history->lastItem(),
                    'total' => $history->total(),
                ],
                'links' => [
                    'first' => $history->url(1),
                    'last' => $history->url($history->lastPage()),
                    'prev' => $history->previousPageUrl(),
                    'next' => $history->nextPageUrl(),
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve exchange rate history', [
                'tenant_id' => auth()->user()->tenant_id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to retrieve exchange rate history',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }
}
