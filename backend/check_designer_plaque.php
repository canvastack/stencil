<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductFormConfiguration;
use App\Infrastructure\Persistence\Eloquent\Models\Product;

echo "=== SEARCHING DESIGNER CLEAR PLAQUE ===\n\n";

// Try by UUID
$product = Product::where('uuid', 'bd3e38b8-2908-4e91-ba35-384403eaaa36')->first();

if (!$product) {
    // Try by name
    $product = Product::where('name', 'like', '%Designer Clear Plaque%')->first();
}

if ($product) {
    echo "✅ FOUND!\n";
    echo "Name: {$product->name}\n";
    echo "UUID: {$product->uuid}\n";
    echo "Slug: {$product->slug}\n";
    echo "Status: {$product->status}\n";
    echo "Tenant ID: {$product->tenant_id}\n";
    echo "SKU: {$product->sku}\n";
    echo "Price: " . number_format($product->price) . "\n";
    echo "Category: {$product->category}\n\n";
    
    // Check form configurations
    $formConfigs = ProductFormConfiguration::where('product_id', $product->id)->get();
    echo "Form Configurations: " . $formConfigs->count() . "\n";
    
    if ($formConfigs->count() > 0) {
        foreach ($formConfigs as $fc) {
            echo "  - Config ID: {$fc->id} | Name: {$fc->name} | Active: " . ($fc->is_active ? 'YES' : 'NO') . "\n";
            echo "    tenant_id: {$fc->tenant_id} | product_id: {$fc->product_id}\n";
        }
    } else {
        echo "  ⚠️  NO FORM CONFIGURATIONS FOUND!\n";
    }
    
    // Check if tenant ID matches
    echo "\n=== TENANT INFO ===\n";
    $tenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::find($product->tenant_id);
    if ($tenant) {
        echo "Tenant: {$tenant->name}\n";
        echo "Tenant Slug: {$tenant->slug}\n";
        echo "Total products for this tenant: " . Product::where('tenant_id', $tenant->id)->count() . "\n";
        echo "Published products: " . Product::where('tenant_id', $tenant->id)->where('status', 'published')->count() . "\n";
    }
} else {
    echo "❌ PRODUCT NOT FOUND!\n";
    echo "\nSearching all products with 'Clear' in name:\n";
    $clearProducts = Product::where('name', 'like', '%Clear%')->limit(10)->get();
    foreach ($clearProducts as $p) {
        echo "  - {$p->name} (UUID: {$p->uuid}, Status: {$p->status})\n";
    }
}

echo "\n=== CHECKING PUBLIC API SIMULATION ===\n";
if ($product) {
    $publicProduct = Product::where('uuid', $product->uuid)
        ->where('status', 'published')
        ->first();
    
    if ($publicProduct) {
        echo "✅ Product would appear in public API\n";
        
        $config = ProductFormConfiguration::where('product_id', $publicProduct->id)
            ->where('is_active', true)
            ->first();
        
        if ($config) {
            echo "✅ Has active form configuration (ID: {$config->id})\n";
            echo "   Form schema fields: " . (isset($config->form_schema['fields']) ? count($config->form_schema['fields']) : 0) . "\n";
        } else {
            echo "❌ NO ACTIVE FORM CONFIGURATION - Form won't render!\n";
        }
    } else {
        echo "❌ Product NOT published - won't appear in public listing\n";
    }
}

echo "\nDONE!\n";
