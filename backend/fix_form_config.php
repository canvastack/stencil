<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductFormConfiguration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

$productUuid = '307815d4-e587-4b95-aa57-a40325326956';

echo "🔧 Fixing Form Configuration...\n\n";

DB::transaction(function () use ($productUuid) {
    $product = \App\Infrastructure\Persistence\Eloquent\Models\Product::where('uuid', $productUuid)->first();
    
    if (!$product) {
        echo "❌ Product not found!\n";
        return;
    }
    
    echo "Product: {$product->name}\n";
    echo "Product ID: {$product->id}\n\n";
    
    // Get all configs
    $configs = ProductFormConfiguration::where('product_id', $product->id)
        ->orderBy('updated_at', 'desc')
        ->get();
    
    echo "Total configs found: {$configs->count()}\n\n";
    
    if ($configs->count() === 0) {
        echo "❌ No configs found!\n";
        return;
    }
    
    // Keep only the latest one
    $latestConfig = $configs->first();
    echo "✅ Keeping latest config:\n";
    echo "   UUID: {$latestConfig->uuid}\n";
    echo "   Name: {$latestConfig->name}\n";
    echo "   Title: " . ($latestConfig->form_schema['title'] ?? 'N/A') . "\n";
    echo "   Fields: " . (isset($latestConfig->form_schema['fields']) ? count($latestConfig->form_schema['fields']) : 0) . "\n";
    echo "   Version: {$latestConfig->version}\n";
    echo "   Updated: {$latestConfig->updated_at}\n\n";
    
    // Make sure it's active
    $latestConfig->update(['is_active' => true]);
    
    // Delete all old configs
    $oldConfigs = $configs->slice(1);
    if ($oldConfigs->count() > 0) {
        echo "🗑️  Deleting {$oldConfigs->count()} old configs:\n";
        foreach ($oldConfigs as $old) {
            echo "   - {$old->uuid} ({$old->name})\n";
            $old->delete();
        }
        echo "\n";
    }
    
    echo "✅ Cleanup completed!\n\n";
});

// Clear cache
echo "🔥 Clearing cache...\n";
Cache::forget("product_form_config:{$productUuid}");
Cache::forget("public:product_form_config:{$productUuid}");
Cache::flush();
echo "✅ Cache cleared!\n\n";

// Verify
echo "🔍 Verifying...\n";
$product = \App\Infrastructure\Persistence\Eloquent\Models\Product::where('uuid', $productUuid)->first();
$config = ProductFormConfiguration::where('product_id', $product->id)->where('is_active', true)->first();

if ($config) {
    echo "✅ Active config after cleanup:\n";
    echo "   Title: " . ($config->form_schema['title'] ?? 'N/A') . "\n";
    echo "   Fields: " . (isset($config->form_schema['fields']) ? count($config->form_schema['fields']) : 0) . "\n";
} else {
    echo "❌ No active config found!\n";
}
