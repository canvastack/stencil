<?php

$baseUrl = 'http://localhost:8000/api/v1/public';

echo "=== Testing Rating Filter API Endpoint ===\n\n";

// Test 1: No filter (should return all published products)
$url1 = $baseUrl . '/products?per_page=5&status=published';
echo "Test 1: All products (no filter)\n";
echo "URL: $url1\n";
$response1 = file_get_contents($url1);
$data1 = json_decode($response1, true);
echo "Products returned: " . count($data1['data'] ?? []) . "\n";
echo "Total products: " . ($data1['meta']['total'] ?? 0) . "\n\n";

// Test 2: Rating filter >= 4
$url2 = $baseUrl . '/products?min_rating=4&per_page=5&status=published';
echo "Test 2: Products with rating >= 4\n";
echo "URL: $url2\n";
$response2 = file_get_contents($url2);
$data2 = json_decode($response2, true);
echo "Products returned: " . count($data2['data'] ?? []) . "\n";
echo "Total with rating >= 4: " . ($data2['meta']['total'] ?? 0) . "\n\n";

// Test 3: Rating filter >= 5
$url3 = $baseUrl . '/products?min_rating=5&per_page=5&status=published';
echo "Test 3: Products with rating = 5.0\n";
echo "URL: $url3\n";
$response3 = file_get_contents($url3);
$data3 = json_decode($response3, true);
echo "Products returned: " . count($data3['data'] ?? []) . "\n";
echo "Total with rating = 5.0: " . ($data3['meta']['total'] ?? 0) . "\n\n";

// Show sample product with rating
if (!empty($data2['data'])) {
    echo "=== Sample Product with Rating ===\n";
    $sample = $data2['data'][0];
    echo "Name: " . ($sample['name'] ?? 'N/A') . "\n";
    echo "UUID: " . ($sample['id'] ?? 'N/A') . "\n";
    echo "Average Rating: " . ($sample['reviewSummary']['averageRating'] ?? 0) . "\n";
    echo "Total Reviews: " . ($sample['reviewSummary']['totalReviews'] ?? 0) . "\n";
}

echo "\n=== Test Complete ===\n";
echo "✅ If you see products with ratings, the filter is working!\n";
