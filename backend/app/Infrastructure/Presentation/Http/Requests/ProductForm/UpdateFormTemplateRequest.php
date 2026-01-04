<?php

namespace App\Infrastructure\Presentation\Http\Requests\ProductForm;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFormTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function stopOnFirstFailure(): bool
    {
        return false;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'category' => 'nullable|string|max:100',
            
            'form_schema' => 'sometimes|array',
            'form_schema.version' => 'sometimes|string',
            'form_schema.title' => 'sometimes|string|max:255',
            'form_schema.description' => 'nullable|string',
            'form_schema.fields' => 'sometimes|array|min:1',
            'form_schema.fields.*.id' => 'sometimes|string|max:100',
            'form_schema.fields.*.type' => 'sometimes|string|in:text,textarea,number,email,tel,url,date,select,multiselect,radio,checkbox,color,file,wysiwyg,repeater',
            'form_schema.fields.*.name' => 'sometimes|string|max:255',
            'form_schema.fields.*.label' => 'sometimes|string|max:255',
            'form_schema.fields.*.order' => 'sometimes|integer|min:1',
            
            'validation_rules' => 'nullable|array',
            'conditional_logic' => 'nullable|array',
            
            'is_public' => 'sometimes|boolean',
            'preview_image_url' => 'nullable|url|max:500',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ];
    }

    public function messages(): array
    {
        return [
            'form_schema.fields.min' => 'Template harus memiliki minimal 1 field',
        ];
    }

    /**
     * Validate that field names are unique within the template
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->has('form_schema.fields')) {
                $fieldNames = collect($this->input('form_schema.fields'))->pluck('name')->filter()->toArray();
                $duplicates = array_diff_assoc($fieldNames, array_unique($fieldNames));
                
                if (!empty($duplicates)) {
                    $validator->errors()->add(
                        'form_schema.fields',
                        'Field names harus unik. Ditemukan duplikat: ' . implode(', ', $duplicates)
                    );
                }
            }
        });
    }
}
