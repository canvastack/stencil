<?php

namespace Tests\Helpers;

use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;

/**
 * Helper trait for creating complete quote test data
 * that matches StoreQuoteRequest validation requirements
 */
trait QuoteTestDataHelper
{
    /**
     * Create complete quote data that passes validation
     */
    protected function createCompleteQuoteData(
        Order $order,
        Vendor $vendor,
        Customer $customer,
        ?Product $product = null,
        array $overrides = []
    ): array {
        // Create product if not provided
        if (!$product) {
            $product = Product::factory()->create([
                'tenant_id' => $order->tenant_id,
            ]);
        }

        $defaultData = [
            'order_id' => $order->uuid,
            'customer_id' => $customer->uuid,
            'vendor_id' => $vendor->uuid,
            'title' => 'Vendor Quote for Order ' . $order->order_number,
            'description' => 'Quote description for custom etching products',
            'valid_until' => now()->addDays(30)->toDateTimeString(),
            'terms_and_conditions' => 'Payment terms: Net 30 days. Delivery within 14 days.',
            'notes' => 'Please review and accept this quote',
            'initial_offer' => 1000.00,
            'items' => [
                [
                    'product_id' => $product->uuid,
                    'description' => $product->name ?? 'Custom Etching Product',
                    'quantity' => 1,
                    'unit_price' => 1000.00,
                    'vendor_cost' => 800.00,
                    'total_price' => 1000.00,
                    'specifications' => [
                        'material' => 'stainless_steel',
                        'finish' => 'brushed',
                    ],
                    'notes' => 'Standard specifications',
                ]
            ],
        ];

        return array_merge($defaultData, $overrides);
    }

    /**
     * Create minimal quote data (for testing validation failures)
     */
    protected function createMinimalQuoteData(Order $order, Vendor $vendor): array
    {
        return [
            'order_id' => $order->uuid,
            'vendor_id' => $vendor->uuid,
            'initial_offer' => 1000.00,
        ];
    }
}
