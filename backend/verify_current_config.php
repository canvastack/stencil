<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductFormConfiguration;
use App\Infrastructure\Persistence\Eloquent\Models\Product;

$productUuid = '307815d4-e587-4b95-aa57-a40325326956';

echo "🔍 Checking Current Form Configuration State...\n\n";

$product = Product::where('uuid', $productUuid)->first();

if (!$product) {
    echo "❌ Product not found!\n";
    exit(1);
}

echo "Product: {$product->name}\n";
echo "Product ID: {$product->id}\n\n";

// Get ALL configs (including inactive)
$allConfigs = ProductFormConfiguration::where('product_id', $product->id)
    ->orderBy('updated_at', 'desc')
    ->get();

echo "📊 Total configs in database: {$allConfigs->count()}\n\n";

foreach ($allConfigs as $index => $config) {
    echo "Config #" . ($index + 1) . ":\n";
    echo "  UUID: {$config->uuid}\n";
    echo "  Name: {$config->name}\n";
    echo "  Active: " . ($config->is_active ? 'YES' : 'NO') . "\n";
    echo "  Version: {$config->version}\n";
    echo "  Title: " . ($config->form_schema['title'] ?? 'N/A') . "\n";
    echo "  Fields: " . (isset($config->form_schema['fields']) ? count($config->form_schema['fields']) : 0) . "\n";
    echo "  Updated: {$config->updated_at}\n";
    echo "\n";
}

// Get the ACTIVE config (what the API should return)
$activeConfig = ProductFormConfiguration::where('product_id', $product->id)
    ->where('is_active', true)
    ->first();

if ($activeConfig) {
    echo "✅ Active configuration:\n";
    echo "  UUID: {$activeConfig->uuid}\n";
    echo "  Name: {$activeConfig->name}\n";
    echo "  Title: " . ($activeConfig->form_schema['title'] ?? 'N/A') . "\n";
    echo "  Fields: " . (isset($activeConfig->form_schema['fields']) ? count($activeConfig->form_schema['fields']) : 0) . "\n";
    echo "  Version: {$activeConfig->version}\n";
} else {
    echo "❌ No active configuration found!\n";
}

echo "\n✅ Verification complete\n";
