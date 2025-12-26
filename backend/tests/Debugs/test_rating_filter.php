<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Infrastructure\Persistence\Eloquent\Models\Product;

echo "=== Testing Rating Filter Query ===\n\n";

// Test 1: Count total published products
$totalProducts = Product::where('status', 'published')->count();
echo "Total published products: $totalProducts\n";

// Test 2: Count products with reviews
$productsWithReviews = Product::select(['products.*', \DB::raw('COALESCE(AVG(customer_reviews.rating), 0) as average_rating')])
    ->leftJoin('customer_reviews', function($join) {
        $join->on('customer_reviews.product_id', '=', 'products.id')
             ->where('customer_reviews.is_approved', '=', true);
    })
    ->where('products.status', 'published')
    ->groupBy('products.id')
    ->havingRaw('COALESCE(AVG(customer_reviews.rating), 0) > ?', [0])
    ->count();
echo "Products with reviews: $productsWithReviews\n";

// Test 3: Test rating filter >= 4
$productsRating4Plus = Product::select(['products.*', \DB::raw('COALESCE(AVG(customer_reviews.rating), 0) as average_rating')])
    ->leftJoin('customer_reviews', function($join) {
        $join->on('customer_reviews.product_id', '=', 'products.id')
             ->where('customer_reviews.is_approved', '=', true);
    })
    ->where('products.status', 'published')
    ->groupBy('products.id')
    ->havingRaw('COALESCE(AVG(customer_reviews.rating), 0) >= ?', [4])
    ->count();
echo "Products with rating >= 4: $productsRating4Plus\n";

// Test 4: Show actual SQL query
$query = Product::select(['products.*', \DB::raw('COALESCE(AVG(customer_reviews.rating), 0) as average_rating')])
    ->leftJoin('customer_reviews', function($join) {
        $join->on('customer_reviews.product_id', '=', 'products.id')
             ->where('customer_reviews.is_approved', '=', true);
    })
    ->where('products.status', 'published')
    ->groupBy('products.id')
    ->havingRaw('COALESCE(AVG(customer_reviews.rating), 0) >= ?', [4]);

echo "\nSQL Query:\n";
echo $query->toSql() . "\n";
echo "Bindings: " . json_encode($query->getBindings()) . "\n";

// Test 5: Show sample products with ratings
echo "\n=== Sample Products with Ratings ===\n";
$samples = Product::select(['products.name', 'products.uuid', \DB::raw('COALESCE(AVG(customer_reviews.rating), 0) as average_rating')])
    ->leftJoin('customer_reviews', function($join) {
        $join->on('customer_reviews.product_id', '=', 'products.id')
             ->where('customer_reviews.is_approved', '=', true);
    })
    ->where('products.status', 'published')
    ->groupBy('products.id', 'products.name', 'products.uuid')
    ->orderBy('average_rating', 'desc')
    ->limit(10)
    ->get();

foreach ($samples as $sample) {
    echo sprintf("- %s (UUID: %s) - Rating: %.2f\n", $sample->name, $sample->uuid, $sample->average_rating);
}

echo "\n=== Test Complete ===\n";
