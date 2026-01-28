<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRuleConfigurationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('manage-business-rules');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'enabled' => ['sometimes', 'boolean'],
            'priority' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'parameters' => ['sometimes', 'array'],
            'parameters.*' => ['nullable'],
            'applicable_contexts' => ['sometimes', 'array'],
            'applicable_contexts.*' => ['string', 'max:50']
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'priority.min' => 'Priority must be at least 1.',
            'priority.max' => 'Priority cannot exceed 100.',
            'applicable_contexts.*.string' => 'Each applicable context must be a string.',
            'applicable_contexts.*.max' => 'Each applicable context cannot exceed 50 characters.'
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'enabled' => 'rule enabled status',
            'priority' => 'rule priority',
            'parameters' => 'rule parameters',
            'applicable_contexts' => 'applicable contexts'
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Validate that parameters is a valid JSON object if provided
            if ($this->has('parameters') && !is_null($this->input('parameters'))) {
                $parameters = $this->input('parameters');
                if (!is_array($parameters)) {
                    $validator->errors()->add('parameters', 'Parameters must be a valid object.');
                }
            }

            // Validate applicable contexts are not empty strings
            if ($this->has('applicable_contexts')) {
                $contexts = $this->input('applicable_contexts', []);
                foreach ($contexts as $index => $context) {
                    if (empty(trim($context))) {
                        $validator->errors()->add("applicable_contexts.{$index}", 'Context cannot be empty.');
                    }
                }
            }
        });
    }
}