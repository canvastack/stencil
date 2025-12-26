<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant as TenantModel;

$etchinx = TenantModel::where('slug', 'etchinx')->first();

if (!$etchinx) {
    echo "Tenant etchinx tidak ditemukan!\n";
    exit(1);
}

echo "========================================\n";
echo "POPULATING SIZE DATA FOR ETCHINX PRODUCTS\n";
echo "========================================\n";

$products = Product::where('tenant_id', $etchinx->id)->get();

$sizeMap = [
    'small' => 0,
    'medium' => 0,
    'large' => 0,
    'custom' => 0,
];

foreach ($products as $product) {
    // Determine size based on dimensions or business type
    $size = 'medium'; // Default
    $availableSizes = ['small', 'medium', 'large'];
    
    // If product has dimensions, use them to determine size
    if ($product->dimensions && is_array($product->dimensions)) {
        $dims = $product->dimensions;
        $volume = 0;
        
        if (isset($dims['length']) && isset($dims['width']) && isset($dims['height'])) {
            $volume = $dims['length'] * $dims['width'] * $dims['height'];
            
            if ($volume < 5000) {
                $size = 'small';
            } elseif ($volume < 50000) {
                $size = 'medium';
            } else {
                $size = 'large';
            }
        }
    }
    
    // Business type specific logic
    switch ($product->business_type) {
        case 'award_plaque':
            $availableSizes = ['small', 'medium', 'large'];
            break;
        case 'signage':
            $size = 'large';
            $availableSizes = ['medium', 'large', 'custom'];
            break;
        case 'glass_etching':
        case 'metal_etching':
            $availableSizes = ['small', 'medium', 'large', 'custom'];
            break;
        default:
            $availableSizes = ['medium'];
            break;
    }
    
    $product->size = $size;
    $product->available_sizes = $availableSizes;
    $product->save();
    
    $sizeMap[$size]++;
}

echo "\nSize Distribution After Population:\n";
foreach ($sizeMap as $size => $count) {
    echo "  - $size: $count products\n";
}

echo "\nVerifying available_sizes JSON:\n";
$withSizes = Product::where('tenant_id', $etchinx->id)
    ->whereNotNull('available_sizes')
    ->whereRaw("available_sizes::text != '[]'")
    ->count();
echo "Products with available_sizes: $withSizes\n";

echo "\n✅ Size data populated successfully!\n";
echo "========================================\n";
