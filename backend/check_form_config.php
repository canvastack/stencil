<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$productUuid = 'f5de74e0-1f44-464a-9121-ca0c25d0064d';

$product = App\Infrastructure\Persistence\Eloquent\Models\Product::where('uuid', $productUuid)->first();

if (!$product) {
    echo "❌ Product not found with UUID: {$productUuid}\n";
    exit(1);
}

echo "✅ Product found:\n";
echo "  - ID: {$product->id}\n";
echo "  - UUID: {$product->uuid}\n";
echo "  - Name: {$product->name}\n";
echo "  - Tenant ID: {$product->tenant_id}\n";
echo "\n";

$configs = App\Models\ProductFormConfiguration::where('product_id', $product->id)->get();

echo "Form Configurations for this product: {$configs->count()}\n";
echo "----------------------------------------\n";

if ($configs->count() === 0) {
    echo "❌ No form configurations found for this product!\n";
    echo "\nThis is the problem - no configurations have been saved.\n";
} else {
    foreach ($configs as $config) {
        echo "Config #{$config->id}:\n";
        echo "  - UUID: {$config->uuid}\n";
        echo "  - Name: {$config->name}\n";
        echo "  - Active: " . ($config->is_active ? 'YES' : 'NO') . "\n";
        echo "  - Tenant ID: {$config->tenant_id}\n";
        echo "  - Product ID: {$config->product_id}\n";
        echo "  - Version: {$config->version}\n";
        echo "  - Created: {$config->created_at}\n";
        echo "  - Form Schema Fields: " . (isset($config->form_schema['fields']) ? count($config->form_schema['fields']) : 0) . "\n";
        echo "\n";
    }
}
