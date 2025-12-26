<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Http\Kernel');

// Simulate API request
$request = Illuminate\Http\Request::create(
    '/api/v1/public/etchinx/products?per_page=5',
    'GET'
);

$response = $kernel->handle($request);
$data = json_decode($response->getContent(), true);

echo "========================================\n";
echo "API RATING DATA TEST\n";
echo "========================================\n\n";

if (isset($data['data']) && is_array($data['data'])) {
    echo "Found " . count($data['data']) . " products\n\n";
    
    foreach (array_slice($data['data'], 0, 5) as $product) {
        echo "Product: {$product['name']}\n";
        echo "  - ID: {$product['id']}\n";
        
        // Check multiple rating field locations
        $avgRating = $product['averageRating'] ?? 
                     $product['average_rating'] ?? 
                     ($product['marketing']['averageRating'] ?? null) ??
                     ($product['reviewSummary']['averageRating'] ?? null) ??
                     'NOT FOUND';
        
        $reviewCount = $product['reviewCount'] ?? 
                       $product['review_count'] ?? 
                       ($product['marketing']['reviewCount'] ?? null) ??
                       ($product['reviewSummary']['reviewCount'] ?? null) ??
                       'NOT FOUND';
        
        echo "  - Average Rating: {$avgRating}\n";
        echo "  - Review Count: {$reviewCount}\n";
        
        // Show all keys for first product
        if ($product === $data['data'][0]) {
            echo "\n  Available keys in response:\n";
            echo "  - Top level: " . implode(', ', array_keys($product)) . "\n";
            
            if (isset($product['marketing'])) {
                echo "  - marketing: " . implode(', ', array_keys($product['marketing'])) . "\n";
            }
            
            if (isset($product['reviewSummary'])) {
                echo "  - reviewSummary: " . implode(', ', array_keys($product['reviewSummary'])) . "\n";
            }
        }
        
        echo "\n";
    }
} else {
    echo "Error: " . ($data['error'] ?? 'Unknown error') . "\n";
    echo "Response: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
}

echo "========================================\n";

$kernel->terminate($request, $response);
