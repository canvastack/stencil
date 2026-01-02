<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\TenantHeaderConfig;

echo "=== SIMULATING API CALL TO GET HEADER CONFIG ===" . PHP_EOL . PHP_EOL;

// Get tenant
$tenant = DB::table('tenants')->first();
echo "Tenant: {$tenant->name} (ID: {$tenant->id})" . PHP_EOL . PHP_EOL;

// Set the current tenant context (simulating middleware)
config(['database.default_tenant_id' => $tenant->id]);

// Simulate the API call
try {
    // This is what the controller does
    $config = TenantHeaderConfig::where('tenant_id', $tenant->id)
        ->where('is_active', true)
        ->first();
    
    if (!$config) {
        echo "✗ NO ACTIVE HEADER CONFIG FOUND" . PHP_EOL;
        exit;
    }
    
    echo "✓ Config retrieved from Model" . PHP_EOL . PHP_EOL;
    
    // This is what gets returned
    $response = [
        'success' => true,
        'data' => [
            'uuid' => $config->uuid,
            'brand_name' => $config->brand_name,
            'brand_initials' => $config->brand_initials,
            'brand_tagline' => $config->brand_tagline,
            'logo_url' => $config->logo_url,
            'logo_dark_url' => $config->logo_dark_url,
            'logo_width' => $config->logo_width,
            'logo_height' => $config->logo_height,
            'logo_alt_text' => $config->logo_alt_text,
            'use_logo' => $config->use_logo,
            'header_style' => $config->header_style,
            'show_cart' => $config->show_cart,
            'show_search' => $config->show_search,
            'show_login' => $config->show_login,
            'sticky_header' => $config->sticky_header,
            'transparent_on_scroll' => $config->transparent_on_scroll,
            'styling_options' => $config->styling_options,
            'login_button_text' => $config->login_button_text,
            'cart_button_text' => $config->cart_button_text,
            'search_placeholder' => $config->search_placeholder,
            'is_active' => $config->is_active,
            'notes' => $config->notes,
        ],
        'message' => 'Header configuration retrieved successfully'
    ];
    
    echo "API Response Structure:" . PHP_EOL;
    echo json_encode($response, JSON_PRETTY_PRINT) . PHP_EOL;
    
} catch (\Exception $e) {
    echo "✗ ERROR: " . $e->getMessage() . PHP_EOL;
}
