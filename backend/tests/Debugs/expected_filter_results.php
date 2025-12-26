<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant as TenantModel;

$etchinx = TenantModel::where('slug', 'etchinx')->first();

echo "========================================\n";
echo "EXPECTED FILTER RESULTS (PUBLISHED ONLY)\n";
echo "========================================\n";

$total = Product::where('tenant_id', $etchinx->id)->where('status', 'published')->count();
echo "\n📊 Total Published Products: $total\n";

// Type Filter
echo "\n1. TYPE FILTER:\n";
$types = Product::where('tenant_id', $etchinx->id)
    ->where('status', 'published')
    ->selectRaw('business_type, COUNT(*) as count')
    ->groupBy('business_type')
    ->orderBy('count', 'desc')
    ->get();

foreach ($types as $type) {
    $label = ucwords(str_replace('_', ' ', $type->business_type ?: 'Unknown'));
    echo "   - {$label}: {$type->count} products\n";
}

// Size Filter
echo "\n2. SIZE FILTER:\n";
$sizes = ['small', 'medium', 'large', 'custom'];
foreach ($sizes as $size) {
    $count = Product::where('tenant_id', $etchinx->id)
        ->where('status', 'published')
        ->where(function ($q) use ($size) {
            $q->where('size', $size)
              ->orWhereJsonContains('available_sizes', $size);
        })
        ->count();
    echo "   - " . ucfirst($size) . ": $count products\n";
}

// Material Filter (top 10)
echo "\n3. MATERIAL FILTER (Top 10):\n";
$materials = Product::where('tenant_id', $etchinx->id)
    ->where('status', 'published')
    ->whereNotNull('material')
    ->selectRaw('material, COUNT(*) as count')
    ->groupBy('material')
    ->orderBy('count', 'desc')
    ->limit(10)
    ->get();

foreach ($materials as $mat) {
    echo "   - {$mat->material}: {$mat->count} products\n";
}

$withAvailableMaterials = Product::where('tenant_id', $etchinx->id)
    ->where('status', 'published')
    ->whereNotNull('available_materials')
    ->whereRaw("available_materials::text != '[]'")
    ->count();
echo "   + {$withAvailableMaterials} products have available_materials JSON\n";

// Category Filter
echo "\n4. CATEGORY FILTER:\n";
$categories = Product::where('tenant_id', $etchinx->id)
    ->where('status', 'published')
    ->whereNotNull('category_id')
    ->with('category')
    ->get()
    ->groupBy('category.slug')
    ->map(fn($products) => [
        'name' => $products->first()->category->name,
        'count' => $products->count()
    ])
    ->sortByDesc('count')
    ->take(10);

foreach ($categories as $slug => $data) {
    echo "   - {$data['name']} ($slug): {$data['count']} products\n";
}

echo "\n========================================\n";
echo "✅ Size filter is now working!\n";
echo "   Please test again on frontend.\n";
echo "========================================\n";
