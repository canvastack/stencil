<?php

namespace App\Infrastructure\Presentation\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInventoryLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'location_code' => ['sometimes', 'string', 'max:50'],
            'location_name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'parent_location_id' => ['nullable', 'integer', 'exists:inventory_locations,id'],
            'location_level' => ['nullable', 'integer', 'min:1'],
            'location_type' => ['nullable', 'string', 'max:50'],
            'address_line_1' => ['nullable', 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'state_province' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:100'],
            'total_capacity' => ['nullable', 'numeric', 'min:0'],
            'used_capacity' => ['nullable', 'numeric', 'min:0'],
            'capacity_unit' => ['nullable', 'string', 'max:20'],
            'temperature_controlled' => ['nullable', 'boolean'],
            'temperature_min' => ['nullable', 'numeric'],
            'temperature_max' => ['nullable', 'numeric'],
            'humidity_controlled' => ['nullable', 'boolean'],
            'humidity_max' => ['nullable', 'numeric'],
            'security_level' => ['nullable', 'string', 'max:20'],
            'is_active' => ['nullable', 'boolean'],
            'is_primary' => ['nullable', 'boolean'],
            'operational_hours' => ['nullable', 'array'],
            'contact_information' => ['nullable', 'array'],
        ];
    }
}
