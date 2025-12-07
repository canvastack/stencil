<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRefundDisputeRequest extends FormRequest
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
            'company_response' => 'required|string|min:10|max:2000',
            'evidence_company' => 'sometimes|array',
            'evidence_company.*.type' => 'required_with:evidence_company|string|in:image,document,video,audio',
            'evidence_company.*.file_path' => 'required_with:evidence_company|string',
            'evidence_company.*.description' => 'sometimes|string|max:500',
            'evidence_company.*.uploaded_at' => 'sometimes|date',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'company_response.required' => 'Company response is required',
            'company_response.min' => 'Company response must be at least 10 characters',
            'company_response.max' => 'Company response cannot exceed 2000 characters',
            'evidence_company.*.type.required_with' => 'Evidence type is required',
            'evidence_company.*.type.in' => 'Evidence type must be: image, document, video, or audio',
            'evidence_company.*.file_path.required_with' => 'Evidence file path is required',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'company_response' => 'company response',
            'evidence_company' => 'company evidence',
        ];
    }
}