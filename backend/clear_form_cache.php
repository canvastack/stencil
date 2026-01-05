<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Cache;

$productUuid = '307815d4-e587-4b95-aa57-a40325326956';

// Clear all possible cache keys
$cacheKeys = [
    "product_form_config:{$productUuid}",
    "public:product_form_config:{$productUuid}",
    "form_config:{$productUuid}",
];

echo "Clearing cache for product UUID: {$productUuid}\n\n";

foreach ($cacheKeys as $key) {
    if (Cache::forget($key)) {
        echo "✅ Cleared: {$key}\n";
    } else {
        echo "ℹ️  Not found or already cleared: {$key}\n";
    }
}

// Also flush all cache
echo "\n🔥 Flushing entire cache store...\n";
Cache::flush();
echo "✅ Cache flushed!\n";
