<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Infrastructure\Persistence\Eloquent\Models\Product;

$nullCount = Product::whereNull('production_type')->count();
$emptyCount = Product::where('production_type', '')->count();
$validCount = Product::whereNotNull('production_type')->where('production_type', '!=', '')->count();

echo "Products with NULL production_type: $nullCount\n";
echo "Products with empty string production_type: $emptyCount\n";
echo "Products with valid production_type: $validCount\n";
echo "\nTotal products: " . Product::count() . "\n";

if ($nullCount > 0 || $emptyCount > 0) {
    echo "\n⚠️ WARNING: Found products without production_type!\n";
    echo "\nFirst 5 products with NULL/empty production_type:\n";
    $products = Product::whereNull('production_type')
        ->orWhere('production_type', '')
        ->limit(5)
        ->get(['id', 'name', 'production_type']);
    
    foreach ($products as $product) {
        echo "  - ID: {$product->id}, Name: {$product->name}, production_type: " . ($product->production_type ?? 'NULL') . "\n";
    }
}
