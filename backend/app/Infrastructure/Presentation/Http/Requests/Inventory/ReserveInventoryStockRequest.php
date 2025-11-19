<?php

namespace App\Infrastructure\Presentation\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class ReserveInventoryStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'location_id' => ['nullable', 'integer', 'exists:inventory_locations,id'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'reference_type' => ['required', 'string', 'max:100'],
            'reference_id' => ['required', 'string', 'max:100'],
            'expires_at' => ['nullable', 'date'],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }
}
