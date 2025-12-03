<?php

namespace App\Domain\Order\Listeners;

use App\Domain\Order\Events\ProductionCompleted;
use Illuminate\Support\Facades\Log;

class UpdateInventoryOnOrderComplete
{
    public function handle(ProductionCompleted $event): void
    {
        try {
            $order = $event->order;
            
            $items = $order->items;
            if (!$items || (is_array($items) && empty($items)) || (is_object($items) && $items->isEmpty())) {
                Log::info("No items to process inventory for order completion", [
                    'order_id' => $order->id,
                ]);
                return;
            }

            foreach ($order->items as $item) {
                if (!$item->product_id) {
                    Log::warning("Order item missing product_id", [
                        'order_id' => $order->id,
                        'item_id' => $item->id,
                    ]);
                    continue;
                }

                $product = $item->product;
                if ($product) {
                    $product->increment('sold_quantity', $item->quantity);
                    
                    Log::info("Product inventory updated on order completion", [
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'quantity_sold' => $item->quantity,
                    ]);
                }
            }

            Log::info("Order completion inventory update completed", [
                'order_id' => $order->id,
                'items_count' => $order->items->count(),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to update inventory on order completion", [
                'order_id' => $event->order->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
