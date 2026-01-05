<?php

require __DIR__ . '/backend/vendor/autoload.php';

$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "🔧 Fixing Tenant ID Mismatch\n";
echo "====================================\n\n";

// Get the product
$productUuid = 'f5de74e0-1f44-464a-9121-ca0c25d0064d';
$product = App\Infrastructure\Persistence\Eloquent\Models\Product::where('uuid', $productUuid)->first();

if (!$product) {
    echo "❌ Product not found\n";
    exit(1);
}

echo "Product Info:\n";
echo "  - ID: {$product->id}\n";
echo "  - tenant_id (current): {$product->tenant_id}\n";
echo "  - tenant_id type: " . gettype($product->tenant_id) . "\n\n";

// Get tenant
$tenant = DB::table('tenants')->where('id', $product->tenant_id)->first();

if (!$tenant) {
    echo "❌ Tenant not found\n";
    exit(1);
}

echo "Tenant Info:\n";
echo "  - ID: {$tenant->id}\n";
echo "  - UUID: {$tenant->uuid}\n";
echo "  - Slug: {$tenant->slug}\n\n";

// Check column types
$productsColumns = DB::select("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'tenant_id'");
$configColumns = DB::select("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'product_form_configurations' AND column_name = 'tenant_id'");

echo "Column Types:\n";
echo "  - products.tenant_id: " . ($productsColumns[0]->data_type ?? 'unknown') . "\n";
echo "  - product_form_configurations.tenant_id: " . ($configColumns[0]->data_type ?? 'unknown') . "\n\n";

// The FIX: Update all form configurations to use tenant->id instead of tenant->uuid
echo "🔧 Updating form configurations...\n";

$updated = DB::table('product_form_configurations')
    ->where('tenant_id', $tenant->uuid)
    ->update(['tenant_id' => $tenant->id]);

echo "✅ Updated {$updated} configuration(s)\n\n";

// Verify
$config = App\Models\ProductFormConfiguration::where('product_id', $product->id)
    ->where('tenant_id', $tenant->id)
    ->where('is_active', true)
    ->first();

if ($config) {
    echo "✅ SUCCESS! Active configuration now found with correct tenant_id\n";
    echo "   Config ID: {$config->id}\n";
    echo "   Tenant ID: {$config->tenant_id} (should match product's tenant_id: {$product->tenant_id})\n";
} else {
    echo "❌ Configuration still not found\n";
}
