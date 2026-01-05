<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Models\ProductFormConfiguration;

echo "=== FIXING DRAFT PRODUCTS WITH FORM CONFIGURATIONS ===\n\n";

// Find all draft products that have form configurations
$draftProducts = Product::where('status', 'draft')
    ->whereHas('formConfiguration')
    ->get();

echo "Found {$draftProducts->count()} draft products with form configurations\n\n";

$updated = 0;
foreach ($draftProducts as $product) {
    echo "Updating: {$product->name} (UUID: {$product->uuid})\n";
    $product->status = 'published';
    $product->published_at = now();
    $product->save();
    $updated++;
}

echo "\n✅ Updated {$updated} products to 'published' status\n";

// Specifically check Designer Clear Plaque
echo "\n=== VERIFYING DESIGNER CLEAR PLAQUE ===\n";
$designerPlaque = Product::where('uuid', 'bd3e38b8-2908-4e91-ba35-384403eaaa36')->first();
if ($designerPlaque) {
    echo "Name: {$designerPlaque->name}\n";
    echo "Status: {$designerPlaque->status}\n";
    echo "Published at: {$designerPlaque->published_at}\n";
    
    $formConfig = ProductFormConfiguration::where('product_id', $designerPlaque->id)
        ->where('is_active', true)
        ->first();
    
    if ($formConfig) {
        echo "✅ Has active form configuration\n";
        echo "   Fields count: " . (isset($formConfig->form_schema['fields']) ? count($formConfig->form_schema['fields']) : 0) . "\n";
    }
}

echo "\nDONE!\n";
