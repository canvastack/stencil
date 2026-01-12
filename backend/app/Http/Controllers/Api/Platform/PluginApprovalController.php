<?php

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Services\PluginApprovalService;
use App\Models\InstalledPlugin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PluginApprovalController extends Controller
{
    protected PluginApprovalService $approvalService;

    public function __construct(PluginApprovalService $approvalService)
    {
        $this->approvalService = $approvalService;
    }

    public function requests(Request $request): JsonResponse
    {
        try {
            $query = InstalledPlugin::with([
                'tenant:id,uuid,name,slug', 
                'requester' => function ($query) {
                    $query->withoutGlobalScope('tenant');
                }
            ]);

            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->has('plugin_name')) {
                $query->where('plugin_name', 'LIKE', '%' . $request->input('plugin_name') . '%');
            }

            if ($request->has('tenant_id')) {
                $query->where('tenant_id', $request->input('tenant_id'));
            }

            $perPage = $request->input('per_page', 15);
            $requests = $query->orderBy('requested_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $requests->map(function ($plugin) {
                    return [
                        'uuid' => $plugin->uuid,
                        'plugin_name' => $plugin->plugin_name,
                        'display_name' => $plugin->display_name,
                        'version' => $plugin->plugin_version,
                        'status' => $plugin->status,
                        'tenant' => $plugin->tenant,
                        'requested_by' => $plugin->requester,
                        'requested_at' => $plugin->requested_at,
                        'approved_at' => $plugin->approved_at,
                        'installed_at' => $plugin->installed_at,
                        'expires_at' => $plugin->expires_at,
                    ];
                }),
                'pagination' => [
                    'total' => $requests->total(),
                    'per_page' => $requests->perPage(),
                    'current_page' => $requests->currentPage(),
                    'last_page' => $requests->lastPage(),
                ],
                'message' => 'Plugin installation requests retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve plugin requests',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(Request $request, string $uuid): JsonResponse
    {
        try {
            $plugin = InstalledPlugin::where('uuid', $uuid)
                ->with([
                    'tenant:id,uuid,name,slug,domain,status',
                    'requester' => function ($query) {
                        $query->withoutGlobalScope('tenant');
                    },
                    'approver' => function ($query) {
                        $query->withoutGlobalScope('tenant');
                    },
                    'rejector' => function ($query) {
                        $query->withoutGlobalScope('tenant');
                    }
                ])
                ->firstOrFail();

            return response()->json([
                'success' => true,
                'data' => [
                    'uuid' => $plugin->uuid,
                    'plugin_name' => $plugin->plugin_name,
                    'display_name' => $plugin->display_name,
                    'version' => $plugin->plugin_version,
                    'status' => $plugin->status,
                    'manifest' => $plugin->manifest,
                    'settings' => $plugin->settings,
                    'tenant' => $plugin->tenant,
                    'requested_at' => $plugin->requested_at,
                    'requested_by' => $plugin->requester,
                    'approved_at' => $plugin->approved_at,
                    'approved_by' => $plugin->approver,
                    'approval_notes' => $plugin->approval_notes,
                    'installed_at' => $plugin->installed_at,
                    'expires_at' => $plugin->expires_at,
                    'expiry_notified_at' => $plugin->expiry_notified_at,
                    'rejected_at' => $plugin->rejected_at,
                    'rejected_by' => $plugin->rejector,
                    'rejection_reason' => $plugin->rejection_reason,
                ],
                'message' => 'Plugin request details retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve plugin request details',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    public function approve(Request $request, string $uuid): JsonResponse
    {
        $request->validate([
            'approval_notes' => 'nullable|string|max:1000',
            'expires_at' => 'nullable|date|after:now',
        ]);

        try {
            $adminId = $request->user()->uuid;
            $notes = $request->input('approval_notes');
            $expiresAt = $request->input('expires_at') ? Carbon::parse($request->input('expires_at')) : null;

            $this->approvalService->approve($uuid, $adminId, $notes, $expiresAt);

            return response()->json([
                'success' => true,
                'message' => 'Plugin installation request approved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve plugin installation request',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function reject(Request $request, string $uuid): JsonResponse
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        try {
            $adminId = $request->user()->uuid;
            $reason = $request->input('rejection_reason');

            $this->approvalService->reject($uuid, $adminId, $reason);

            return response()->json([
                'success' => true,
                'message' => 'Plugin installation request rejected successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject plugin installation request',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function suspend(Request $request, string $uuid): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        try {
            $adminId = $request->user()->uuid;
            $reason = $request->input('reason');

            $this->approvalService->suspend($uuid, $adminId, $reason);

            return response()->json([
                'success' => true,
                'message' => 'Plugin suspended successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to suspend plugin',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function extend(Request $request, string $uuid): JsonResponse
    {
        $request->validate([
            'expires_at' => 'required|date|after:now',
        ]);

        try {
            $expiresAt = Carbon::parse($request->input('expires_at'));

            $this->approvalService->extend($uuid, $expiresAt);

            return response()->json([
                'success' => true,
                'message' => 'Plugin expiry extended successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to extend plugin expiry',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function analytics(Request $request): JsonResponse
    {
        try {
            $totalPlugins = InstalledPlugin::count();
            $totalActive = InstalledPlugin::where('status', 'active')->count();
            $totalPending = InstalledPlugin::where('status', 'pending')->count();
            $totalRejected = InstalledPlugin::where('status', 'rejected')->count();
            $totalSuspended = InstalledPlugin::where('status', 'suspended')->count();
            $totalExpired = InstalledPlugin::where('status', 'expired')->count();

            $pluginsByName = InstalledPlugin::selectRaw('plugin_name, display_name, COUNT(*) as installations')
                ->groupBy('plugin_name', 'display_name')
                ->orderBy('installations', 'desc')
                ->get();

            $recentRequests = InstalledPlugin::where('status', 'pending')
                ->with([
                    'tenant:id,uuid,name,slug', 
                    'requester' => function ($query) {
                        $query->withoutGlobalScope('tenant');
                    }
                ])
                ->orderBy('requested_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($plugin) {
                    return [
                        'uuid' => $plugin->uuid,
                        'plugin_name' => $plugin->display_name,
                        'tenant' => $plugin->tenant ? $plugin->tenant->name : 'Unknown',
                        'requested_by' => $plugin->requester ? $plugin->requester->name : 'Unknown',
                        'requested_at' => $plugin->requested_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => [
                        'total' => $totalPlugins,
                        'active' => $totalActive,
                        'pending' => $totalPending,
                        'rejected' => $totalRejected,
                        'suspended' => $totalSuspended,
                        'expired' => $totalExpired,
                    ],
                    'by_plugin' => $pluginsByName,
                    'recent_requests' => $recentRequests,
                ],
                'message' => 'Plugin analytics retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve plugin analytics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
