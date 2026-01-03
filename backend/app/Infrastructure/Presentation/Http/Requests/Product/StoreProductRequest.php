<?php

namespace App\Infrastructure\Presentation\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100|unique:products,sku',
            'description' => 'required|string|max:1000',
            'long_description' => 'nullable|string',
            'category_id' => 'required|integer|exists:product_categories,id',
            'subcategory' => 'nullable|string|max:255',
            
            'price' => 'nullable|integer|min:0',
            'currency' => 'required|string|size:3',
            'price_unit' => 'required|string|max:50',
            'vendor_price' => 'nullable|integer|min:0',
            'markup_percentage' => 'nullable|integer|min:0|max:1000',
            
            'status' => ['nullable', Rule::in(['draft', 'published', 'archived'])],
            'type' => ['nullable', Rule::in(['standard', 'custom', 'service'])],
            'production_type' => ['nullable', Rule::in(['internal', 'vendor', 'hybrid'])],
            
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
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama produk wajib diisi',
            'description.required' => 'Deskripsi produk wajib diisi',
            'category_id.required' => 'Kategori produk wajib dipilih',
            'category_id.exists' => 'Kategori produk tidak valid',
            'price.required' => 'Harga produk wajib diisi',
            'price.integer' => 'Harga harus berupa angka bulat',
            'price.min' => 'Harga tidak boleh negatif',
        ];
    }
}
