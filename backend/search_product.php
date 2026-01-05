<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Infrastructure\Persistence\Eloquent\Models\Product;

echo "Searching for 'Acrylic Board Basic'...\n\n";

// Search for products containing "Acrylic"
$products = Product::where('name', 'LIKE', '%Acrylic%')
    ->orWhere('name', 'LIKE', '%acrylic%')
    ->get();

echo "Found " . $products->count() . " products with 'Acrylic' in name:\n";
foreach ($products as $product) {
    echo "\n---\n";
    echo "ID: " . $product->id . "\n";
    echo "UUID: " . $product->uuid . "\n";
    echo "Name: " . $product->name . "\n";
    echo "Tenant ID: " . $product->tenant_id . "\n";
    echo "Status: " . $product->status . "\n";
    echo "SKU: " . $product->sku . "\n";
    echo "Description: " . substr($product->description, 0, 100) . "...\n";
    echo "Tags: " . json_encode($product->tags) . "\n";
}

// Specifically search for "Acrylic Board Basic"
echo "\n\n=== Specific search for 'Acrylic Board Basic' ===\n";
$specificProduct = Product::where('name', 'LIKE', '%Acrylic Board Basic%')->first();

if ($specificProduct) {
    echo "Found!\n";
    echo "ID: " . $specificProduct->id . "\n";
    echo "UUID: " . $specificProduct->uuid . "\n";
    echo "Name: " . $specificProduct->name . "\n";
    echo "Tenant ID: " . $specificProduct->tenant_id . "\n";
    echo "Status: " . $specificProduct->status . "\n";
    echo "SKU: " . $specificProduct->sku . "\n";
} else {
    echo "NOT FOUND\n";
}
