<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant as TenantModel;
use Illuminate\Support\Facades\DB;

$etchinx = TenantModel::where('slug', 'etchinx')->first();

echo "========================================\n";
echo "RATING FILTER ANALYSIS\n";
echo "========================================\n\n";

// Check if customer_reviews table exists and has data
echo "1. CUSTOMER REVIEWS DATA:\n";
echo "----------------------------------------\n";
try {
    $reviewCount = DB::table('customer_reviews')->count();
    echo "Total reviews in database: $reviewCount\n";
    
    if ($reviewCount > 0) {
        $reviewsWithProducts = DB::table('customer_reviews')
            ->whereNotNull('product_id')
            ->count();
        echo "Reviews with product_id: $reviewsWithProducts\n";
        
        // Sample reviews
        $samples = DB::table('customer_reviews')
            ->limit(5)
            ->get(['id', 'product_id', 'rating', 'created_at']);
        
        echo "\nSample reviews:\n";
        foreach ($samples as $review) {
            echo "  - Review #{$review->id}: product_id={$review->product_id}, rating={$review->rating}\n";
        }
    }
} catch (\Exception $e) {
    echo "⚠️  Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Check products with ratings (using backend query logic)
echo "2. PRODUCTS WITH RATINGS (Backend Query):\n";
echo "----------------------------------------\n";

$productsWithRatings = Product::where('products.tenant_id', $etchinx->id)
    ->where('products.status', 'published')
    ->leftJoin('customer_reviews', 'products.id', '=', 'customer_reviews.product_id')
    ->selectRaw('products.id, products.name, COALESCE(AVG(customer_reviews.rating), 0) as avg_rating, COUNT(customer_reviews.id) as review_count')
    ->groupBy('products.id', 'products.name')
    ->havingRaw('COUNT(customer_reviews.id) > 0')
    ->orderBy('avg_rating', 'desc')
    ->limit(10)
    ->get();

if ($productsWithRatings->count() > 0) {
    echo "Products with reviews:\n";
    foreach ($productsWithRatings as $p) {
        echo "  - {$p->name}: {$p->avg_rating} stars ({$p->review_count} reviews)\n";
    }
} else {
    echo "⚠️  NO PRODUCTS HAVE REVIEWS!\n";
}

echo "\n";

// Test rating filter queries
echo "3. TEST RATING FILTER QUERIES:\n";
echo "----------------------------------------\n";

$minRatings = [1, 2, 3, 4, 5];

foreach ($minRatings as $minRating) {
    $count = Product::where('products.tenant_id', $etchinx->id)
        ->where('products.status', 'published')
        ->leftJoin('customer_reviews', 'products.id', '=', 'customer_reviews.product_id')
        ->selectRaw('products.*, COALESCE(AVG(customer_reviews.rating), 0) as avg_rating')
        ->groupBy('products.id')
        ->havingRaw('COALESCE(AVG(customer_reviews.rating), 0) >= ?', [$minRating])
        ->count();
    
    echo "  - Minimum {$minRating} stars: $count products\n";
}

echo "\n";

// Check if products have ratings in metadata or other fields
echo "4. CHECK ALTERNATIVE RATING FIELDS:\n";
echo "----------------------------------------\n";

$withMetadata = Product::where('tenant_id', $etchinx->id)
    ->where('status', 'published')
    ->whereNotNull('metadata')
    ->whereRaw("metadata::text != '{}'")
    ->limit(3)
    ->get(['name', 'metadata']);

if ($withMetadata->count() > 0) {
    echo "Sample products with metadata:\n";
    foreach ($withMetadata as $p) {
        echo "  - {$p->name}: " . json_encode($p->metadata) . "\n";
    }
} else {
    echo "No products have metadata\n";
}

echo "\n========================================\n";
echo "CONCLUSION:\n";
if ($reviewCount == 0) {
    echo "⚠️  Rating filter returns 0 because:\n";
    echo "   NO CUSTOMER REVIEWS EXIST in database!\n";
    echo "\n";
    echo "Solution: Seed customer_reviews table with sample data\n";
}
echo "========================================\n";
