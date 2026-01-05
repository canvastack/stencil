<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Check product by slug
$productSlug = 'acrylic-board-basic-ETC-4';
echo "=== Checking Product: {$productSlug} ===\n\n";

$product = \App\Models\Product::where('slug', $productSlug)
    ->first(['id', 'uuid', 'name', 'slug', 'tenant_id', 'status', 'created_at']);

if ($product) {
    echo "Product Found:\n";
    echo json_encode($product->toArray(), JSON_PRETTY_PRINT) . "\n\n";
    
    // Check tenant info
    if ($product->tenant_id) {
        $tenant = \App\Models\Tenant::find($product->tenant_id, ['id', 'uuid', 'name', 'slug']);
        if ($tenant) {
            echo "Tenant Info:\n";
            echo json_encode($tenant->toArray(), JSON_PRETTY_PRINT) . "\n\n";
        }
    } else {
        echo "⚠️ WARNING: Product has NO tenant_id (NULL)\n\n";
    }
    
    // Get total products per tenant
    echo "=== Product Count by Tenant ===\n";
    $counts = \App\Models\Product::selectRaw('tenant_id, COUNT(*) as count')
        ->groupBy('tenant_id')
        ->get();
    
    foreach ($counts as $count) {
        $tenantName = $count->tenant_id 
            ? (\App\Models\Tenant::find($count->tenant_id)->name ?? 'Unknown')
            : 'NULL (No Tenant)';
        echo "Tenant {$count->tenant_id} ({$tenantName}): {$count->count} products\n";
    }
    
} else {
    echo "❌ Product NOT FOUND with slug: {$productSlug}\n";
    
    // Search for similar slugs
    echo "\nSearching for similar products...\n";
    $similar = \App\Models\Product::where('slug', 'LIKE', '%acrylic%')
        ->orWhere('name', 'LIKE', '%Acrylic Board%')
        ->limit(10)
        ->get(['id', 'name', 'slug', 'tenant_id']);
    
    if ($similar->count() > 0) {
        echo "Found {$similar->count()} similar products:\n";
        foreach ($similar as $p) {
            echo "  - {$p->name} ({$p->slug}) - Tenant: {$p->tenant_id}\n";
        }
    } else {
        echo "No similar products found.\n";
    }
}
