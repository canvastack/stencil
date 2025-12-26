<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant as TenantModel;

$etchinx = TenantModel::where('slug', 'etchinx')->first();

echo "Testing Size Filter Queries:\n";
echo "========================================\n";

$sizes = ['small', 'medium', 'large', 'custom'];

foreach ($sizes as $size) {
    // Test exact size match
    $exactCount = Product::where('tenant_id', $etchinx->id)
        ->where('status', 'published')
        ->where('size', $size)
        ->count();
    
    // Test available_sizes JSON contains
    $jsonCount = Product::where('tenant_id', $etchinx->id)
        ->where('status', 'published')
        ->whereJsonContains('available_sizes', $size)
        ->count();
    
    // Test combined (same as backend controller)
    $combinedCount = Product::where('tenant_id', $etchinx->id)
        ->where('status', 'published')
        ->where(function ($q) use ($size) {
            $q->where('size', $size)
              ->orWhereJsonContains('available_sizes', $size);
        })
        ->count();
    
    echo "\nSize: $size\n";
    echo "  - Exact match (size column): $exactCount\n";
    echo "  - JSON contains (available_sizes): $jsonCount\n";
    echo "  - Combined (backend filter): $combinedCount\n";
}

echo "\n========================================\n";

// Sample products with available_sizes
echo "\nSample Products (first 3):\n";
$samples = Product::where('tenant_id', $etchinx->id)
    ->where('status', 'published')
    ->limit(3)
    ->get(['name', 'size', 'available_sizes', 'business_type']);

foreach ($samples as $p) {
    echo "\n{$p->name}:\n";
    echo "  size: {$p->size}\n";
    echo "  available_sizes: " . json_encode($p->available_sizes) . "\n";
    echo "  business_type: {$p->business_type}\n";
}

echo "\n========================================\n";
