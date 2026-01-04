<?php

namespace App\Infrastructure\Presentation\Http\Requests\ProductForm;

use Illuminate\Foundation\Http\FormRequest;

class StoreFormConfigurationRequest extends FormRequest
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
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            
            'form_schema' => 'required|array',
            'form_schema.version' => 'required|string',
            'form_schema.title' => 'required|string|max:255',
            'form_schema.description' => 'nullable|string',
            'form_schema.fields' => 'required|array|min:1',
            'form_schema.fields.*.id' => 'required|string|max:100',
            'form_schema.fields.*.type' => 'required|string|in:text,textarea,number,email,tel,url,date,select,multiselect,radio,checkbox,color,file,wysiwyg,repeater',
            'form_schema.fields.*.name' => 'required|string|max:255',
            'form_schema.fields.*.label' => 'required|string|max:255',
            'form_schema.fields.*.placeholder' => 'nullable|string|max:255',
            'form_schema.fields.*.required' => 'boolean',
            'form_schema.fields.*.order' => 'required|integer|min:1',
            'form_schema.fields.*.options' => 'required_if:form_schema.fields.*.type,select,multiselect,radio,checkbox|array',
            'form_schema.fields.*.options.*.value' => 'required|string',
            'form_schema.fields.*.options.*.label' => 'required|string',
            'form_schema.fields.*.validation' => 'nullable|array',
            'form_schema.fields.*.conditionalLogic' => 'nullable|array',
            'form_schema.submitButton' => 'nullable|array',
            'form_schema.submitButton.text' => 'nullable|string|max:100',
            'form_schema.submitButton.position' => 'nullable|string|in:left,center,right',
            'form_schema.submitButton.style' => 'nullable|string|in:primary,secondary,outline',
            
            'validation_rules' => 'nullable|array',
            
            'conditional_logic' => 'nullable|array',
            
            'is_default' => 'boolean',
            'template_id' => 'nullable|integer|exists:product_form_templates,id',
        ];
    }

    public function messages(): array
    {
        return [
            'form_schema.required' => 'Form schema wajib diisi',
            'form_schema.fields.required' => 'Form harus memiliki minimal 1 field',
            'form_schema.fields.min' => 'Form harus memiliki minimal 1 field',
            'form_schema.fields.*.type.required' => 'Setiap field harus memiliki tipe',
            'form_schema.fields.*.type.in' => 'Tipe field tidak valid',
            'form_schema.fields.*.name.required' => 'Setiap field harus memiliki nama',
            'form_schema.fields.*.label.required' => 'Setiap field harus memiliki label',
            'form_schema.fields.*.options.required_if' => 'Field select/radio/checkbox harus memiliki options',
        ];
    }

    /**
     * Validate that field names are unique within the form
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->has('form_schema.fields')) {
                $fieldNames = collect($this->input('form_schema.fields'))->pluck('name')->toArray();
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
