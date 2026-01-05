<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductFormConfiguration;
use App\Infrastructure\Persistence\Eloquent\Models\Product;

$productUuid = '307815d4-e587-4b95-aa57-a40325326956';

echo "🧪 Simulating API Endpoint Logic...\n\n";

// This is exactly what ProductFormController::show() does
$product = Product::where('uuid', $productUuid)
    ->where('status', 'published')
    ->first();

if (!$product) {
    echo "❌ Product not found!\n";
    exit(1);
}

echo "✅ Product found: {$product->name}\n\n";

$configuration = ProductFormConfiguration::where('product_id', $product->id)
    ->where('is_active', true)
    ->first();

if (!$configuration) {
    echo "❌ No active configuration found!\n";
    exit(1);
}

echo "✅ Active configuration found:\n";
echo "  UUID: {$configuration->uuid}\n";
echo "  Name: {$configuration->name}\n";
echo "  Version: {$configuration->version}\n\n";

$formConfig = [
    'product_uuid' => $product->uuid,
    'product_name' => $product->name,
    'form_schema' => $configuration->form_schema,
    'conditional_logic' => $configuration->conditional_logic,
    'version' => $configuration->version,
];

echo "📦 API Response would be:\n";
echo json_encode([
    'data' => $formConfig
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

echo "\n\n";
echo "Form Title: " . ($formConfig['form_schema']['title'] ?? 'N/A') . "\n";
echo "Field Count: " . (isset($formConfig['form_schema']['fields']) ? count($formConfig['form_schema']['fields']) : 0) . "\n";
