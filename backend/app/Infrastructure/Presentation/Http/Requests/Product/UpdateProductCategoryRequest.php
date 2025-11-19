<?php

namespace App\Infrastructure\Presentation\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $categoryId = $this->route('category');
        
        return [
            'name' => 'sometimes|required|string|max:255',
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('product_categories', 'slug')->ignore($categoryId),
            ],
            'description' => 'nullable|string|max:1000',
            'parent_id' => 'nullable|integer|exists:product_categories,id',
            'sort_order' => 'nullable|integer|min:0',
            
            'image' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:500',
            'color_scheme' => 'nullable|array',
            
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'show_in_menu' => 'boolean',
            
            'allowed_materials' => 'nullable|array',
            'quality_levels' => 'nullable|array',
            'customization_options' => 'nullable|array',
            
            'base_markup_percentage' => 'nullable|numeric|min:0|max:1000',
            'requires_quote' => 'boolean',
            
            'seo_title' => 'nullable|string|max:255',
            'seo_description' => 'nullable|string|max:500',
            'seo_keywords' => 'nullable|array',
        ];
    }
}
