<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use Illuminate\Support\Facades\DB;

echo "=== TENANT ISOLATION VERIFICATION ===" . PHP_EOL . PHP_EOL;

// 1. Check all tenants
$tenants = Tenant::select('id', 'uuid', 'name', 'slug', 'status')->get();
echo "TENANTS IN DATABASE (" . $tenants->count() . " total):" . PHP_EOL;
foreach ($tenants as $t) {
    echo "  - ID: {$t->id} | UUID: {$t->uuid} | Slug: '{$t->slug}' | Name: {$t->name}" . PHP_EOL;
}
echo PHP_EOL;

// 2. Check product counts per tenant
$productCounts = Product::select('tenant_id', DB::raw('count(*) as count'))
    ->groupBy('tenant_id')
    ->get();
    
echo "PRODUCT COUNTS PER TENANT:" . PHP_EOL;
foreach ($productCounts as $pc) {
    $tenant = TenantEloquentModel::find($pc->tenant_id);
    $tenantInfo = $tenant ? "'{$tenant->slug}'" : "UNKNOWN/DELETED";
    echo "  - Tenant: {$tenantInfo} (ID: {$pc->tenant_id}) -> {$pc->count} products" . PHP_EOL;
}
echo PHP_EOL;

// 3. Check if 'etchinx' tenant exists
$etchinxTenant = TenantEloquentModel::where('slug', 'etchinx')->first();
if ($etchinxTenant) {
    echo "ETCHINX TENANT FOUND:" . PHP_EOL;
    echo "  - ID: {$etchinxTenant->id}" . PHP_EOL;
    echo "  - UUID: {$etchinxTenant->uuid}" . PHP_EOL;
    echo "  - Name: {$etchinxTenant->name}" . PHP_EOL;
    echo "  - Slug: {$etchinxTenant->slug}" . PHP_EOL;
    echo PHP_EOL;
    
    // Get etchinx products
    $etchinxProducts = Product::where('tenant_id', $etchinxTenant->id)
        ->select('id', 'uuid', 'name', 'sku', 'tenant_id')
        ->limit(5)
        ->get();
    
    echo "ETCHINX PRODUCTS (showing first 5):" . PHP_EOL;
    foreach ($etchinxProducts as $p) {
        echo "  - UUID: {$p->uuid} | Name: {$p->name} | SKU: {$p->sku} | Tenant ID: {$p->tenant_id}" . PHP_EOL;
    }
    echo PHP_EOL;
} else {
    echo "⚠️  WARNING: 'etchinx' tenant NOT FOUND in database!" . PHP_EOL;
    echo "   This means the frontend URL /etchinx/products won't return any products." . PHP_EOL;
    echo PHP_EOL;
}

// 4. Check for products with DIFFERENT tenant_id than etchinx
if ($etchinxTenant) {
    $otherProducts = Product::where('tenant_id', '!=', $etchinxTenant->id)
        ->select('id', 'uuid', 'name', 'tenant_id')
        ->limit(5)
        ->get();
    
    if ($otherProducts->count() > 0) {
        echo "PRODUCTS FROM OTHER TENANTS (should NOT appear on /etchinx/products):" . PHP_EOL;
        foreach ($otherProducts as $p) {
            $tenant = TenantEloquentModel::find($p->tenant_id);
            $tenantSlug = $tenant ? $tenant->slug : 'UNKNOWN';
            echo "  - UUID: {$p->uuid} | Name: {$p->name} | Tenant: {$tenantSlug} (ID: {$p->tenant_id})" . PHP_EOL;
        }
        echo PHP_EOL;
    }
}

// 5. Simulate API request for etchinx products
echo "=== SIMULATING API REQUEST ===" . PHP_EOL;
if ($etchinxTenant) {
    $query = Product::where('tenant_id', $etchinxTenant->id)
        ->where('status', 'published');
    
    $totalPublished = $query->count();
    echo "Total published products for etchinx: {$totalPublished}" . PHP_EOL;
    
    // Get first page
    $products = $query->paginate(12);
    echo "First page (12 per page): {$products->count()} products returned" . PHP_EOL;
    echo "Total pages: {$products->lastPage()}" . PHP_EOL;
    echo PHP_EOL;
    
    echo "VERIFICATION RESULT:" . PHP_EOL;
    $allBelongToEtchinx = true;
    foreach ($products as $p) {
        if ($p->tenant_id != $etchinxTenant->id) {
            echo "  ❌ FAILED: Product '{$p->name}' belongs to tenant ID {$p->tenant_id}, NOT etchinx!" . PHP_EOL;
            $allBelongToEtchinx = false;
        }
    }
    
    if ($allBelongToEtchinx && $products->count() > 0) {
        echo "  ✅ SUCCESS: All {$products->count()} products belong to etchinx tenant (ID: {$etchinxTenant->id})" . PHP_EOL;
    } elseif ($products->count() == 0) {
        echo "  ⚠️  WARNING: No published products found for etchinx" . PHP_EOL;
    }
}

echo PHP_EOL . "=== END VERIFICATION ===" . PHP_EOL;
