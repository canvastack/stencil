<?php

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Services\PluginManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PluginController extends Controller
{
    protected PluginManager $pluginManager;

    public function __construct(PluginManager $pluginManager)
    {
        $this->pluginManager = $pluginManager;
    }

    public function index(Request $request): JsonResponse
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

    public function installed(Request $request): JsonResponse
    {
        $request->validate([
            'tenant_id' => 'required|uuid|exists:tenants,uuid',
        ]);

        try {
            $tenantId = $request->input('tenant_id');
            $installed = $this->pluginManager->getInstalled($tenantId);

            return response()->json([
                'success' => true,
                'data' => $installed,
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

    public function install(Request $request): JsonResponse
    {
        $request->validate([
            'tenant_id' => 'required|uuid|exists:tenants,uuid',
            'plugin_name' => 'required|string',
        ]);

        try {
            $tenantId = $request->input('tenant_id');
            $pluginName = $request->input('plugin_name');
            $installedBy = $request->user()->uuid ?? null;

            $result = $this->pluginManager->install($tenantId, $pluginName, $installedBy);

            return response()->json([
                'success' => true,
                'data' => ['installed' => $result],
                'message' => "Plugin '{$pluginName}' installed successfully",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Plugin installation failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function uninstall(Request $request): JsonResponse
    {
        $request->validate([
            'tenant_id' => 'required|uuid|exists:tenants,uuid',
            'plugin_name' => 'required|string',
            'delete_data' => 'boolean',
        ]);

        try {
            $tenantId = $request->input('tenant_id');
            $pluginName = $request->input('plugin_name');
            $deleteData = $request->input('delete_data', false);

            $result = $this->pluginManager->uninstall($tenantId, $pluginName, $deleteData);

            return response()->json([
                'success' => true,
                'data' => ['uninstalled' => $result],
                'message' => "Plugin '{$pluginName}' uninstalled successfully",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Plugin uninstallation failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function enable(Request $request): JsonResponse
    {
        $request->validate([
            'tenant_id' => 'required|uuid|exists:tenants,uuid',
            'plugin_name' => 'required|string',
        ]);

        try {
            $tenantId = $request->input('tenant_id');
            $pluginName = $request->input('plugin_name');

            $result = $this->pluginManager->enable($tenantId, $pluginName);

            return response()->json([
                'success' => true,
                'data' => ['enabled' => $result],
                'message' => "Plugin '{$pluginName}' enabled successfully",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Plugin enable failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function disable(Request $request): JsonResponse
    {
        $request->validate([
            'tenant_id' => 'required|uuid|exists:tenants,uuid',
            'plugin_name' => 'required|string',
        ]);

        try {
            $tenantId = $request->input('tenant_id');
            $pluginName = $request->input('plugin_name');

            $result = $this->pluginManager->disable($tenantId, $pluginName);

            return response()->json([
                'success' => true,
                'data' => ['disabled' => $result],
                'message' => "Plugin '{$pluginName}' disabled successfully",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Plugin disable failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
