<?php

namespace App\Infrastructure\Presentation\Http\Requests\Quote;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Infrastructure\Persistence\Eloquent\Models\Product;

class StoreQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function stopOnFirstFailure(): bool
    {
        return false;
    }

    public function rules(): array
    {
        return [
            'order_id' => 'required|string|uuid',
            'customer_id' => 'required|string|uuid',
            'vendor_id' => 'required|string|uuid',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'valid_until' => 'required|date|after:now',
            'terms_and_conditions' => 'nullable|string',
            'notes' => 'nullable|string',
            'initial_offer' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.vendor_cost' => 'required|numeric|min:0',
            'items.*.total_price' => 'required|numeric|min:0',
            'items.*.specifications' => 'nullable|array',
            'items.*.form_schema' => 'nullable',
            'items.*.notes' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'order_id.required' => 'Order is required',
            'order_id.uuid' => 'Order ID must be a valid UUID',
            'customer_id.required' => 'Customer is required',
            'customer_id.uuid' => 'Customer ID must be a valid UUID',
            'vendor_id.required' => 'Vendor is required',
            'vendor_id.uuid' => 'Vendor ID must be a valid UUID',
            'title.required' => 'Title is required',
            'valid_until.required' => 'Valid until date is required',
            'valid_until.after' => 'Valid until date must be in the future',
            'initial_offer.required' => 'Initial offer is required',
            'initial_offer.min' => 'Initial offer must be non-negative',
            'items.required' => 'At least one item is required',
            'items.min' => 'At least one item is required',
            'items.*.product_id.required' => 'Product is required for each item',
            'items.*.description.required' => 'Description is required for each item',
            'items.*.quantity.required' => 'Quantity is required for each item',
            'items.*.quantity.min' => 'Quantity must be at least 1',
            'items.*.unit_price.required' => 'Unit price is required for each item',
            'items.*.vendor_cost.required' => 'Vendor cost is required for each item',
            'items.*.total_price.required' => 'Total price is required for each item',
        ];
    }

    /**
     * Prepare the data for validation.
     * This method validates and normalizes product_id fields in items array.
     */
    protected function prepareForValidation(): void
    {
        $items = $this->input('items', []);
        
        if (empty($items) || !is_array($items)) {
            return;
        }

        $tenantId = auth()->user()?->tenant_id;
        if (!$tenantId) {
            return;
        }

        // Process each item to convert product_id from UUID to integer if needed
        $processedItems = [];
        foreach ($items as $item) {
            $productId = $item['product_id'] ?? null;
            
            if (!$productId) {
                $processedItems[] = $item;
                continue;
            }

            // If it's a UUID, convert to integer ID for internal use
            if ($this->isUuid($productId)) {
                $product = Product::where('tenant_id', $tenantId)
                    ->where('uuid', $productId)
                    ->first();

                if ($product) {
                    $item['product_id'] = $product->id;
                    $item['product_uuid'] = $productId;
                }
            } elseif (is_numeric($productId)) {
                // It's an integer, validate it exists
                $product = Product::where('tenant_id', $tenantId)
                    ->where('id', (int)$productId)
                    ->first();

                if ($product) {
                    $item['product_id'] = $product->id;
                    $item['product_uuid'] = $product->uuid;
                }
            }
            
            $processedItems[] = $item;
        }

        $this->merge(['items' => $processedItems]);
    }

    /**
     * Check if a string is a valid UUID.
     */
    private function isUuid($value): bool
    {
        if (!is_string($value)) {
            return false;
        }

        return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $value) === 1;
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'order_id' => 'order',
            'customer_id' => 'customer',
            'vendor_id' => 'vendor',
            'title' => 'title',
            'description' => 'description',
            'valid_until' => 'valid until date',
            'terms_and_conditions' => 'terms and conditions',
            'notes' => 'notes',
            'initial_offer' => 'initial offer',
            'items' => 'items',
        ];
    }
}
