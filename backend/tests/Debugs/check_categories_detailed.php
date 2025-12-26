<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant as TenantModel;

$etchinx = TenantModel::where('slug', 'etchinx')->first();

echo "========================================\n";
echo "ETCHINX CATEGORY ANALYSIS\n";
echo "Tenant: {$etchinx->name} (slug: {$etchinx->slug})\n";
echo "Tenant ID: {$etchinx->id}\n";
echo "========================================\n\n";

// All categories in etchinx tenant
echo "ALL CATEGORIES IN ETCHINX TENANT:\n";
echo "----------------------------------------\n";
$categories = ProductCategory::where('tenant_id', $etchinx->id)
    ->orderBy('name')
    ->get(['id', 'name', 'slug', 'parent_id']);

foreach ($categories as $cat) {
    $parent = $cat->parent_id ? " (parent_id: {$cat->parent_id})" : "";
    echo "  - {$cat->name} (slug: {$cat->slug}){$parent}\n";
}

echo "\n";

// Products per category (published only)
echo "PUBLISHED PRODUCTS PER CATEGORY:\n";
echo "----------------------------------------\n";
$productCategories = Product::where('tenant_id', $etchinx->id)
    ->where('status', 'published')
    ->whereNotNull('category_id')
    ->with('category')
    ->get()
    ->groupBy('category.slug');

foreach ($productCategories as $slug => $products) {
    $name = $products->first()->category->name ?? 'Unknown';
    $count = $products->count();
    echo "  - {$name} ($slug): $count products\n";
}

echo "\n";

// Test frontend filters (partial match)
echo "TESTING FRONTEND FILTERS (ILIKE partial match):\n";
echo "----------------------------------------\n";

$frontendFilters = [
    'industrial' => 'Industrial',
    'decorative' => 'Dekoratif', 
    'corporate' => 'Korporat'
];

foreach ($frontendFilters as $filter => $label) {
    // Test using category relationship
    $count = Product::where('tenant_id', $etchinx->id)
        ->where('status', 'published')
        ->whereHas('category', function($q) use ($filter) {
            $q->where('slug', 'ILIKE', "%{$filter}%");
        })
        ->count();
    
    echo "  - {$label} (filter: '{$filter}'): $count products\n";
    
    // Show matching category slugs
    $matchingCategories = ProductCategory::where('tenant_id', $etchinx->id)
        ->where('slug', 'ILIKE', "%{$filter}%")
        ->pluck('slug')
        ->toArray();
    
    if (!empty($matchingCategories)) {
        echo "    Matches: " . implode(', ', $matchingCategories) . "\n";
    } else {
        echo "    ⚠️  No matching category slugs found!\n";
    }
}

echo "\n========================================\n";
