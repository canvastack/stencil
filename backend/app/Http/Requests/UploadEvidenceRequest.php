<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadEvidenceRequest extends FormRequest
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
            'file' => [
                'required',
                'file',
                'max:51200', // 50MB in KB
                'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,txt,xlsx,xls,mp4,mov,avi,mkv,webm,mp3,wav,ogg,m4a'
            ],
            'description' => 'sometimes|string|max:500',
            'evidence_type' => 'sometimes|string|in:customer,company', // For dispute evidence
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'file.required' => 'Evidence file is required',
            'file.file' => 'Invalid file upload',
            'file.max' => 'File size cannot exceed 50MB',
            'file.mimes' => 'File type not supported. Allowed types: images (jpg, png, gif), documents (pdf, doc, docx), videos (mp4, mov), audio (mp3, wav)',
            'description.max' => 'Description cannot exceed 500 characters',
            'evidence_type.in' => 'Evidence type must be either "customer" or "company"',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'file' => 'evidence file',
            'evidence_type' => 'evidence type',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $file = $this->file('file');
            
            if ($file) {
                // Additional file validation
                $extension = strtolower($file->getClientOriginalExtension());
                $fileSize = $file->getSize();
                
                // Image files have lower size limit
                $imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                if (in_array($extension, $imageTypes) && $fileSize > 10 * 1024 * 1024) { // 10MB
                    $validator->errors()->add('file', 'Image files cannot exceed 10MB');
                }
                
                // Check for potentially malicious files
                if ($this->isPotentiallyMalicious($file)) {
                    $validator->errors()->add('file', 'File appears to be malicious and cannot be uploaded');
                }
            }
        });
    }

    /**
     * Basic check for potentially malicious files
     */
    private function isPotentiallyMalicious($file): bool
    {
        $filename = $file->getClientOriginalName();
        $extension = strtolower($file->getClientOriginalExtension());
        
        // Check for double extensions
        if (substr_count($filename, '.') > 1) {
            $secondExtension = strtolower(pathinfo(pathinfo($filename, PATHINFO_FILENAME), PATHINFO_EXTENSION));
            $executableExtensions = ['exe', 'bat', 'cmd', 'scr', 'pif', 'com', 'vbs', 'js', 'php'];
            
            if (in_array($secondExtension, $executableExtensions)) {
                return true;
            }
        }
        
        // Check for suspicious content in first few bytes (basic detection)
        $handle = fopen($file->getPathname(), 'rb');
        if ($handle) {
            $firstBytes = fread($handle, 100);
            fclose($handle);
            
            // Look for common malicious patterns
            $maliciousPatterns = ['<?php', '<script', 'eval(', 'base64_decode'];
            foreach ($maliciousPatterns as $pattern) {
                if (stripos($firstBytes, $pattern) !== false) {
                    return true;
                }
            }
        }
        
        return false;
    }
}