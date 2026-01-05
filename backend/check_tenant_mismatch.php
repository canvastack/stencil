<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔍 Checking Tenant ID Data Type Mismatch\n";
echo "==========================================\n\n";

// Check products table tenant_id type
$productUuid = 'f5de74e0-1f44-464a-9121-ca0c25d0064d';
$product = App\Infrastructure\Persistence\Eloquent\Models\Product::where('uuid', $productUuid)->first();

echo "Product:\n";
echo "  - tenant_id value: {$product->tenant_id}\n";
echo "  - tenant_id type: " . gettype($product->tenant_id) . "\n";

// Get the actual tenant
$tenant = $product->tenant;
if ($tenant) {
    echo "\nActual Tenant:\n";
    echo "  - ID: {$tenant->id}\n";
    echo "  - UUID: {$tenant->uuid}\n";
    echo "  - Slug: {$tenant->slug}\n";
}

// Check product_form_configurations table tenant_id type
$config = App\Models\ProductFormConfiguration::where('product_id', $product->id)
    ->where('is_active', true)
    ->first();

if ($config) {
    echo "\nActive Form Configuration:\n";
    echo "  - tenant_id value: {$config->tenant_id}\n";
    echo "  - tenant_id type: " . gettype($config->tenant_id) . "\n";
    
    echo "\n❌ MISMATCH DETECTED!\n";
    echo "  Product tenant_id: {$product->tenant_id} (integer)\n";
    echo "  Config tenant_id: {$config->tenant_id} (string/UUID)\n";
    echo "\nThe ProductFormConfiguration controller is storing tenant->uuid instead of tenant->id!\n";
}

// Check what the public API would fetch
echo "\n🔍 Public API Query Test:\n";
echo "========================================\n";
$publicQuery = App\Models\ProductFormConfiguration::where('product_id', $product->id)
    ->where('is_active', true)
    ->first();

if ($publicQuery) {
    echo "✅ Public API WOULD find configuration (doesn't filter by tenant_id)\n";
    echo "   Config ID: {$publicQuery->id}, Fields: " . count($publicQuery->form_schema['fields']) . "\n";
} else {
    echo "❌ Public API would NOT find configuration\n";
}

// Check what the tenant API would fetch (with tenant_id filter)
echo "\n🔍 Tenant API Query Test:\n";
echo "========================================\n";
if ($tenant) {
    $tenantQuery = App\Models\ProductFormConfiguration::where('product_id', $product->id)
        ->where('tenant_id', $tenant->uuid)
        ->where('is_active', true)
        ->first();
    
    if ($tenantQuery) {
        echo "✅ Tenant API WOULD find configuration (filters by tenant->uuid)\n";
        echo "   Config ID: {$tenantQuery->id}, Fields: " . count($tenantQuery->form_schema['fields']) . "\n";
    } else {
        echo "❌ Tenant API would NOT find configuration (tenant->uuid filter fails)\n";
    }
}
