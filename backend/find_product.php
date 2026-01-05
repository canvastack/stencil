<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Models\ProductFormConfiguration;

echo "🔍 Finding products with form configurations...\n\n";

$product = Product::whereHas('formConfiguration', function ($query) {
    $query->where('is_active', true);
})
->with('formConfiguration')
->first();

if (!$product) {
    echo "❌ No products found with active form configurations\n";
    exit(1);
}

echo "✅ Product found:\n";
echo "   - ID: {$product->id}\n";
echo "   - UUID: {$product->uuid}\n";
echo "   - Name: {$product->name}\n";
echo "   - Slug: {$product->slug}\n";
echo "   - Tenant ID: {$product->tenant_id}\n\n";

$config = $product->formConfiguration;
echo "✅ Form Configuration:\n";
echo "   - Config ID: {$config->id}\n";
echo "   - Tenant ID: {$config->tenant_id} (type: " . gettype($config->tenant_id) . ")\n";
echo "   - Active: " . ($config->is_active ? 'YES' : 'NO') . "\n";
echo "   - Form Fields: " . (isset($config->form_schema['fields']) ? count($config->form_schema['fields']) : 0) . "\n\n";

echo "✅ Product URL: http://localhost:5173/etchinx/products/{$product->slug}\n";
