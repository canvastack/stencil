<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecordVendorRecoveryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled in controller
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'recovered_amount' => 'required|numeric|min:0.01|max:999999999.99',
            'recovery_notes' => 'required|string|min:5|max:1000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'recovered_amount.required' => 'Recovered amount is required',
            'recovered_amount.numeric' => 'Recovered amount must be a valid number',
            'recovered_amount.min' => 'Recovered amount must be greater than zero',
            'recovered_amount.max' => 'Recovered amount is too large',
            'recovery_notes.required' => 'Recovery notes are required',
            'recovery_notes.min' => 'Recovery notes must be at least 5 characters',
            'recovery_notes.max' => 'Recovery notes cannot exceed 1000 characters',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'recovered_amount' => 'recovered amount',
            'recovery_notes' => 'recovery notes',
        ];
    }
}