<?php

namespace App\Infrastructure\Presentation\Http\Requests\ExchangeRate;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExchangeRateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function stopOnFirstFailure(): bool
    {
        return false;
    }

    public function rules(): array
    {
        return [
            'mode' => ['required', 'string', Rule::in(['manual', 'auto'])],
            'manual_rate' => [
                'nullable',
                'numeric',
                'min:0',
                'max:999999.9999',
                Rule::requiredIf(fn() => $this->input('mode') === 'manual'),
            ],
            'active_provider_id' => [
                'nullable',
                'string',
                'exists:exchange_rate_providers,uuid',
                Rule::requiredIf(fn() => $this->input('mode') === 'auto'),
            ],
            'auto_update_enabled' => 'sometimes|boolean',
            'auto_update_time' => 'sometimes|date_format:H:i:s',
        ];
    }

    public function messages(): array
    {
        return [
            'mode.required' => 'Exchange rate mode is required',
            'mode.in' => 'Exchange rate mode must be either manual or auto',
            'manual_rate.required' => 'Manual rate is required when mode is set to manual',
            'manual_rate.numeric' => 'Manual rate must be a valid number',
            'manual_rate.min' => 'Manual rate must be greater than or equal to 0',
            'manual_rate.max' => 'Manual rate must not exceed 999999.9999',
            'active_provider_id.required' => 'Active provider is required when mode is set to auto',
            'active_provider_id.exists' => 'Selected provider does not exist',
            'auto_update_enabled.boolean' => 'Auto update enabled must be true or false',
            'auto_update_time.date_format' => 'Auto update time must be in HH:MM:SS format',
        ];
    }
}
