<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Get the quote from database
$quote = DB::table('order_vendor_negotiations')
    ->where('uuid', '6445fc71-7526-4449-9573-f670b5d05ecd')
    ->first();

if (!$quote) {
    echo "Quote not found!\n";
    exit(1);
}

echo "=== DATABASE TERMS JSON ===\n";
$terms = json_decode($quote->terms, true);
echo json_encode($terms, JSON_PRETTY_PRINT) . "\n\n";

echo "=== ITEMS FROM TERMS ===\n";
if (isset($terms['items'])) {
    foreach ($terms['items'] as $index => $item) {
        echo "Item #" . ($index + 1) . ":\n";
        echo "  - product_id: " . ($item['product_id'] ?? 'null') . "\n";
        echo "  - description: " . ($item['description'] ?? 'null') . "\n";
        echo "  - quantity: " . ($item['quantity'] ?? 'null') . "\n";
        echo "  - unit_price: " . ($item['unit_price'] ?? 'null') . "\n";
        echo "  - vendor_cost: " . ($item['vendor_cost'] ?? 'null') . " ✅\n";
        echo "  - total_price: " . ($item['total_price'] ?? 'null') . "\n";
        echo "  - notes: " . ($item['notes'] ?? 'null') . " ✅\n";
        echo "\n";
    }
} else {
    echo "No items found in terms!\n";
}

echo "=== EXPECTED TRANSFORM OUTPUT ===\n";
$transformedItems = [];
if (!empty($terms['items']) && is_array($terms['items'])) {
    foreach ($terms['items'] as $item) {
        $transformedItems[] = [
            'id' => $item['id'] ?? null,
            'product_id' => $item['product_id'] ?? null,
            'description' => $item['description'] ?? '',
            'quantity' => $item['quantity'] ?? 1,
            'unit_price' => $item['unit_price'] ?? 0,
            'vendor_cost' => $item['vendor_cost'] ?? null,
            'total_price' => $item['total_price'] ?? 0,
            'specifications' => $item['specifications'] ?? [],
            'notes' => $item['notes'] ?? null,
            'product' => isset($item['product_id']) ? [
                'id' => $item['product_id'],
                'name' => $item['description'] ?? '',
                'sku' => $item['product_sku'] ?? null,
                'unit' => $item['unit'] ?? 'pcs',
            ] : null,
        ];
    }
}

echo json_encode(['items' => $transformedItems], JSON_PRETTY_PRINT) . "\n";
