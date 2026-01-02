<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== CHECKING HEADER CONFIG IN DATABASE ===" . PHP_EOL . PHP_EOL;

// Get tenant
$tenant = DB::table('tenants')->first();
echo "Tenant: {$tenant->name} (ID: {$tenant->id})" . PHP_EOL . PHP_EOL;

// Get header config
$header = DB::table('tenant_header_configs')
    ->where('tenant_id', $tenant->id)
    ->first();

if ($header) {
    echo "✓ Header Config Found:" . PHP_EOL;
    echo "  - UUID: {$header->uuid}" . PHP_EOL;
    echo "  - Brand Name: {$header->brand_name}" . PHP_EOL;
    echo "  - Brand Initials: " . ($header->brand_initials ?? 'NULL') . PHP_EOL;
    echo "  - Brand Tagline: " . ($header->brand_tagline ?? 'NULL') . PHP_EOL;
    echo "  - Logo URL: " . ($header->logo_url ?? 'NULL') . PHP_EOL;
    echo "  - Header Style: {$header->header_style}" . PHP_EOL;
    echo "  - Is Active: " . ($header->is_active ? 'Yes' : 'No') . PHP_EOL;
    echo PHP_EOL;
    echo "Full styling_options JSON:" . PHP_EOL;
    echo $header->styling_options . PHP_EOL;
} else {
    echo "✗ NO HEADER CONFIG FOUND FOR THIS TENANT" . PHP_EOL;
}
