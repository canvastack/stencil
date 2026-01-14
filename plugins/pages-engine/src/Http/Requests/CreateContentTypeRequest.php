<?php

namespace Plugins\PagesEngine\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateContentTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('canplug_pagen_content_types', 'slug')
                    ->where('tenant_id', auth()->user()->tenant_id ?? null),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'icon' => ['nullable', 'string', 'max:100'],
            'default_url_pattern' => ['nullable', 'string', 'max:500'],
            'is_commentable' => ['boolean'],
            'is_categorizable' => ['boolean'],
            'is_taggable' => ['boolean'],
            'is_revisioned' => ['boolean'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Content type name is required',
            'slug.required' => 'Content type slug is required',
            'slug.regex' => 'Slug must be lowercase letters, numbers and hyphens only',
            'slug.unique' => 'This slug is already used for another content type',
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'content type name',
            'slug' => 'slug',
            'default_url_pattern' => 'default URL pattern',
        ];
    }
}
