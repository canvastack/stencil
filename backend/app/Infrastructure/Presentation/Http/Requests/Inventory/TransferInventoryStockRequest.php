<?php

namespace App\Infrastructure\Presentation\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class TransferInventoryStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from_location_id' => ['required', 'integer', 'exists:inventory_locations,id'],
            'to_location_id' => ['required', 'integer', 'different:from_location_id', 'exists:inventory_locations,id'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }
}
