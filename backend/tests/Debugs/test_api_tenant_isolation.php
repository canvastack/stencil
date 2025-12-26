<?php

echo "=== TESTING API TENANT ISOLATION ===" . PHP_EOL . PHP_EOL;

function testApi($url, $description) {
    echo "Testing: {$description}" . PHP_EOL;
    echo "URL: {$url}" . PHP_EOL;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo "❌ CURL Error: {$error}" . PHP_EOL . PHP_EOL;
        return null;
    }
    
    echo "HTTP Status: {$httpCode}" . PHP_EOL;
    
    if ($httpCode !== 200) {
        echo "Response: " . substr($response, 0, 500) . PHP_EOL . PHP_EOL;
        return null;
    }
    
    $data = json_decode($response, true);
    
    if (!$data) {
        echo "❌ Failed to decode JSON" . PHP_EOL . PHP_EOL;
        return null;
    }
    
    $productCount = isset($data['data']) ? count($data['data']) : 0;
    $total = $data['total'] ?? 'N/A';
    
    echo "Products returned: {$productCount}" . PHP_EOL;
    echo "Total available: {$total}" . PHP_EOL;
    
    if ($productCount > 0) {
        echo "Sample products:" . PHP_EOL;
        foreach (array_slice($data['data'], 0, 3) as $product) {
            $uuid = $product['uuid'] ?? 'NO UUID';
            $name = $product['name'] ?? 'NO NAME';
            $tenantId = isset($product['tenant_id']) ? "tenant_id: {$product['tenant_id']}" : "✅ tenant_id hidden";
            $internalId = isset($product['id']) ? "id: {$product['id']}" : "✅ id hidden";
            
            echo "  - UUID: {$uuid} | Name: {$name} | {$tenantId} | {$internalId}" . PHP_EOL;
        }
    }
    
    echo PHP_EOL;
    return $data;
}

// Test 1: With etchinx tenant slug
$etchinxData = testApi(
    'http://localhost:8000/api/v1/public/etchinx/products?per_page=5',
    'API with etchinx tenant slug'
);

// Test 2: Without tenant slug (should return all products)
$allData = testApi(
    'http://localhost:8000/api/v1/public/products?per_page=5',
    'API without tenant slug (all products)'
);

// Test 3: With different tenant slug
$techstartData = testApi(
    'http://localhost:8000/api/v1/public/techstart-id/products?per_page=5',
    'API with techstart-id tenant slug'
);

// Test 4: With non-existent tenant slug
$fakeData = testApi(
    'http://localhost:8000/api/v1/public/fake-tenant-xyz/products?per_page=5',
    'API with non-existent tenant slug'
);

// Analysis
echo "=== ANALYSIS ===" . PHP_EOL;

if ($etchinxData && $techstartData) {
    $etchinxProducts = $etchinxData['data'] ?? [];
    $techstartProducts = $techstartData['data'] ?? [];
    
    // Check if any UUIDs overlap (they shouldn't!)
    $etchinxUuids = array_column($etchinxProducts, 'uuid');
    $techstartUuids = array_column($techstartProducts, 'uuid');
    $overlap = array_intersect($etchinxUuids, $techstartUuids);
    
    if (empty($overlap)) {
        echo "✅ TENANT ISOLATION CONFIRMED: No product overlap between etchinx and techstart-id" . PHP_EOL;
    } else {
        echo "❌ TENANT ISOLATION FAILED: Found " . count($overlap) . " overlapping products!" . PHP_EOL;
        echo "   Overlapping UUIDs: " . implode(', ', $overlap) . PHP_EOL;
    }
}

// Check if tenant_id or id is exposed in responses
$exposureCheck = true;
foreach ([$etchinxData, $allData, $techstartData] as $testData) {
    if ($testData && isset($testData['data'][0])) {
        $firstProduct = $testData['data'][0];
        if (isset($firstProduct['tenant_id'])) {
            echo "❌ SECURITY ISSUE: tenant_id is exposed in API response!" . PHP_EOL;
            $exposureCheck = false;
        }
        if (isset($firstProduct['id']) && is_numeric($firstProduct['id'])) {
            echo "❌ SECURITY ISSUE: Internal numeric id is exposed in API response!" . PHP_EOL;
            $exposureCheck = false;
        }
    }
}

if ($exposureCheck) {
    echo "✅ SECURITY CONFIRMED: No tenant_id or internal id exposed in responses" . PHP_EOL;
}

echo PHP_EOL . "=== END API TEST ===" . PHP_EOL;
