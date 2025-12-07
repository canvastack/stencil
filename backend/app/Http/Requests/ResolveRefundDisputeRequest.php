<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ResolveRefundDisputeRequest extends FormRequest
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
            'final_refund_amount' => 'required|numeric|min:0|max:999999999.99',
            'resolution_notes' => 'required|string|min:10|max:1000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'final_refund_amount.required' => 'Final refund amount is required',
            'final_refund_amount.numeric' => 'Final refund amount must be a valid number',
            'final_refund_amount.min' => 'Final refund amount cannot be negative',
            'final_refund_amount.max' => 'Final refund amount is too large',
            'resolution_notes.required' => 'Resolution notes are required',
            'resolution_notes.min' => 'Resolution notes must be at least 10 characters',
            'resolution_notes.max' => 'Resolution notes cannot exceed 1000 characters',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'final_refund_amount' => 'final refund amount',
            'resolution_notes' => 'resolution notes',
        ];
    }
}