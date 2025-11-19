<?php

namespace App\Infrastructure\Presentation\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class SetInventoryLocationStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quantity' => ['required', 'numeric', 'min:0'],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }
}
