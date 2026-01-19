<?php

namespace Plugins\PagesEngine\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content_type_uuid' => ['required', 'uuid', Rule::exists('canplug_pagen_content_types', 'uuid')],
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('canplug_pagen_categories', 'slug')
                    ->where('tenant_id', auth()->user()->tenant_id ?? null),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'parent_uuid' => ['nullable', 'uuid', Rule::exists('canplug_pagen_categories', 'uuid')],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
