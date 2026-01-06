<?php

namespace App\Domain\Product\Services;

use App\Models\ProductFormConfiguration;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class FormDataValidationService
{
    /**
     * Validate form data against form configuration schema
     */
    public function validate(ProductFormConfiguration $config, array $formData): array
    {
        $rules = $this->buildValidationRules($config->form_schema);
        $messages = $this->buildValidationMessages($config->form_schema);

        $validator = Validator::make($formData, $rules, $messages);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $validator->validated();
    }

    /**
     * Build Laravel validation rules from form schema
     */
    private function buildValidationRules(array $formSchema): array
    {
        $rules = [];

        foreach ($formSchema['fields'] ?? [] as $field) {
            $fieldRules = [];

            // Required/Nullable
            if ($field['required'] ?? false) {
                $fieldRules[] = 'required';
            } else {
                $fieldRules[] = 'nullable';
            }

            // Type-specific rules
            switch ($field['type']) {
                case 'text':
                case 'textarea':
                    $fieldRules[] = 'string';
                    if (isset($field['validation']['minLength'])) {
                        $fieldRules[] = 'min:' . $field['validation']['minLength'];
                    }
                    if (isset($field['validation']['maxLength'])) {
                        $fieldRules[] = 'max:' . $field['validation']['maxLength'];
                    }
                    break;

                case 'email':
                    $fieldRules[] = 'string';
                    $fieldRules[] = 'email';
                    break;

                case 'number':
                    $fieldRules[] = 'numeric';
                    if (isset($field['validation']['min'])) {
                        $fieldRules[] = 'min:' . $field['validation']['min'];
                    }
                    if (isset($field['validation']['max'])) {
                        $fieldRules[] = 'max:' . $field['validation']['max'];
                    }
                    break;

                case 'select':
                case 'radio':
                    if (isset($field['options']) && is_array($field['options'])) {
                        $allowedValues = array_column($field['options'], 'value');
                        if (!empty($allowedValues)) {
                            $fieldRules[] = 'in:' . implode(',', $allowedValues);
                        }
                    }
                    break;

                case 'multiselect':
                case 'checkbox':
                    $fieldRules[] = 'array';
                    if (isset($field['options']) && is_array($field['options'])) {
                        $allowedValues = array_column($field['options'], 'value');
                        if (!empty($allowedValues)) {
                            $rules[$field['name'] . '.*'] = ['in:' . implode(',', $allowedValues)];
                        }
                    }
                    break;

                case 'file':
                    // File should be uploaded first, URL stored in form data
                    $fieldRules[] = 'string';
                    $fieldRules[] = 'url';
                    break;

                case 'date':
                    $fieldRules[] = 'date';
                    break;

                case 'color':
                    $fieldRules[] = 'string';
                    $fieldRules[] = 'regex:/^#[0-9A-Fa-f]{6}$/';
                    break;

                case 'url':
                    $fieldRules[] = 'string';
                    $fieldRules[] = 'url';
                    break;

                case 'tel':
                case 'phone':
                    $fieldRules[] = 'string';
                    // Indonesian phone number validation
                    $fieldRules[] = 'regex:/^(\\+62|62|0)[0-9]{9,12}$/';
                    break;
            }

            // Custom pattern validation
            if (isset($field['validation']['pattern'])) {
                $fieldRules[] = 'regex:' . $field['validation']['pattern'];
            }

            $rules[$field['name']] = $fieldRules;
        }

        return $rules;
    }

    /**
     * Build custom validation messages from form schema
     */
    private function buildValidationMessages(array $formSchema): array
    {
        $messages = [];

        foreach ($formSchema['fields'] ?? [] as $field) {
            $fieldName = $field['name'];
            $fieldLabel = $field['label'] ?? $fieldName;

            // Required message
            if (isset($field['validation']['errorMessage'])) {
                $messages["{$fieldName}.required"] = $field['validation']['errorMessage'];
            } else {
                $messages["{$fieldName}.required"] = "{$fieldLabel} wajib diisi";
            }

            // Type-specific messages
            switch ($field['type']) {
                case 'email':
                    $messages["{$fieldName}.email"] = "{$fieldLabel} harus berupa alamat email yang valid";
                    break;

                case 'number':
                    $messages["{$fieldName}.numeric"] = "{$fieldLabel} harus berupa angka";
                    if (isset($field['validation']['min'])) {
                        $messages["{$fieldName}.min"] = "{$fieldLabel} minimal {$field['validation']['min']}";
                    }
                    if (isset($field['validation']['max'])) {
                        $messages["{$fieldName}.max"] = "{$fieldLabel} maksimal {$field['validation']['max']}";
                    }
                    break;

                case 'text':
                case 'textarea':
                    if (isset($field['validation']['minLength'])) {
                        $messages["{$fieldName}.min"] = "{$fieldLabel} minimal {$field['validation']['minLength']} karakter";
                    }
                    if (isset($field['validation']['maxLength'])) {
                        $messages["{$fieldName}.max"] = "{$fieldLabel} maksimal {$field['validation']['maxLength']} karakter";
                    }
                    break;

                case 'select':
                case 'radio':
                    $messages["{$fieldName}.in"] = "{$fieldLabel} harus berupa pilihan yang valid";
                    break;

                case 'multiselect':
                case 'checkbox':
                    $messages["{$fieldName}.array"] = "{$fieldLabel} harus berupa array";
                    $messages["{$fieldName}.*.in"] = "Salah satu pilihan {$fieldLabel} tidak valid";
                    break;

                case 'file':
                    $messages["{$fieldName}.url"] = "{$fieldLabel} harus berupa URL yang valid";
                    break;

                case 'date':
                    $messages["{$fieldName}.date"] = "{$fieldLabel} harus berupa tanggal yang valid";
                    break;

                case 'color':
                    $messages["{$fieldName}.regex"] = "{$fieldLabel} harus berupa kode warna hex yang valid (contoh: #FF5733)";
                    break;

                case 'url':
                    $messages["{$fieldName}.url"] = "{$fieldLabel} harus berupa URL yang valid";
                    break;

                case 'tel':
                case 'phone':
                    $messages["{$fieldName}.regex"] = "{$fieldLabel} harus berupa nomor telepon Indonesia yang valid";
                    break;
            }

            // Custom pattern message
            if (isset($field['validation']['pattern'])) {
                $messages["{$fieldName}.regex"] = isset($field['validation']['errorMessage']) 
                    ? $field['validation']['errorMessage'] 
                    : "{$fieldLabel} format tidak valid";
            }
        }

        return $messages;
    }

    /**
     * Validate a single field value
     */
    public function validateField(array $fieldConfig, $value): bool
    {
        $rules = $this->buildValidationRules(['fields' => [$fieldConfig]]);
        $fieldName = $fieldConfig['name'];

        if (!isset($rules[$fieldName])) {
            return true;
        }

        $validator = Validator::make(
            [$fieldName => $value],
            [$fieldName => $rules[$fieldName]]
        );

        return !$validator->fails();
    }
}
