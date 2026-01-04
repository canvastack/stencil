<?php

namespace App\Infrastructure\Presentation\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
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
        $productId = $this->route('product');
        
        return [
            'name' => 'sometimes|required|string|max:255',
            'sku' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('products', 'sku')->ignore($productId),
            ],
            'description' => 'sometimes|required|string|max:1000',
            'long_description' => 'nullable|string',
            'category_id' => 'sometimes|required|integer|exists:product_categories,id',
            'subcategory' => 'nullable|string|max:255',
            
            'price' => 'nullable|integer|min:0',
            'currency' => 'sometimes|required|string|size:3',
            'price_unit' => 'sometimes|required|string|max:50',
            'vendor_price' => 'nullable|integer|min:0',
            'markup_percentage' => 'nullable|integer|min:0|max:1000',
            
            'status' => ['nullable', Rule::in(['draft', 'published', 'archived'])],
            'type' => ['nullable', Rule::in(['standard', 'custom', 'service'])],
            'production_type' => ['required', Rule::in(['internal', 'vendor'])],
            
            'stock_quantity' => 'nullable|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'track_inventory' => 'boolean',
            
            'min_order_quantity' => 'nullable|integer|min:1',
            'max_order_quantity' => 'nullable|integer|min:1',
            'lead_time' => 'nullable|string|max:100',
            
            'images' => 'nullable|array',
            'images.*' => 'string|max:2000000',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:100',
            'categories' => 'nullable|array',
            'categories.*' => 'string|max:100',
            
            'features' => 'nullable|array',
            'specifications' => 'nullable|array',
            'metadata' => 'nullable|array',
            'dimensions' => 'nullable|array',
            
            'material' => 'nullable|string|max:255',
            'available_materials' => 'nullable|array',
            'quality_levels' => 'nullable|array',
            
            'customizable' => 'boolean',
            'custom_options' => 'nullable|array',
            'requires_quote' => 'boolean',
            
            'featured' => 'boolean',
            'seo_title' => 'nullable|string|max:255',
            'seo_description' => 'nullable|string|max:500',
            'seo_keywords' => 'nullable|array',
            
            'product_type' => 'nullable|string|max:100',
            'bahan' => 'nullable|string|max:255',
            'bahan_options' => 'nullable|array',
            'bahan_options.*' => 'string|max:255',
            'kualitas' => 'nullable|string|max:100',
            'kualitas_options' => 'nullable|array',
            'kualitas_options.*' => 'string|max:100',
            'ketebalan' => 'nullable|string|max:50',
            'ketebalan_options' => 'nullable|array',
            'ketebalan_options.*' => 'string|max:50',
            'ukuran' => 'nullable|string|max:50',
            'ukuran_options' => 'nullable|array',
            'ukuran_options.*' => 'string|max:50',
            'warna_background' => 'nullable|string|max:50',
            'design_file_url' => 'nullable|string|max:2048',
            'custom_texts' => 'nullable|array',
            'custom_texts.*.text' => 'nullable|string|max:1000',
            'custom_texts.*.placement' => 'nullable|string|max:100',
            'custom_texts.*.position' => 'nullable|string|max:100',
            'custom_texts.*.color' => 'nullable|string|max:50',
            'notes_wysiwyg' => 'nullable|string',
            'available_sizes' => 'nullable|array',
            'size' => 'nullable|string|max:100',
        ];
    }
}
