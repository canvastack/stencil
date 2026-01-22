<?php

namespace App\Infrastructure\Presentation\Http\Requests\CustomDomain;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomDomainRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('settings.domain.create');
    }

    public function rules(): array
    {
        return [
            'ssl_enabled' => 'nullable|boolean',
            'auto_renew_ssl' => 'nullable|boolean',
            'redirect_to_https' => 'nullable|boolean',
            'www_redirect' => [
                'nullable',
                Rule::in(['add_www', 'remove_www', 'both'])
            ],
            'verification_method' => [
                'nullable',
                Rule::in(['dns_txt', 'dns_cname', 'file_upload'])
            ],
            'dns_provider' => [
                'nullable',
                Rule::in(['cloudflare', 'route53', 'manual'])
            ],
            'dns_zone_id' => 'nullable|string|max:255',
            'dns_record_id' => 'nullable|string|max:255',
            'metadata' => 'nullable|array',
        ];
    }

    public function messages(): array
    {
        return [
            'www_redirect.in' => 'Invalid www redirect option. Must be add_www, remove_www, or both',
            'dns_provider.in' => 'Invalid DNS provider. Must be cloudflare, route53, or manual',
        ];
    }
}
