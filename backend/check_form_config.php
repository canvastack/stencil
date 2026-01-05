<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductFormConfiguration;
use App\Infrastructure\Persistence\Eloquent\Models\Product;

$productUuid = '307815d4-e587-4b95-aa57-a40325326956';
$product = Product::where('uuid', $productUuid)->first();

if (!$product) {
    echo "Product not found!\n";
    exit(1);
}

echo "Product: {$product->name}\n";
echo "Product ID: {$product->id}\n";
echo "Tenant ID: {$product->tenant_id}\n\n";

$configs = ProductFormConfiguration::where('product_id', $product->id)->get();
echo "Total configs: {$configs->count()}\n\n";

foreach ($configs as $config) {
    echo "Config UUID: {$config->uuid}\n";
    echo "Name: {$config->name}\n";
    echo "Title: " . ($config->form_schema['title'] ?? 'N/A') . "\n";
    echo "Field Count: " . (isset($config->form_schema['fields']) ? count($config->form_schema['fields']) : 0) . "\n";
    echo "Is Active: " . ($config->is_active ? 'YES' : 'NO') . "\n";
    echo "Has Template: " . ($config->template_id ? "YES (ID: {$config->template_id})" : 'NO (from form builder)') . "\n";
    echo "Version: {$config->version}\n";
    echo "Created: {$config->created_at}\n";
    echo "Updated: {$config->updated_at}\n";
    echo "------------------------------\n\n";
}
