<?php

namespace App\Observers;

use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;

class ProductObserver
{
    /**
     * Handle the Product "saving" event.
     * Auto-inherit business_type from category before saving.
     */
    public function saving(Product $product): void
    {
        if ($product->category_id && !$product->business_type) {
            $category = ProductCategory::find($product->category_id);
            if ($category && $category->business_type) {
                $product->business_type = $category->business_type;
            }
        }
    }

    /**
     * Handle the Product "created" event.
     */
    public function created(Product $product): void
    {
        //
    }

    /**
     * Handle the Product "updated" event.
     */
    public function updated(Product $product): void
    {
        //
    }

    /**
     * Handle the Product "deleted" event.
     */
    public function deleted(Product $product): void
    {
        //
    }

    /**
     * Handle the Product "restored" event.
     */
    public function restored(Product $product): void
    {
        //
    }

    /**
     * Handle the Product "force deleted" event.
     */
    public function forceDeleted(Product $product): void
    {
        //
    }
}
