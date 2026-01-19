<?php

namespace Plugins\PagesEngine\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubmitCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'content_uuid' => [
                'required',
                'uuid',
                Rule::exists('canplug_pagen_contents', 'uuid')
                    ->where('status', 'published'),
            ],
            'body' => ['required', 'string', 'min:3', 'max:5000'],
            'parent_uuid' => [
                'nullable',
                'uuid',
                Rule::exists('canplug_pagen_comments', 'uuid'),
            ],
        ];

        if (!auth()->check()) {
            $rules['author_name'] = ['required', 'string', 'max:255'];
            $rules['author_email'] = ['required', 'email', 'max:255'];
        } else {
            $rules['author_name'] = ['nullable', 'string', 'max:255'];
            $rules['author_email'] = ['nullable', 'email', 'max:255'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'content_uuid.required' => 'Content is required',
            'content_uuid.exists' => 'Invalid content or content is not published',
            'body.required' => 'Comment text is required',
            'body.min' => 'Comment must be at least 3 characters',
            'body.max' => 'Comment cannot exceed 5000 characters',
            'parent_uuid.exists' => 'Invalid parent comment',
            'author_name.required' => 'Name is required for guest comments',
            'author_email.required' => 'Email is required for guest comments',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (auth()->check()) {
            $this->merge([
                'author_name' => $this->input('author_name', auth()->user()->name),
                'author_email' => $this->input('author_email', auth()->user()->email),
            ]);
        }
    }
}
