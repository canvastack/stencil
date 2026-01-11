<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Check if products page exists
$page = DB::table('tenant_pages')
    ->where('slug', 'products')
    ->select('uuid', 'tenant_id', 'slug', 'status', 'title')
    ->first();

if ($page) {
    echo "✅ Products page found in database:\n";
    echo "   UUID: " . $page->uuid . "\n";
    echo "   Tenant ID: " . $page->tenant_id . "\n";
    echo "   Slug: " . $page->slug . "\n";
    echo "   Status: " . $page->status . "\n";
    echo "   Title: " . $page->title . "\n";
    
    // Get tenant info
    $tenant = DB::table('tenants')->where('id', $page->tenant_id)->first();
    if ($tenant) {
        echo "   Tenant Slug: " . $tenant->slug . "\n";
    }
} else {
    echo "❌ Products page NOT found in database\n";
}

// Test the API endpoint
echo "\n📡 Testing API endpoint...\n";
$request = Illuminate\Http\Request::create(
    '/api/v1/public/content/pages/etchinx/products',
    'GET',
    [],
    [],
    [],
    ['HTTP_ACCEPT' => 'application/json']
);

try {
    $response = $app->handle($request);
    echo "Status: " . $response->getStatusCode() . "\n";
    
    if ($response->getStatusCode() === 200) {
        echo "✅ API Response: SUCCESS\n";
        $data = json_decode($response->getContent(), true);
        echo "   Page Slug: " . ($data['pageSlug'] ?? 'N/A') . "\n";
        echo "   Status: " . ($data['status'] ?? 'N/A') . "\n";
    } else {
        echo "❌ API Response: ERROR\n";
        echo $response->getContent() . "\n";
    }
} catch (Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
}
