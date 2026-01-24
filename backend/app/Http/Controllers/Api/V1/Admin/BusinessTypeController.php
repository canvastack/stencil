<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BusinessTypeController extends Controller
{
    /**
     * Get available business types
     * Returns predefined business types list for category classification
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $availableTypes = [
            ['value' => 'metal_etching', 'label' => 'Metal Etching'],
            ['value' => 'glass_etching', 'label' => 'Glass Etching'],
            ['value' => 'award_plaque', 'label' => 'Awards & Plaques'],
            ['value' => 'signage', 'label' => 'Signage Solutions'],
            ['value' => 'industrial_etching', 'label' => 'Industrial Etching'],
            ['value' => 'custom_etching', 'label' => 'Custom Etching'],
        ];
        
        $existingTypes = ProductCategory::query()
            ->whereNotNull('business_type')
            ->distinct()
            ->pluck('business_type');
        
        return response()->json([
            'data' => $availableTypes,
            'existing' => $existingTypes
        ]);
    }
}
