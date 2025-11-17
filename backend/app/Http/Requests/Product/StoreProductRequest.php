<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // TODO: Add proper authorization logic
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('products', 'name')->where('tenant_id', tenant('id'))
            ],
            'description' => 'required|string|max:2000',
            'long_description' => 'nullable|string|max:10000',
            'images' => 'nullable|array|max:10',
            'images.*' => 'string|url|max:2048',
            'features' => 'nullable|array|max:20',
            'features.*' => 'string|max:255',
            'category_id' => [
                'required',
                'integer',
                Rule::exists('product_categories', 'id')->where('tenant_id', tenant('id'))
            ],
            'subcategory' => 'nullable|string|max:255',
            'tags' => 'nullable|array|max:20',
            'tags.*' => 'string|max:100',
            'material' => [
                'required',
                'string',
                'max:255',
                Rule::in(['Akrilik', 'Kuningan', 'Tembaga', 'Stainless Steel', 'Aluminum'])
            ],
            'price' => 'required|numeric|min:0|max:999999999.99',
            'currency' => 'string|size:3|in:IDR,USD',
            'price_unit' => 'required|string|max:50',
            'min_order' => 'required|integer|min:1|max:999999',
            'specifications' => 'nullable|array|max:50',
            'specifications.*.key' => 'required|string|max:100',
            'specifications.*.value' => 'required|string|max:255',
            'customizable' => 'boolean',
            'custom_options' => 'nullable|array|max:20',
            'custom_options.*.name' => 'required|string|max:100',
            'custom_options.*.type' => 'required|in:text,select,number,checkbox,radio',
            'custom_options.*.options' => 'nullable|array|max:50',
            'custom_options.*.options.*' => 'string|max:100',
            'custom_options.*.required' => 'boolean',
            'in_stock' => 'boolean',
            'stock_quantity' => 'nullable|integer|min:0|max:999999999',
            'lead_time' => 'required|string|max:100',
            'seo_title' => 'nullable|string|max:255',
            'seo_description' => 'nullable|string|max:500',
            'seo_keywords' => 'nullable|array|max:20',
            'seo_keywords.*' => 'string|max:100',
            'status' => 'in:draft,published,archived',
            'featured' => 'boolean',
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Product name is required.',
            'name.unique' => 'A product with this name already exists.',
            'name.max' => 'Product name cannot exceed 255 characters.',
            'description.required' => 'Product description is required.',
            'description.max' => 'Description cannot exceed 2000 characters.',
            'long_description.max' => 'Long description cannot exceed 10000 characters.',
            'images.max' => 'You cannot add more than 10 images.',
            'images.*.url' => 'Each image must be a valid URL.',
            'features.max' => 'You cannot add more than 20 features.',
            'features.*.max' => 'Each feature cannot exceed 255 characters.',
            'category_id.required' => 'Product category is required.',
            'category_id.exists' => 'The selected category is invalid.',
            'tags.max' => 'You cannot add more than 20 tags.',
            'tags.*.max' => 'Each tag cannot exceed 100 characters.',
            'material.required' => 'Product material is required.',
            'material.in' => 'The selected material is not supported.',
            'price.required' => 'Product price is required.',
            'price.numeric' => 'Price must be a valid number.',
            'price.min' => 'Price cannot be negative.',
            'price.max' => 'Price value is too large.',
            'currency.in' => 'Currency must be IDR or USD.',
            'price_unit.required' => 'Price unit is required.',
            'min_order.required' => 'Minimum order quantity is required.',
            'min_order.integer' => 'Minimum order must be a valid number.',
            'min_order.min' => 'Minimum order must be at least 1.',
            'specifications.max' => 'You cannot add more than 50 specifications.',
            'specifications.*.key.required' => 'Specification key is required.',
            'specifications.*.value.required' => 'Specification value is required.',
            'custom_options.max' => 'You cannot add more than 20 custom options.',
            'custom_options.*.name.required' => 'Custom option name is required.',
            'custom_options.*.type.required' => 'Custom option type is required.',
            'custom_options.*.type.in' => 'Invalid custom option type.',
            'stock_quantity.integer' => 'Stock quantity must be a valid number.',
            'stock_quantity.min' => 'Stock quantity cannot be negative.',
            'lead_time.required' => 'Lead time is required.',
            'seo_keywords.max' => 'You cannot add more than 20 SEO keywords.',
            'seo_keywords.*.max' => 'Each SEO keyword cannot exceed 100 characters.',
            'status.in' => 'Status must be draft, published, or archived.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name' => 'product name',
            'category_id' => 'category',
            'price_unit' => 'price unit',
            'min_order' => 'minimum order',
            'in_stock' => 'stock status',
            'stock_quantity' => 'stock quantity',
            'lead_time' => 'lead time',
            'seo_title' => 'SEO title',
            'seo_description' => 'SEO description',
            'seo_keywords' => 'SEO keywords'
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if (!$this->has('currency')) {
            $this->merge(['currency' => 'IDR']);
        }

        if (!$this->has('status')) {
            $this->merge(['status' => 'draft']);
        }

        if (!$this->has('customizable')) {
            $this->merge(['customizable' => false]);
        }

        if (!$this->has('in_stock')) {
            $this->merge(['in_stock' => true]);
        }

        if (!$this->has('featured')) {
            $this->merge(['featured' => false]);
        }

        // If not in stock, set stock_quantity to 0
        if ($this->boolean('in_stock') === false && !$this->has('stock_quantity')) {
            $this->merge(['stock_quantity' => 0]);
        }
    }

    /**
     * Handle a passed validation attempt.
     */
    protected function passedValidation(): void
    {
        // Validate category is active
        $category = \App\Infrastructure\Persistence\Eloquent\ProductCategoryEloquentModel::where('id', $this->category_id)
            ->where('tenant_id', tenant('id'))
            ->where('is_active', true)
            ->first();

        if (!$category) {
            $this->failedValidation(
                validator()->make([], [])->after(function ($validator) {
                    $validator->errors()->add('category_id', 'The selected category must be active.');
                })
            );
        }

        // Validate custom options if customizable
        if ($this->boolean('customizable') && $this->has('custom_options')) {
            foreach ($this->custom_options as $index => $option) {
                if ($option['type'] === 'select' || $option['type'] === 'radio') {
                    if (empty($option['options']) || !is_array($option['options'])) {
                        $this->failedValidation(
                            validator()->make([], [])->after(function ($validator) use ($index) {
                                $validator->errors()->add("custom_options.{$index}.options", 'Select and radio options must have available choices.');
                            })
                        );
                    }
                }
            }
        }
    }
}