<?php

namespace App\Http\Requests\Vendor;

use Illuminate\Foundation\Http\FormRequest;

/**
 * SendMessageRequest
 * 
 * Validates vendor quote message request.
 * 
 * Requirements: 13.7, 13.8
 */
class SendMessageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'message' => ['required', 'string', 'max:5000'],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,doc,docx,xls,xlsx'], // 10MB = 10240KB
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'message.required' => 'Message is required',
            'message.max' => 'Message cannot exceed 5000 characters',
            'attachments.max' => 'Maximum 5 attachments allowed per message',
            'attachments.*.file' => 'Each attachment must be a valid file',
            'attachments.*.max' => 'Each attachment cannot exceed 10MB',
            'attachments.*.mimes' => 'Allowed file types: pdf, jpg, jpeg, png, doc, docx, xls, xlsx',
        ];
    }
}
