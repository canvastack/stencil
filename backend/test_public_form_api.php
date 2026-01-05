<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

echo "=== TESTING PUBLIC FORM API FOR DESIGNER CLEAR PLAQUE ===\n\n";

$productUuid = 'bd3e38b8-2908-4e91-ba35-384403eaaa36';

// Test using cURL to mimic frontend request
$url = "http://localhost:8000/api/v1/public/products/{$productUuid}/form-configuration";

echo "Testing URL: {$url}\n";
echo "---\n\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status Code: {$httpCode}\n";
echo "Response:\n";
echo json_encode(json_decode($response, true), JSON_PRETTY_PRINT) . "\n";

if ($httpCode === 200) {
    $data = json_decode($response, true);
    if (isset($data['data'])) {
        echo "\n✅ SUCCESS!\n";
        echo "Product UUID: " . ($data['data']['product_uuid'] ?? 'N/A') . "\n";
        echo "Product Name: " . ($data['data']['product_name'] ?? 'N/A') . "\n";
        echo "Form Fields: " . (isset($data['data']['form_schema']['fields']) ? count($data['data']['form_schema']['fields']) : 0) . "\n";
    }
} else {
    echo "\n❌ FAILED!\n";
}

echo "\n=== TESTING ALTERNATIVE SLUG-BASED SEARCH ===\n\n";

// Also test if product is accessible by slug
$slugUrl = "http://localhost:8000/api/v1/public/etchinx/products/slug/designer-clear-plaque-a5jl";
echo "Testing URL: {$slugUrl}\n\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $slugUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status Code: {$httpCode}\n";

if ($httpCode === 200) {
    $data = json_decode($response, true);
    echo "✅ Product found via slug\n";
    echo "UUID: " . ($data['data']['uuid'] ?? $data['uuid'] ?? 'N/A') . "\n";
} else {
    echo "❌ Product NOT found via slug\n";
    echo "Response: " . substr($response, 0, 200) . "\n";
}

echo "\nDONE!\n";
