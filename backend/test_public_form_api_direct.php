<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductFormConfiguration;
use App\Infrastructure\Persistence\Eloquent\Models\Product;

$productUuid = '307815d4-e587-4b95-aa57-a40325326956';

echo "Testing Public Form Configuration API\n";
echo "======================================\n\n";

// Simulate what the public API does
$product = Product::where('uuid', $productUuid)
    ->where('status', 'published')
    ->first();

if (!$product) {
    echo "❌ Product not found or not published\n";
    exit(1);
}

echo "✅ Product found: {$product->name}\n";
echo "   Product ID: {$product->id}\n";
echo "   Status: {$product->status}\n\n";

$configuration = ProductFormConfiguration::where('product_id', $product->id)
    ->where('is_active', true)
    ->first();

if (!$configuration) {
    echo "❌ No active configuration found\n";
    exit(1);
}

echo "✅ Active configuration found:\n";
echo "   UUID: {$configuration->uuid}\n";
echo "   Name: {$configuration->name}\n";
echo "   Form Title: " . ($configuration->form_schema['title'] ?? 'N/A') . "\n";
echo "   Field Count: " . (isset($configuration->form_schema['fields']) ? count($configuration->form_schema['fields']) : 0) . "\n";
echo "   Has Template: " . ($configuration->template_id ? "YES (ID: {$configuration->template_id})" : 'NO') . "\n";
echo "   Version: {$configuration->version}\n";
echo "   Updated: {$configuration->updated_at}\n\n";

// Show field names
if (isset($configuration->form_schema['fields'])) {
    echo "📋 Form Fields:\n";
    foreach ($configuration->form_schema['fields'] as $index => $field) {
        $order = $field['order'] ?? ($index + 1);
        echo "   {$order}. {$field['label']} ({$field['name']}) - {$field['type']}\n";
    }
}

echo "\n✅ This is what the public API should return!\n";
