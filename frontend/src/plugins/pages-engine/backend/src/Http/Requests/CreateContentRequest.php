<?php

namespace Plugins\PagesEngine\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateContentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content_type_uuid' => [
                'required',
                'uuid',
                Rule::exists('canplug_pagen_content_types', 'uuid'),
            ],
            'title' => ['required', 'string', 'max:500'],
            'slug' => [
                'required',
                'string',
                'max:500',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('canplug_pagen_contents', 'slug')
                    ->where('tenant_id', auth()->user()->tenant_id ?? null),
            ],
            'content' => ['required', 'array'],
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'featured_image' => ['nullable', 'url', 'max:500'],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['uuid', Rule::exists('canplug_pagen_categories', 'uuid')],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['uuid', Rule::exists('canplug_pagen_tags', 'uuid')],
            'metadata' => ['nullable', 'array'],
            'editor_format' => ['nullable', Rule::in(['wysiwyg', 'markdown', 'html'])],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string'],
            'seo_keywords' => ['nullable', 'array'],
            'canonical_url' => ['nullable', 'url', 'max:500'],
            'is_featured' => ['nullable', 'boolean'],
            'is_pinned' => ['nullable', 'boolean'],
            'is_commentable' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'content_type_uuid.required' => 'Content type is required',
            'content_type_uuid.exists' => 'Invalid content type',
            'title.required' => 'Title is required',
            'slug.required' => 'Slug is required',
            'slug.regex' => 'Slug must be lowercase letters, numbers and hyphens only',
            'slug.unique' => 'This slug is already used for another content',
            'content.required' => 'Content is required',
            'content.array' => 'Content must be an object',
        ];
    }
}
