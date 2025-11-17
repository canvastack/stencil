<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductCategoryRequest extends FormRequest
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
        $categoryId = $this->route('id') ?? $this->route('category');
        
        return [
            'name' => [
                'string',
                'max:255',
                Rule::unique('product_categories', 'name')
                    ->where('tenant_id', tenant('id'))
                    ->ignore($categoryId)
            ],
            'description' => 'nullable|string|max:1000',
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('product_categories', 'id')->where('tenant_id', tenant('id')),
                function ($attribute, $value, $fail) use ($categoryId) {
                    // Prevent setting self as parent
                    if ($value && $value == $categoryId) {
                        $fail('A category cannot be its own parent.');
                    }
                    
                    // Prevent circular references
                    if ($value && $this->wouldCreateCircularReference($categoryId, $value)) {
                        $fail('This would create a circular reference in the category hierarchy.');
                    }
                }
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
     * Handle a passed validation attempt.
     */
    protected function passedValidation(): void
    {
        // Additional validation logic if needed
        if ($this->has('parent_id') && $this->parent_id) {
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

    /**
     * Check if setting the parent would create a circular reference.
     */
    protected function wouldCreateCircularReference($categoryId, $parentId): bool
    {
        if (!$parentId) {
            return false;
        }

        // Get all descendants of the current category
        $descendants = $this->getDescendants($categoryId);
        
        // Check if the proposed parent is in the descendants
        return in_array($parentId, $descendants);
    }

    /**
     * Get all descendant category IDs.
     */
    protected function getDescendants($categoryId): array
    {
        $descendants = [];
        $children = \App\Infrastructure\Persistence\Eloquent\ProductCategoryEloquentModel::where('parent_id', $categoryId)
            ->where('tenant_id', tenant('id'))
            ->pluck('id')
            ->toArray();

        foreach ($children as $childId) {
            $descendants[] = $childId;
            $descendants = array_merge($descendants, $this->getDescendants($childId));
        }

        return $descendants;
    }
}