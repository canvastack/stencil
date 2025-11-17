<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductCategoryRequest extends FormRequest
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
                Rule::unique('product_categories', 'name')->where('tenant_id', tenant('id'))
            ],
            'description' => 'nullable|string|max:1000',
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('product_categories', 'id')->where('tenant_id', tenant('id'))
            ],
            'image' => 'nullable|string|url|max:2048',
            'order' => 'integer|min:0|max:999999',
            'is_active' => 'boolean'
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Category name is required.',
            'name.unique' => 'A category with this name already exists.',
            'name.max' => 'Category name cannot exceed 255 characters.',
            'parent_id.exists' => 'The selected parent category is invalid.',
            'image.url' => 'The image must be a valid URL.',
            'image.max' => 'The image URL cannot exceed 2048 characters.',
            'order.integer' => 'Order must be a valid number.',
            'order.min' => 'Order cannot be negative.',
            'order.max' => 'Order value is too large.'
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name' => 'category name',
            'parent_id' => 'parent category',
            'is_active' => 'active status'
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if (!$this->has('order')) {
            $this->merge(['order' => 0]);
        }

        if (!$this->has('is_active')) {
            $this->merge(['is_active' => true]);
        }
    }

    /**
     * Handle a passed validation attempt.
     */
    protected function passedValidation(): void
    {
        // Additional validation logic if needed
        if ($this->parent_id) {
            // Check if parent category exists and is active
            $parentCategory = \App\Infrastructure\Persistence\Eloquent\ProductCategoryEloquentModel::where('id', $this->parent_id)
                ->where('tenant_id', tenant('id'))
                ->where('is_active', true)
                ->first();

            if (!$parentCategory) {
                $this->failedValidation(
                    validator()->make([], [])->after(function ($validator) {
                        $validator->errors()->add('parent_id', 'The selected parent category must be active.');
                    })
                );
            }
        }
    }
}