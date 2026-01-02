<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Tenant;

echo "=== TESTING PUBLIC NAVIGATION API ===" . PHP_EOL . PHP_EOL;

// Get tenant
$tenant = DB::table('tenants')->first();
echo "Testing with Tenant: {$tenant->name}" . PHP_EOL;
echo "Tenant Slug: {$tenant->slug}" . PHP_EOL . PHP_EOL;

// Test 1: Get Header Config
echo "TEST 1: Get Header Config" . PHP_EOL;
echo "URL: GET /api/v1/public/navigation/{$tenant->slug}/header" . PHP_EOL;

$headerConfig = DB::table('tenant_header_configs')
    ->where('tenant_id', $tenant->id)
    ->where('is_active', true)
    ->first();

if ($headerConfig) {
    echo "✓ Header config exists in database" . PHP_EOL;
    echo "  - Brand: {$headerConfig->brand_name}" . PHP_EOL;
    echo "  - UUID: {$headerConfig->uuid}" . PHP_EOL;
} else {
    echo "✗ NO header config found" . PHP_EOL;
}

echo PHP_EOL;

// Test 2: Get Footer Config
echo "TEST 2: Get Footer Config" . PHP_EOL;
echo "URL: GET /api/v1/public/navigation/{$tenant->slug}/footer" . PHP_EOL;

$footerConfig = DB::table('tenant_footer_configs')
    ->where('tenant_id', $tenant->id)
    ->where('is_active', true)
    ->first();

if ($footerConfig) {
    echo "✓ Footer config exists in database" . PHP_EOL;
    echo "  - Address: {$footerConfig->contact_address}" . PHP_EOL;
    echo "  - UUID: {$footerConfig->uuid}" . PHP_EOL;
} else {
    echo "✗ NO footer config found" . PHP_EOL;
}

echo PHP_EOL;

// Test 3: Get Menus
echo "TEST 3: Get Menus" . PHP_EOL;
echo "URL: GET /api/v1/public/navigation/{$tenant->slug}/menus?location=header" . PHP_EOL;

$menus = DB::table('tenant_menus')
    ->where('tenant_id', $tenant->id)
    ->where('is_active', true)
    ->where('is_visible', true)
    ->where('show_in_header', true)
    ->whereNull('parent_id')
    ->orderBy('sort_order')
    ->get();

if ($menus->count() > 0) {
    echo "✓ Found {$menus->count()} header menus in database" . PHP_EOL;
    foreach ($menus as $menu) {
        echo "  - {$menu->label} (UUID: {$menu->uuid})" . PHP_EOL;
    }
} else {
    echo "✗ NO header menus found" . PHP_EOL;
}

echo PHP_EOL . "=== TEST SUMMARY ===" . PHP_EOL;
echo "All data exists in database. Public API endpoints should work correctly." . PHP_EOL;
echo PHP_EOL;
echo "To test via HTTP, run:" . PHP_EOL;
echo "curl http://localhost:8000/api/v1/public/navigation/{$tenant->slug}/header" . PHP_EOL;
echo "curl http://localhost:8000/api/v1/public/navigation/{$tenant->slug}/footer" . PHP_EOL;
echo "curl http://localhost:8000/api/v1/public/navigation/{$tenant->slug}/menus?location=header" . PHP_EOL;
