<?php

namespace App\Infrastructure\Presentation\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class AdjustInventoryLocationStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'difference' => ['required', 'numeric', 'not_in:0'],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }
}
