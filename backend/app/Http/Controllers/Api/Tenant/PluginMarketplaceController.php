<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Services\PluginManager;
use App\Services\PluginNotificationService;
use App\Models\InstalledPlugin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PluginMarketplaceController extends Controller
{
    protected PluginManager $pluginManager;
    protected PluginNotificationService $notificationService;

    public function __construct(
        PluginManager $pluginManager,
        PluginNotificationService $notificationService
    ) {
        $this->pluginManager = $pluginManager;
        $this->notificationService = $notificationService;
    }

    public function marketplace(Request $request): JsonResponse
    {
        try {
            $available = $this->pluginManager->getAvailablePlugins();

            return response()->json([
                'success' => true,
                'data' => $available,
                'message' => 'Available plugins retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve available plugins',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(Request $request, string $pluginName): JsonResponse
    {
        try {
            // Load full manifest for plugin details
            $manifestPath = dirname(base_path()) . "/plugins/{$pluginName}/plugin.json";
            
            if (!file_exists($manifestPath)) {
                return response()->json([
                    'success' => false,
                    'message' => "Plugin '{$pluginName}' not found",
                ], 404);
            }

            $manifest = json_decode(file_get_contents($manifestPath), true);
            
            if (!$manifest) {
                return response()->json([
                    'success' => false,
                    'message' => "Invalid plugin manifest for '{$pluginName}'",
                ], 500);
            }

            // Return full manifest data for frontend
            return response()->json([
                'success' => true,
                'data' => $manifest,
                'message' => 'Plugin details retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve plugin details',
                'error' => $e->getMessage(),
            ], 500);
            }
    }

    public function request(Request $request): JsonResponse
    {
        $request->validate([
            'plugin_name' => 'required|string',
        ]);

        try {
            // Get tenant UUID from middleware-set context (TenantContextMiddleware)
            $tenant = $request->get('current_tenant');
            $tenantId = $tenant ? $tenant->uuid : null;
            $pluginName = $request->input('plugin_name');
            $userId = $request->user()->uuid;

            $existing = InstalledPlugin::where('tenant_id', $tenantId)
                ->where('plugin_name', $pluginName)
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => "Plugin '{$pluginName}' has already been requested or installed",
                    'data' => [
                        'status' => $existing->status,
                        'uuid' => $existing->uuid,
                    ],
                ], 400);
            }

            $manifest = $this->pluginManager->getAvailablePlugins();
            $pluginData = collect($manifest)->firstWhere('name', $pluginName);

            if (!$pluginData) {
                return response()->json([
                    'success' => false,
                    'message' => "Plugin '{$pluginName}' not found in marketplace",
                ], 404);
            }

            // Plugins are in project root, not backend/plugins
            $manifestPath = dirname(base_path()) . "/plugins/{$pluginName}/plugin.json";
            $fullManifest = json_decode(file_get_contents($manifestPath), true);

            $installation = InstalledPlugin::create([
                'tenant_id' => $tenantId,
                'plugin_name' => $pluginName,
                'plugin_version' => $pluginData['version'],
                'display_name' => $pluginData['display_name'],
                'status' => 'pending',
                'manifest' => $fullManifest,
                'migrations_run' => [],
                'settings' => [],
                'requested_at' => now(),
                'requested_by' => $userId,
            ]);

            $this->notificationService->notifyPlatformAdminOfRequest($installation);

            return response()->json([
                'success' => true,
                'data' => [
                    'uuid' => $installation->uuid,
                    'status' => $installation->status,
                    'requested_at' => $installation->requested_at,
                ],
                'message' => "Plugin '{$pluginData['display_name']}' installation request submitted successfully. Waiting for platform admin approval.",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Plugin installation request failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function installed(Request $request): JsonResponse
    {
        try {
            // Get tenant UUID from middleware-set context (TenantContextMiddleware)
            $tenant = $request->get('current_tenant');
            $tenantId = $tenant ? $tenant->uuid : null;

            $plugins = InstalledPlugin::where('tenant_id', $tenantId)
                ->with(['requester:uuid,name,email', 'approver:uuid,name,email'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($plugin) {
                    return [
                        'uuid' => $plugin->uuid,
                        'plugin_name' => $plugin->plugin_name,
                        'display_name' => $plugin->display_name,
                        'version' => $plugin->plugin_version,
                        'status' => $plugin->status,
                        'manifest' => $plugin->manifest,
                        'requested_at' => $plugin->requested_at,
                        'requested_by' => $plugin->requester?->name,
                        'approved_at' => $plugin->approved_at,
                        'installed_at' => $plugin->installed_at,
                        'expires_at' => $plugin->expires_at,
                        'rejection_reason' => $plugin->rejection_reason,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $plugins,
                'message' => 'Installed plugins retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve installed plugins',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function installedDetail(Request $request, string $uuid): JsonResponse
    {
        try {
            // Get tenant UUID from middleware-set context (TenantContextMiddleware)
            $tenant = $request->get('current_tenant');
            $tenantId = $tenant ? $tenant->uuid : null;

            $plugin = InstalledPlugin::where('uuid', $uuid)
                ->where('tenant_id', $tenantId)
                ->with(['requester:uuid,name,email', 'approver:uuid,name,email', 'rejector:uuid,name,email'])
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
                'message' => 'Plugin details retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve plugin details',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    public function uninstall(Request $request, string $uuid): JsonResponse
    {
        try {
            // Get tenant UUID from middleware-set context (TenantContextMiddleware)
            $tenant = $request->get('current_tenant');
            $tenantId = $tenant ? $tenant->uuid : null;

            $plugin = InstalledPlugin::where('uuid', $uuid)
                ->where('tenant_id', $tenantId)
                ->firstOrFail();

            if (!$plugin->isActive() && !$plugin->isSuspended()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only active or suspended plugins can be uninstalled',
                ], 400);
            }

            $deleteData = $request->input('delete_data', false);

            $this->pluginManager->uninstall($tenantId, $plugin->plugin_name, $deleteData);

            return response()->json([
                'success' => true,
                'message' => "Plugin '{$plugin->display_name}' uninstalled successfully",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Plugin uninstallation failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function updateSettings(Request $request, string $uuid): JsonResponse
    {
        try {
            // Get tenant UUID from middleware-set context (TenantContextMiddleware)
            $tenant = $request->get('current_tenant');
            $tenantId = $tenant ? $tenant->uuid : null;

            $plugin = InstalledPlugin::where('uuid', $uuid)
                ->where('tenant_id', $tenantId)
                ->firstOrFail();

            if (!$plugin->isActive()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Settings can only be updated for active plugins',
                ], 400);
            }

            $newSettings = $request->input('settings', []);

            // Validate settings against schema if defined in manifest
            if (isset($plugin->manifest['settings_schema']['fields'])) {
                $validationErrors = $this->validateSettings($newSettings, $plugin->manifest['settings_schema']['fields']);
                if (!empty($validationErrors)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Settings validation failed',
                        'errors' => $validationErrors,
                    ], 422);
                }
            }

            // Merge with existing settings to preserve unmodified values
            $currentSettings = $plugin->settings ?? [];
            $mergedSettings = array_merge($currentSettings, $newSettings);

            $plugin->update(['settings' => $mergedSettings]);

            return response()->json([
                'success' => true,
                'data' => [
                    'uuid' => $plugin->uuid,
                    'settings' => $plugin->settings,
                ],
                'message' => 'Plugin settings updated successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Plugin not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update plugin settings',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    protected function validateSettings(array $settings, array $schema): array
    {
        $errors = [];

        foreach ($schema as $field) {
            $key = $field['key'];
            $type = $field['type'] ?? 'text';
            $required = $field['required'] ?? false;
            $value = $settings[$key] ?? null;

            // Check required
            if ($required && ($value === null || $value === '')) {
                $errors[$key][] = "The {$field['label']} field is required";
                continue;
            }

            // Skip validation if value is null and not required
            if ($value === null) {
                continue;
            }

            // Type validation
            switch ($type) {
                case 'number':
                    if (!is_numeric($value)) {
                        $errors[$key][] = "The {$field['label']} must be a number";
                    } else {
                        if (isset($field['min']) && $value < $field['min']) {
                            $errors[$key][] = "The {$field['label']} must be at least {$field['min']}";
                        }
                        if (isset($field['max']) && $value > $field['max']) {
                            $errors[$key][] = "The {$field['label']} must not exceed {$field['max']}";
                        }
                    }
                    break;

                case 'boolean':
                    if (!is_bool($value) && $value !== 0 && $value !== 1) {
                        $errors[$key][] = "The {$field['label']} must be true or false";
                    }
                    break;

                case 'select':
                    if (isset($field['options']) && !in_array($value, array_column($field['options'], 'value'))) {
                        $errors[$key][] = "The {$field['label']} contains an invalid value";
                    }
                    break;

                case 'text':
                case 'textarea':
                    if (!is_string($value)) {
                        $errors[$key][] = "The {$field['label']} must be a string";
                    } else {
                        if (isset($field['min_length']) && strlen($value) < $field['min_length']) {
                            $errors[$key][] = "The {$field['label']} must be at least {$field['min_length']} characters";
                        }
                        if (isset($field['max_length']) && strlen($value) > $field['max_length']) {
                            $errors[$key][] = "The {$field['label']} must not exceed {$field['max_length']} characters";
                        }
                    }
                    break;

                case 'color':
                    if (!is_string($value) || !preg_match('/^#[0-9A-Fa-f]{6}$/', $value)) {
                        $errors[$key][] = "The {$field['label']} must be a valid hex color (e.g., #FF5733)";
                    }
                    break;
            }
        }

        return $errors;
    }
}
