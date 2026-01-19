<?php

namespace Plugins\PagesEngine\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContentTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $uuid = $this->route('uuid');
        
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'string', 'max:100'],
            'default_url_pattern' => ['nullable', 'string', 'max:500'],
            'is_commentable' => ['sometimes', 'boolean'],
            'is_categorizable' => ['sometimes', 'boolean'],
            'is_taggable' => ['sometimes', 'boolean'],
            'is_revisioned' => ['sometimes', 'boolean'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Content type name is required',
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'content type name',
            'default_url_pattern' => 'default URL pattern',
        ];
    }
}
