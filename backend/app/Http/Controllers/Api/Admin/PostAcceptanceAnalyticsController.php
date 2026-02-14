<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\VendorProductionUpdate;
use App\Infrastructure\Persistence\Eloquent\Models\OrderQcInspection;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Post-Acceptance Analytics Controller
 * 
 * Provides metrics and analytics for the post-acceptance workflow including:
 * - Production progress tracking
 * - Vendor performance metrics
 * - Delivery status distribution
 * - Quote acceptance rates
 */
class PostAcceptanceAnalyticsController extends Controller
{
    /**
     * Get dashboard metrics overview
     * 
     * Returns key performance indicators:
     * - Active orders count
     * - On-time delivery rate
     * - Average production time
     * - Quote acceptance rate
     */
    public function getDashboardMetrics(Request $request): JsonResponse
    {
        try {
            $timeRange = $request->input('time_range', '30d');
            $startDate = $this->getStartDateFromRange($timeRange);
            $endDate = now();

            // Calculate active orders (orders with accepted vendor quotes in production)
            $activeOrders = Order::whereNotNull('vendor_quote_id')
                ->whereNotNull('vendor_quote_accepted_at')
                ->whereIn('status', ['customer_quote', 'production', 'quality_control', 'shipping'])
                ->count();

            // Calculate previous period for comparison
            $previousPeriodStart = $startDate->copy()->sub($this->getPeriodDuration($timeRange));
            $previousActiveOrders = Order::whereNotNull('vendor_quote_id')
                ->whereNotNull('vendor_quote_accepted_at')
                ->whereIn('status', ['customer_quote', 'production', 'quality_control', 'shipping'])
                ->whereBetween('vendor_quote_accepted_at', [$previousPeriodStart, $startDate])
                ->count();

            $activeOrdersChange = $previousActiveOrders > 0 
                ? (($activeOrders - $previousActiveOrders) / $previousActiveOrders) * 100 
                : 0;

            // Calculate on-time delivery rate
            $completedOrders = Order::whereNotNull('vendor_quote_accepted_at')
                ->whereNotNull('vendor_estimated_delivery_days')
                ->where('status', 'completed')
                ->whereBetween('vendor_quote_accepted_at', [$startDate, $endDate])
                ->get();

            $onTimeCount = 0;
            $totalCompleted = $completedOrders->count();

            foreach ($completedOrders as $order) {
                $expectedDate = Carbon::parse($order->vendor_quote_accepted_at)
                    ->addDays($order->vendor_estimated_delivery_days);
                $completedDate = $order->completed_at ?? $order->updated_at;
                
                if ($completedDate <= $expectedDate) {
                    $onTimeCount++;
                }
            }

            $onTimeDeliveryRate = $totalCompleted > 0 ? ($onTimeCount / $totalCompleted) * 100 : 0;

            // Previous period on-time rate
            $previousCompletedOrders = Order::whereNotNull('vendor_quote_accepted_at')
                ->whereNotNull('vendor_estimated_delivery_days')
                ->where('status', 'completed')
                ->whereBetween('vendor_quote_accepted_at', [$previousPeriodStart, $startDate])
                ->get();

            $previousOnTimeCount = 0;
            $previousTotalCompleted = $previousCompletedOrders->count();

            foreach ($previousCompletedOrders as $order) {
                $expectedDate = Carbon::parse($order->vendor_quote_accepted_at)
                    ->addDays($order->vendor_estimated_delivery_days);
                $completedDate = $order->completed_at ?? $order->updated_at;
                
                if ($completedDate <= $expectedDate) {
                    $previousOnTimeCount++;
                }
            }

            $previousOnTimeRate = $previousTotalCompleted > 0 
                ? ($previousOnTimeCount / $previousTotalCompleted) * 100 
                : 0;
            $onTimeDeliveryRateChange = $onTimeDeliveryRate - $previousOnTimeRate;

            // Calculate average production time
            $productionTimes = [];
            foreach ($completedOrders as $order) {
                if ($order->vendor_quote_accepted_at && $order->completed_at) {
                    $productionTimes[] = Carbon::parse($order->vendor_quote_accepted_at)
                        ->diffInDays($order->completed_at);
                }
            }

            $avgProductionTime = count($productionTimes) > 0 
                ? array_sum($productionTimes) / count($productionTimes) 
                : 0;

            // Previous period average
            $previousProductionTimes = [];
            foreach ($previousCompletedOrders as $order) {
                if ($order->vendor_quote_accepted_at && $order->completed_at) {
                    $previousProductionTimes[] = Carbon::parse($order->vendor_quote_accepted_at)
                        ->diffInDays($order->completed_at);
                }
            }

            $previousAvgProductionTime = count($previousProductionTimes) > 0 
                ? array_sum($previousProductionTimes) / count($previousProductionTimes) 
                : 0;
            $avgProductionTimeChange = $avgProductionTime - $previousAvgProductionTime;

            // Calculate quote acceptance rate
            $totalQuotes = OrderVendorNegotiation::whereBetween('created_at', [$startDate, $endDate])
                ->whereIn('status', ['pending', 'accepted', 'rejected', 'countered'])
                ->count();

            $acceptedQuotes = OrderVendorNegotiation::where('status', 'accepted')
                ->whereBetween('responded_at', [$startDate, $endDate])
                ->count();

            $quoteAcceptanceRate = $totalQuotes > 0 ? ($acceptedQuotes / $totalQuotes) * 100 : 0;

            // Previous period quote acceptance rate
            $previousTotalQuotes = OrderVendorNegotiation::whereBetween('created_at', [$previousPeriodStart, $startDate])
                ->whereIn('status', ['pending', 'accepted', 'rejected', 'countered'])
                ->count();

            $previousAcceptedQuotes = OrderVendorNegotiation::where('status', 'accepted')
                ->whereBetween('responded_at', [$previousPeriodStart, $startDate])
                ->count();

            $previousQuoteAcceptanceRate = $previousTotalQuotes > 0 
                ? ($previousAcceptedQuotes / $previousTotalQuotes) * 100 
                : 0;
            $quoteAcceptanceRateChange = $quoteAcceptanceRate - $previousQuoteAcceptanceRate;

            return response()->json([
                'metrics' => [
                    'active_orders' => $activeOrders,
                    'active_orders_change' => round($activeOrdersChange, 1),
                    'on_time_delivery_rate' => round($onTimeDeliveryRate, 1),
                    'on_time_delivery_rate_change' => round($onTimeDeliveryRateChange, 1),
                    'avg_production_time' => round($avgProductionTime, 1),
                    'avg_production_time_change' => round($avgProductionTimeChange, 1),
                    'quote_acceptance_rate' => round($quoteAcceptanceRate, 1),
                    'quote_acceptance_rate_change' => round($quoteAcceptanceRateChange, 1),
                ],
                'period' => [
                    'start' => $startDate->toIso8601String(),
                    'end' => $endDate->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch dashboard metrics',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get production timeline data
     * 
     * Returns time-series data for:
     * - Quotes accepted
     * - Orders completed
     * - Orders overdue
     */
    public function getProductionTimeline(Request $request): JsonResponse
    {
        try {
            $timeRange = $request->input('time_range', '30d');
            $groupBy = $request->input('group_by', $this->getDefaultGroupBy($timeRange));
            $startDate = $this->getStartDateFromRange($timeRange);
            $endDate = now();

            $dateFormat = $this->getDateFormat($groupBy);
            $dateGroupBy = $this->getDateGroupBy($groupBy);

            // Get accepted quotes timeline
            $acceptedQuotes = OrderVendorNegotiation::where('status', 'accepted')
                ->whereBetween('responded_at', [$startDate, $endDate])
                ->select(
                    DB::raw("{$dateGroupBy} as date"),
                    DB::raw('COUNT(*) as count')
                )
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->keyBy('date');

            // Get completed orders timeline
            $completedOrders = Order::where('status', 'completed')
                ->whereNotNull('vendor_quote_accepted_at')
                ->whereBetween('completed_at', [$startDate, $endDate])
                ->select(
                    DB::raw("{$dateGroupBy} as date"),
                    DB::raw('COUNT(*) as count')
                )
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->keyBy('date');

            // Get overdue orders timeline
            $overdueOrders = Order::whereNotNull('vendor_quote_accepted_at')
                ->whereNotNull('vendor_estimated_delivery_days')
                ->whereIn('status', ['production', 'quality_control', 'shipping'])
                ->get()
                ->filter(function ($order) {
                    $expectedDate = Carbon::parse($order->vendor_quote_accepted_at)
                        ->addDays($order->vendor_estimated_delivery_days);
                    return now()->gt($expectedDate);
                })
                ->groupBy(function ($order) use ($dateFormat) {
                    return Carbon::parse($order->vendor_quote_accepted_at)->format($dateFormat);
                })
                ->map(function ($group) {
                    return $group->count();
                });

            // Merge all timelines
            $timeline = [];
            $currentDate = $startDate->copy();

            while ($currentDate->lte($endDate)) {
                $dateKey = $currentDate->format($dateFormat);
                
                $timeline[] = [
                    'date' => $dateKey,
                    'accepted' => $acceptedQuotes->get($dateKey)->count ?? 0,
                    'completed' => $completedOrders->get($dateKey)->count ?? 0,
                    'overdue' => $overdueOrders->get($dateKey) ?? 0,
                ];

                $currentDate = $this->incrementDate($currentDate, $groupBy);
            }

            return response()->json([
                'timeline' => $timeline,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch production timeline',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get vendor performance metrics
     * 
     * Returns vendor rankings by:
     * - Total orders
     * - On-time delivery rate
     * - Average production time
     * - Quality score (if available)
     */
    public function getVendorPerformance(Request $request): JsonResponse
    {
        try {
            $page = max(1, (int) $request->input('page', 1));
            $perPage = max(1, min(50, (int) $request->input('per_page', 10)));
            $sortBy = $request->input('sort_by', 'on_time_rate');
            $sortOrder = $request->input('sort_order', 'desc');
            $search = $request->input('search');

            // Get all vendors with accepted quotes
            $vendorIds = OrderVendorNegotiation::where('status', 'accepted')
                ->distinct()
                ->pluck('vendor_id');

            $vendors = DB::table('vendors')
                ->whereIn('id', $vendorIds)
                ->when($search, function ($query, $search) {
                    return $query->where('name', 'LIKE', "%{$search}%");
                })
                ->get();

            $vendorPerformance = [];

            foreach ($vendors as $vendor) {
                // Get all orders for this vendor
                $orders = Order::where('vendor_id', $vendor->id)
                    ->whereNotNull('vendor_quote_accepted_at')
                    ->whereNotNull('vendor_estimated_delivery_days')
                    ->get();

                $totalOrders = $orders->count();
                
                if ($totalOrders === 0) {
                    continue;
                }

                // Calculate on-time delivery rate
                $onTimeCount = 0;
                $productionTimes = [];
                
                foreach ($orders as $order) {
                    if ($order->status === 'completed' && $order->completed_at) {
                        $expectedDate = Carbon::parse($order->vendor_quote_accepted_at)
                            ->addDays($order->vendor_estimated_delivery_days);
                        $completedDate = $order->completed_at;
                        
                        if ($completedDate <= $expectedDate) {
                            $onTimeCount++;
                        }

                        $productionTimes[] = Carbon::parse($order->vendor_quote_accepted_at)
                            ->diffInDays($completedDate);
                    }
                }

                $completedOrders = count($productionTimes);
                $onTimeDeliveryRate = $completedOrders > 0 ? ($onTimeCount / $completedOrders) * 100 : 0;
                $avgProductionTime = $completedOrders > 0 
                    ? array_sum($productionTimes) / $completedOrders 
                    : 0;

                // Calculate quality score from QC inspections
                $qcInspections = OrderQcInspection::whereIn('order_id', $orders->pluck('id'))
                    ->where('status', 'approved')
                    ->get();

                $qualityScore = 0;
                if ($qcInspections->count() > 0) {
                    // Calculate average quality score (assuming 5-point scale)
                    // This is a simplified calculation - adjust based on actual QC data structure
                    $qualityScore = 4.5; // Placeholder - implement actual calculation
                }

                $vendorPerformance[] = [
                    'id' => $vendor->uuid ?? $vendor->id,
                    'name' => $vendor->name,
                    'total_orders' => $totalOrders,
                    'on_time_delivery_rate' => round($onTimeDeliveryRate, 1),
                    'avg_production_time' => round($avgProductionTime, 1),
                    'quality_score' => $qualityScore,
                    'status' => $vendor->status ?? 'active',
                ];
            }

            // Sort vendors
            $sortColumn = match($sortBy) {
                'name' => 'name',
                'orders' => 'total_orders',
                'on_time_rate' => 'on_time_delivery_rate',
                'avg_time' => 'avg_production_time',
                'quality' => 'quality_score',
                default => 'on_time_delivery_rate',
            };

            usort($vendorPerformance, function ($a, $b) use ($sortColumn, $sortOrder) {
                $comparison = $a[$sortColumn] <=> $b[$sortColumn];
                return $sortOrder === 'desc' ? -$comparison : $comparison;
            });

            // Paginate results
            $total = count($vendorPerformance);
            $lastPage = ceil($total / $perPage);
            $offset = ($page - 1) * $perPage;
            $paginatedVendors = array_slice($vendorPerformance, $offset, $perPage);

            return response()->json([
                'vendors' => $paginatedVendors,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => $lastPage,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch vendor performance',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get delivery status distribution
     * 
     * Returns breakdown of orders by status:
     * - On track
     * - Approaching deadline
     * - Overdue
     * - Completed
     */
    public function getDeliveryStatus(Request $request): JsonResponse
    {
        try {
            $orders = Order::whereNotNull('vendor_quote_accepted_at')
                ->whereNotNull('vendor_estimated_delivery_days')
                ->whereIn('status', ['customer_quote', 'production', 'quality_control', 'shipping', 'completed'])
                ->get();

            $distribution = [
                'on_track' => 0,
                'approaching' => 0,
                'overdue' => 0,
                'completed' => 0,
            ];

            foreach ($orders as $order) {
                if ($order->status === 'completed') {
                    $distribution['completed']++;
                    continue;
                }

                $acceptedDate = Carbon::parse($order->vendor_quote_accepted_at);
                $expectedDate = $acceptedDate->copy()->addDays($order->vendor_estimated_delivery_days);
                $now = now();
                
                $daysRemaining = $now->diffInDays($expectedDate, false);

                if ($daysRemaining < 0) {
                    $distribution['overdue']++;
                } elseif ($daysRemaining <= 3) {
                    $distribution['approaching']++;
                } else {
                    $distribution['on_track']++;
                }
            }

            $total = array_sum($distribution);
            
            $result = [];
            foreach ($distribution as $status => $count) {
                $result[] = [
                    'status' => $status,
                    'count' => $count,
                    'percentage' => $total > 0 ? round(($count / $total) * 100, 1) : 0,
                ];
            }

            return response()->json([
                'distribution' => $result,
                'total' => $total,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch delivery status',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Get recent activity feed
     * 
     * Returns recent events:
     * - Quote accepted
     * - Production updates
     * - Delivery completions
     * - Overdue alerts
     * - QC inspections
     */
    public function getRecentActivity(Request $request): JsonResponse
    {
        try {
            $limit = max(1, min(100, (int) $request->input('limit', 20)));
            $type = $request->input('type');

            $activities = [];

            // Quote accepted events
            if (!$type || $type === 'quote_accepted') {
                $acceptedQuotes = OrderVendorNegotiation::with(['order', 'vendor'])
                    ->where('status', 'accepted')
                    ->orderBy('responded_at', 'desc')
                    ->limit($limit)
                    ->get();

                foreach ($acceptedQuotes as $quote) {
                    $activities[] = [
                        'id' => 'quote_' . $quote->id,
                        'type' => 'quote_accepted',
                        'title' => "Quote #{$quote->quote_number} accepted by {$quote->vendor->name}",
                        'description' => "Order #{$quote->order->order_number}",
                        'timestamp' => $quote->responded_at->toIso8601String(),
                        'order_id' => $quote->order->uuid ?? $quote->order->id,
                    ];
                }
            }

            // Production updates
            if (!$type || $type === 'production_update') {
                $productionUpdates = VendorProductionUpdate::with(['purchaseOrder.order'])
                    ->orderBy('created_at', 'desc')
                    ->limit($limit)
                    ->get();

                foreach ($productionUpdates as $update) {
                    if ($update->purchaseOrder && $update->purchaseOrder->order) {
                        $activities[] = [
                            'id' => 'production_' . $update->id,
                            'type' => 'production_update',
                            'title' => "Production update: {$update->status}",
                            'description' => "Order #{$update->purchaseOrder->order->order_number}",
                            'timestamp' => $update->created_at->toIso8601String(),
                            'order_id' => $update->purchaseOrder->order->uuid ?? $update->purchaseOrder->order->id,
                        ];
                    }
                }
            }

            // Delivery completions
            if (!$type || $type === 'delivery') {
                $completedOrders = Order::with('vendor')
                    ->where('status', 'completed')
                    ->whereNotNull('completed_at')
                    ->orderBy('completed_at', 'desc')
                    ->limit($limit)
                    ->get();

                foreach ($completedOrders as $order) {
                    $activities[] = [
                        'id' => 'delivery_' . $order->id,
                        'type' => 'delivery',
                        'title' => "Order #{$order->order_number} delivered",
                        'description' => "Vendor: {$order->vendor->name}",
                        'timestamp' => $order->completed_at->toIso8601String(),
                        'order_id' => $order->uuid ?? $order->id,
                    ];
                }
            }

            // Overdue alerts
            if (!$type || $type === 'overdue_alert') {
                $overdueOrders = Order::whereNotNull('vendor_quote_accepted_at')
                    ->whereNotNull('vendor_estimated_delivery_days')
                    ->whereIn('status', ['production', 'quality_control', 'shipping'])
                    ->get()
                    ->filter(function ($order) {
                        $expectedDate = Carbon::parse($order->vendor_quote_accepted_at)
                            ->addDays($order->vendor_estimated_delivery_days);
                        return now()->gt($expectedDate);
                    })
                    ->take($limit);

                foreach ($overdueOrders as $order) {
                    $expectedDate = Carbon::parse($order->vendor_quote_accepted_at)
                        ->addDays($order->vendor_estimated_delivery_days);
                    
                    $activities[] = [
                        'id' => 'overdue_' . $order->id,
                        'type' => 'overdue_alert',
                        'title' => "Order #{$order->order_number} is overdue",
                        'description' => "Expected: {$expectedDate->format('M d, Y')}",
                        'timestamp' => $expectedDate->toIso8601String(),
                        'order_id' => $order->uuid ?? $order->id,
                    ];
                }
            }

            // QC inspections
            if (!$type || $type === 'qc_inspection') {
                $qcInspections = OrderQcInspection::with('order')
                    ->whereIn('status', ['approved', 'rejected'])
                    ->orderBy('updated_at', 'desc')
                    ->limit($limit)
                    ->get();

                foreach ($qcInspections as $inspection) {
                    $activities[] = [
                        'id' => 'qc_' . $inspection->id,
                        'type' => 'qc_inspection',
                        'title' => "QC inspection {$inspection->status} for Order #{$inspection->order->order_number}",
                        'description' => "Inspector: {$inspection->inspector_name}",
                        'timestamp' => $inspection->updated_at->toIso8601String(),
                        'order_id' => $inspection->order->uuid ?? $inspection->order->id,
                    ];
                }
            }

            // Sort all activities by timestamp
            usort($activities, function ($a, $b) {
                return strtotime($b['timestamp']) - strtotime($a['timestamp']);
            });

            // Limit to requested number
            $activities = array_slice($activities, 0, $limit);

            return response()->json([
                'activities' => $activities,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch recent activity',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred'
            ], 500);
        }
    }

    /**
     * Helper: Get start date from time range
     */
    private function getStartDateFromRange(string $timeRange): Carbon
    {
        return match($timeRange) {
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            '90d' => now()->subDays(90),
            '1y' => now()->subYear(),
            default => now()->subDays(30),
        };
    }

    /**
     * Helper: Get period duration for comparison
     */
    private function getPeriodDuration(string $timeRange): \DateInterval
    {
        return match($timeRange) {
            '7d' => new \DateInterval('P7D'),
            '30d' => new \DateInterval('P30D'),
            '90d' => new \DateInterval('P90D'),
            '1y' => new \DateInterval('P1Y'),
            default => new \DateInterval('P30D'),
        };
    }

    /**
     * Helper: Get default group by for time range
     */
    private function getDefaultGroupBy(string $timeRange): string
    {
        return match($timeRange) {
            '7d' => 'day',
            '30d' => 'day',
            '90d' => 'week',
            '1y' => 'month',
            default => 'day',
        };
    }

    /**
     * Helper: Get date format for grouping
     */
    private function getDateFormat(string $groupBy): string
    {
        return match($groupBy) {
            'day' => 'Y-m-d',
            'week' => 'Y-W',
            'month' => 'Y-m',
            default => 'Y-m-d',
        };
    }

    /**
     * Helper: Get SQL date grouping expression
     */
    private function getDateGroupBy(string $groupBy): string
    {
        return match($groupBy) {
            'day' => "DATE(responded_at)",
            'week' => "DATE_FORMAT(responded_at, '%Y-%u')",
            'month' => "DATE_FORMAT(responded_at, '%Y-%m')",
            default => "DATE(responded_at)",
        };
    }

    /**
     * Helper: Increment date by group period
     */
    private function incrementDate(Carbon $date, string $groupBy): Carbon
    {
        return match($groupBy) {
            'day' => $date->addDay(),
            'week' => $date->addWeek(),
            'month' => $date->addMonth(),
            default => $date->addDay(),
        };
    }
}
