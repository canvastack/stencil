<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Checking Customer Reviews Data ===\n\n";

// Check if customer_reviews table exists
try {
    $reviewsCount = \DB::table('customer_reviews')->count();
    echo "Total customer_reviews records: $reviewsCount\n";
    
    if ($reviewsCount > 0) {
        // Show sample reviews
        echo "\n=== Sample Reviews (First 10) ===\n";
        $samples = \DB::table('customer_reviews')
            ->select('id', 'product_id', 'rating', 'is_approved', 'created_at')
            ->orderBy('id', 'desc')
            ->limit(10)
            ->get();
        
        foreach ($samples as $review) {
            echo sprintf(
                "ID: %d | Product ID: %d | Rating: %.1f | Approved: %s | Created: %s\n",
                $review->id,
                $review->product_id,
                $review->rating,
                $review->is_approved ? 'YES' : 'NO',
                $review->created_at
            );
        }
        
        // Count approved vs unapproved
        $approvedCount = \DB::table('customer_reviews')->where('is_approved', true)->count();
        $unapprovedCount = \DB::table('customer_reviews')->where('is_approved', false)->count();
        
        echo "\nApproved reviews: $approvedCount\n";
        echo "Unapproved reviews: $unapprovedCount\n";
        
        // Check if product_ids match existing products
        echo "\n=== Checking Product ID Links ===\n";
        $orphanedReviews = \DB::table('customer_reviews as cr')
            ->leftJoin('products as p', 'cr.product_id', '=', 'p.id')
            ->whereNull('p.id')
            ->count();
        
        echo "Orphaned reviews (product_id not found in products table): $orphanedReviews\n";
        
        if ($orphanedReviews > 0) {
            echo "⚠️  WARNING: Some reviews point to non-existent products!\n";
        }
        
        // Show products that SHOULD have reviews
        echo "\n=== Products with Reviews Count ===\n";
        $productsWithReviews = \DB::table('products as p')
            ->select('p.id', 'p.name', \DB::raw('COUNT(cr.id) as review_count'))
            ->leftJoin('customer_reviews as cr', function($join) {
                $join->on('cr.product_id', '=', 'p.id')
                     ->where('cr.is_approved', '=', true);
            })
            ->where('p.status', 'published')
            ->groupBy('p.id', 'p.name')
            ->having(\DB::raw('COUNT(cr.id)'), '>', 0)
            ->orderBy('review_count', 'desc')
            ->limit(10)
            ->get();
        
        if ($productsWithReviews->count() > 0) {
            foreach ($productsWithReviews as $product) {
                echo sprintf("- %s (ID: %d) - %d reviews\n", $product->name, $product->id, $product->review_count);
            }
        } else {
            echo "❌ NO PRODUCTS FOUND WITH REVIEWS!\n";
        }
        
    } else {
        echo "❌ No customer reviews found in database!\n";
        echo "👉 Run: php artisan db:seed --class=CustomerReviewSeeder\n";
    }
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "👉 Table customer_reviews may not exist!\n";
}

echo "\n=== Check Complete ===\n";
