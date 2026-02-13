<?php

namespace App\Http\Requests\Vendor;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UpdateProfileRequest
 * 
 * Validates vendor profile update request.
 * 
 * Requirements: 8.3, 8.4, 8.5
 */
class UpdateProfileRequest extends FormRequest
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
        // Get the authenticated vendor from the request
        $vendor = $this->user()?->vendor;
        
        $emailRules = ['nullable', 'email', 'max:255'];
        
        // Add uniqueness validation only if vendor is available (in actual requests)
        if ($vendor) {
            $emailRules[] = 'unique:vendors,email,' . $vendor->id . ',id,tenant_id,' . $vendor->tenant_id;
        }
        
        return [
            'email' => $emailRules,
            'phone' => ['nullable', 'string', 'max:50'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'location' => ['nullable', 'array'],
            'location.latitude' => ['required_with:location', 'numeric', 'between:-90,90'],
            'location.longitude' => ['required_with:location', 'numeric', 'between:-180,180'],
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
            'email.email' => 'Please provide a valid email address',
            'email.max' => 'Email cannot exceed 255 characters',
            'email.unique' => 'This email address is already in use by another vendor',
            'phone.max' => 'Phone number cannot exceed 50 characters',
            'contact_person.max' => 'Contact person name cannot exceed 255 characters',
            'address.max' => 'Address cannot exceed 500 characters',
            'location.array' => 'Location must be an object with latitude and longitude',
            'location.latitude.required_with' => 'Latitude is required when location is provided',
            'location.latitude.numeric' => 'Latitude must be a number',
            'location.latitude.between' => 'Latitude must be between -90 and 90',
            'location.longitude.required_with' => 'Longitude is required when location is provided',
            'location.longitude.numeric' => 'Longitude must be a number',
            'location.longitude.between' => 'Longitude must be between -180 and 180',
        ];
    }
}
