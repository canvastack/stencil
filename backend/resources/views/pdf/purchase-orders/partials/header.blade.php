<div class="header">
    <div class="header-content">
        <div class="company-info">
            @if(config('app.logo_path'))
            <img src="{{ public_path(config('app.logo_path')) }}" alt="Company Logo" class="company-logo">
            @endif
            <div class="company-name">{{ config('app.name', 'PT Custom Etching Xenial') }}</div>
            <div class="company-details">
                @if(config('app.company_address'))
                {{ config('app.company_address') }}<br>
                @endif
                @if(config('app.company_phone'))
                Phone: {{ config('app.company_phone') }}<br>
                @endif
                @if(config('app.company_email'))
                Email: {{ config('app.company_email') }}<br>
                @endif
                @if(config('app.company_tax_id'))
                Tax ID: {{ config('app.company_tax_id') }}
                @endif
            </div>
        </div>
        <div class="document-info">
            <div class="document-title">PURCHASE ORDER</div>
            <div class="po-number">{{ $po->po_number }}</div>
            <div class="issue-date">Issue Date: {{ $po->issue_date->format('d F Y') }}</div>
            @if($po->quote)
            <div class="issue-date">Quote Ref: {{ $po->quote->quote_number }}</div>
            @endif
        </div>
    </div>
</div>
