<?php

$url = "http://localhost:8000/api/v1/public/products/slug/designer-clear-plaque";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: {$httpCode}\n\n";

if ($httpCode === 200) {
    $data = json_decode($response, true);
    if (isset($data['data'])) {
        $product = $data['data'];
        echo "Product ID: " . ($product['id'] ?? 'N/A') . "\n";
        echo "Product UUID: " . ($product['uuid'] ?? 'N/A') . "\n";
        echo "Product Name: " . ($product['name'] ?? 'N/A') . "\n";
        echo "Product Slug: " . ($product['slug'] ?? 'N/A') . "\n";
    } else {
        echo "No data field in response\n";
        echo substr($response, 0, 500) . "\n";
    }
} else {
    echo "Error: HTTP $httpCode\n";
    echo substr($response, 0, 500) . "\n";
}
