<?php

namespace App\Infrastructure\Presentation\Http\Requests\CustomDomain;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomDomainRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('settings.domain.create');
    }

    public function rules(): array
    {
        return [
            'domain_name' => [
                'required',
                'string',
                'max:255',
                'regex:/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i',
                'unique:custom_domains,domain_name,NULL,id,deleted_at,NULL'
            ],
            'verification_method' => [
                'required',
                Rule::in(['dns_txt', 'dns_cname', 'file_upload'])
            ],
            'dns_provider' => [
                'nullable',
                Rule::in(['cloudflare', 'route53', 'manual'])
            ],
            'auto_renew_ssl' => 'nullable|boolean',
            'redirect_to_https' => 'nullable|boolean',
            'www_redirect' => [
                'nullable',
                Rule::in(['add_www', 'remove_www', 'both'])
            ],
            'metadata' => 'nullable|array',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'auto_renew_ssl' => $this->input('auto_renew_ssl', true),
            'redirect_to_https' => $this->input('redirect_to_https', true),
            'www_redirect' => $this->input('www_redirect', 'both'),
        ]);
    }

    public function messages(): array
    {
        return [
            'domain_name.required' => 'Domain name is required',
            'domain_name.regex' => 'Invalid domain name format',
            'domain_name.unique' => 'This domain is already registered',
            'verification_method.required' => 'Verification method is required',
            'verification_method.in' => 'Invalid verification method. Must be dns_txt, dns_cname, or file_upload',
            'dns_provider.in' => 'Invalid DNS provider. Must be cloudflare, route53, or manual',
            'www_redirect.in' => 'Invalid www redirect option. Must be add_www, remove_www, or both',
        ];
    }
}
