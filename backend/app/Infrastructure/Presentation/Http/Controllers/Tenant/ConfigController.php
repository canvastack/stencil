<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Configuration Controller
 * 
 * Provides tenant-specific configuration values from environment
 * for frontend consumption.
 */
class ConfigController extends Controller
{
    /**
     * Get exchange rate configuration
     * 
     * Returns default exchange rate and currency settings
     * from environment variables.
     * 
     * @return JsonResponse
     */
    public function exchangeRate(): JsonResponse
    {
        return response()->json([
            'data' => [
                'default_exchange_rate' => (float) config('app.default_exchange_rate', 15750),
                'default_currency' => config('app.default_currency', 'IDR'),
                'secondary_currency' => config('app.secondary_currency', 'USD'),
            ]
        ]);
    }
    
    /**
     * Get all public configuration values
     * 
     * Returns all safe-to-expose configuration values
     * for frontend consumption.
     * 
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [
                'app_name' => config('app.name'),
                'app_url' => config('app.url'),
                'frontend_url' => config('app.frontend_url'),
                'currency' => [
                    'default_exchange_rate' => (float) config('app.default_exchange_rate', 15750),
                    'default_currency' => config('app.default_currency', 'IDR'),
                    'secondary_currency' => config('app.secondary_currency', 'USD'),
                ],
            ]
        ]);
    }
}
