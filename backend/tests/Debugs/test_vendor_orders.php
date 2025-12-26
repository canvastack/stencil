<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Infrastructure\Persistence\Eloquent\Models\VendorOrder;

$count = VendorOrder::count();
echo "Total vendor_orders: $count\n";

// Check delivery status distribution
$onTime = VendorOrder::where('delivery_status', 'on_time')->count();
$early = VendorOrder::where('delivery_status', 'early')->count();
$late = VendorOrder::where('delivery_status', 'late')->count();

echo "\nDelivery Status Distribution:\n";
echo "- On Time: $onTime\n";
echo "- Early: $early\n";
echo "- Late: $late\n";

// Check quality rating distribution
$excellent = VendorOrder::where('quality_rating', '>=', 4.5)->count();
$good = VendorOrder::whereBetween('quality_rating', [4.0, 4.49])->count();
$average = VendorOrder::whereBetween('quality_rating', [3.5, 3.99])->count();
$poor = VendorOrder::where('quality_rating', '<', 3.5)->count();

echo "\nQuality Rating Distribution:\n";
echo "- Excellent (4.5+): $excellent\n";
echo "- Good (4.0-4.4): $good\n";
echo "- Average (3.5-3.9): $average\n";
echo "- Poor (<3.5): $poor\n";
