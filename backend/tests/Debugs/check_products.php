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

$total = Product::where('tenant_id', $etchinx->id)->count();
$noCat = Product::where('tenant_id', $etchinx->id)->whereNull('category_id')->count();
$withCat = $total - $noCat;

echo "========================================\n";
echo "ETCHINX PRODUCTS ANALYSIS\n";
echo "========================================\n";
echo "Total Products: $total\n";
echo "Products tanpa category: $noCat (" . round(($noCat/$total)*100, 1) . "%)\n";
echo "Products dengan category: $withCat (" . round(($withCat/$total)*100, 1) . "%)\n";
echo "\n";

// Check business types
echo "Business Type Distribution:\n";
$businessTypes = Product::where('tenant_id', $etchinx->id)
    ->selectRaw('business_type, COUNT(*) as count')
    ->groupBy('business_type')
    ->get();

foreach ($businessTypes as $bt) {
    $type = $bt->business_type ?: 'NULL';
    echo "  - $type: {$bt->count}\n";
}

echo "\n";

// Check categories
echo "Category Distribution:\n";
$categories = Product::where('tenant_id', $etchinx->id)
    ->whereNotNull('category_id')
    ->with('category')
    ->get()
    ->groupBy('category.slug');

foreach ($categories as $slug => $products) {
    $name = $products->first()->category->name ?? 'Unknown';
    $count = $products->count();
    echo "  - $name ($slug): $count\n";
}

echo "\nProducts tanpa category: $noCat\n";

// Check sizes
echo "\n";
echo "Size Distribution:\n";
$sizes = Product::where('tenant_id', $etchinx->id)
    ->selectRaw('size, COUNT(*) as count')
    ->groupBy('size')
    ->get();

foreach ($sizes as $s) {
    $size = $s->size ?: 'NULL';
    echo "  - $size: {$s->count}\n";
}

// Check available_sizes JSON
echo "\n";
echo "Available Sizes (JSON) Distribution:\n";
$withAvailableSizes = Product::where('tenant_id', $etchinx->id)
    ->whereNotNull('available_sizes')
    ->whereRaw("available_sizes::text != '[]'")
    ->count();
echo "Products with available_sizes: $withAvailableSizes\n";

if ($withAvailableSizes > 0) {
    $sampleProducts = Product::where('tenant_id', $etchinx->id)
        ->whereNotNull('available_sizes')
        ->whereRaw("available_sizes::text != '[]'")
        ->limit(5)
        ->get(['name', 'size', 'available_sizes']);
    
    echo "\nSample products with available_sizes:\n";
    foreach ($sampleProducts as $p) {
        echo "  - {$p->name}:\n";
        echo "    size column: " . ($p->size ?: 'NULL') . "\n";
        echo "    available_sizes: " . json_encode($p->available_sizes) . "\n";
    }
}

// Check materials
echo "\n";
echo "Material Distribution:\n";
$materials = Product::where('tenant_id', $etchinx->id)
    ->selectRaw('material, COUNT(*) as count')
    ->groupBy('material')
    ->get();

foreach ($materials as $m) {
    $material = $m->material ?: 'NULL';
    echo "  - $material: {$m->count}\n";
}

// Check available_materials JSON
echo "\n";
echo "Available Materials (JSON) Distribution:\n";
$withAvailableMaterials = Product::where('tenant_id', $etchinx->id)
    ->whereNotNull('available_materials')
    ->whereRaw("available_materials::text != '[]'")
    ->count();
echo "Products with available_materials: $withAvailableMaterials\n";

if ($withAvailableMaterials > 0) {
    $sampleProducts = Product::where('tenant_id', $etchinx->id)
        ->whereNotNull('available_materials')
        ->whereRaw("available_materials::text != '[]'")
        ->limit(5)
        ->get(['name', 'material', 'available_materials']);
    
    echo "\nSample products with available_materials:\n";
    foreach ($sampleProducts as $p) {
        echo "  - {$p->name}:\n";
        echo "    material column: " . ($p->material ?: 'NULL') . "\n";
        echo "    available_materials: " . json_encode($p->available_materials) . "\n";
    }
}

echo "\n========================================\n";
