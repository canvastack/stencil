<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Testing Tenant Scoping for ProductCategory\n";
echo "==========================================\n\n";

// Get all tenants
$tenants = TenantEloquentModel::all();
echo "Found " . $tenants->count() . " tenants:\n";
foreach ($tenants as $tenant) {
    echo "- {$tenant->name} (ID: {$tenant->id}, Slug: {$tenant->slug})\n";
}
echo "\n";

// Test without tenant context
echo "1. Categories WITHOUT tenant context:\n";
$categoriesWithoutTenant = ProductCategory::withoutGlobalScope('tenant')->get();
echo "Total categories across all tenants: " . $categoriesWithoutTenant->count() . "\n";

// Group by tenant
$byTenant = $categoriesWithoutTenant->groupBy('tenant_id');
foreach ($byTenant as $tenantId => $categories) {
    $tenant = $tenants->find($tenantId);
    echo "  - Tenant {$tenant->name}: {$categories->count()} categories\n";
}
echo "\n";

// Test with tenant context for each tenant
foreach ($tenants->take(2) as $tenant) {
    echo "2. Categories WITH tenant context for {$tenant->name}:\n";
    
    // Set tenant context
    $tenant->makeCurrent();
    config(['multitenancy.current_tenant' => $tenant]);
    
    // Query categories (should be scoped)
    $scopedCategories = ProductCategory::all();
    echo "Categories for {$tenant->name}: " . $scopedCategories->count() . "\n";
    
    if ($scopedCategories->count() > 0) {
        echo "First few categories:\n";
        foreach ($scopedCategories->take(3) as $category) {
            echo "  - {$category->name} (tenant_id: {$category->tenant_id})\n";
        }
    }
    echo "\n";
    
    // Clear tenant context
    \Spatie\Multitenancy\Models\Tenant::forgetCurrent();
    config(['multitenancy.current_tenant' => null]);
}

echo "Test completed!\n";