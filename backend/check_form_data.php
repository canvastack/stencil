<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductFormConfiguration;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;

echo "=== DATABASE VERIFICATION ===\n\n";

echo "1. Total Form Configurations: " . ProductFormConfiguration::count() . "\n";
echo "2. Total Products: " . Product::count() . "\n";
echo "3. Total Tenants: " . Tenant::count() . "\n\n";

echo "=== SAMPLE FORM CONFIGURATIONS ===\n";
$configs = ProductFormConfiguration::with(['product', 'tenant'])->limit(10)->get();

foreach ($configs as $config) {
    echo "ID: {$config->id}\n";
    echo "  - tenant_id: {$config->tenant_id} (" . gettype($config->tenant_id) . ")\n";
    echo "  - product_id: {$config->product_id}\n";
    echo "  - product_uuid: {$config->product_uuid}\n";
    echo "  - Product: " . ($config->product ? $config->product->name : 'NULL') . "\n";
    echo "  - Tenant: " . ($config->tenant ? $config->tenant->name : 'NULL RELATIONSHIP BROKEN') . "\n";
    echo "  - is_active: " . ($config->is_active ? 'YES' : 'NO') . "\n";
    echo "---\n";
}

echo "\n=== CHECK TENANT IDs TYPE ===\n";
$tenants = Tenant::limit(3)->get();
foreach ($tenants as $tenant) {
    echo "Tenant: {$tenant->name}\n";
    echo "  - ID: {$tenant->id} (" . gettype($tenant->id) . ")\n";
    echo "  - UUID: {$tenant->uuid}\n";
    $formCount = ProductFormConfiguration::where('tenant_id', $tenant->id)->count();
    echo "  - Form Configs Count: {$formCount}\n";
    echo "---\n";
}

echo "\n=== CHECK PRODUCTS WITH FORMS ===\n";
$products = Product::with(['formConfiguration'])->where('status', 'published')->limit(5)->get();
foreach ($products as $product) {
    echo "Product: {$product->name}\n";
    echo "  - UUID: {$product->uuid}\n";
    echo "  - tenant_id: {$product->tenant_id} (" . gettype($product->tenant_id) . ")\n";
    echo "  - Form Configs: " . $product->formConfiguration->count() . "\n";
    if ($product->formConfiguration->count() > 0) {
        foreach ($product->formConfiguration as $fc) {
            echo "    > Config ID: {$fc->id} | Active: " . ($fc->is_active ? 'YES' : 'NO') . "\n";
        }
    }
    echo "---\n";
}

echo "\nDONE!\n";
