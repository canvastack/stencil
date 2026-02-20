<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Proforma Invoice - {{ $document->document_number }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
        .logo-container { text-align: center; margin-bottom: 15px; }
        .logo { max-width: 200px; max-height: 80px; }
        .company-name { font-size: 24px; font-weight: bold; color: #4F46E5; margin-top: 10px; }
        .company-tagline { font-size: 11px; color: #6b7280; font-style: italic; margin-top: 5px; }
        .document-title { font-size: 20px; font-weight: bold; margin-top: 10px; color: #DC2626; }
        .info-section { margin: 20px 0; }
        .info-row { display: flex; margin: 5px 0; }
        .info-label { width: 150px; font-weight: bold; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th { background: #f3f4f6; padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold; }
        .table td { padding: 10px; border: 1px solid #ddd; }
        .text-right { text-align: right; }
        .total-section { margin-top: 20px; float: right; width: 350px; }
        .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
        .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
        .payment-section { margin-top: 40px; padding: 15px; background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 5px; page-break-inside: avoid; }
        .payment-section h3 { margin-top: 0; color: #92400E; }
        .terms { margin-top: 30px; page-break-inside: avoid; }
        .notice { margin-top: 20px; padding: 10px; background: #FEE2E2; border-left: 4px solid #DC2626; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 10px; color: #6b7280; border-top: 1px solid #ddd; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        @if(config('branding.logo_path') && file_exists(public_path(config('branding.logo_path'))))
        <div class="logo-container">
            <img src="{{ public_path(config('branding.logo_path')) }}" alt="{{ config('app.name') }} Logo" class="logo">
        </div>
        @endif
        <div class="company-name">{{ config('branding.company_name', config('app.name')) }}</div>
        @if(config('branding.tagline'))
        <div class="company-tagline">{{ config('branding.tagline') }}</div>
        @endif
        <div>{{ config('branding.address', 'Address Line 1') }}</div>
        <div>Phone: {{ config('branding.phone', '+62 xxx xxx xxxx') }} | Email: {{ config('branding.email', 'info@example.com') }}</div>
        @if(config('branding.website'))
        <div>Website: {{ config('branding.website') }}</div>
        @endif
        <div class="document-title">PROFORMA INVOICE</div>
    </div>

    <div class="info-section">
        <div style="float: left; width: 50%;">
            <h3>Bill To:</h3>
            <div><strong>{{ $quote->order->customer->name }}</strong></div>
            <div>{{ $quote->order->customer->email }}</div>
            <div>{{ $quote->order->customer->phone }}</div>
            @if($quote->order->customer->address)
            <div>{{ $quote->order->customer->address }}</div>
            @endif
        </div>
        <div style="float: right; width: 40%;">
            <div class="info-row">
                <div class="info-label">Invoice Number:</div>
                <div><strong>{{ $document->document_number }}</strong></div>
            </div>
            <div class="info-row">
                <div class="info-label">Invoice Date:</div>
                <div>{{ $document->document_date->format('F d, Y') }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Quote Number:</div>
                <div>{{ $quote->quote_number }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Order Number:</div>
                <div>{{ $quote->order->order_number }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Payment Due:</div>
                <div><strong>{{ $payment->payment_due_date->format('F d, Y') }}</strong></div>
            </div>
        </div>
        <div style="clear: both;"></div>
    </div>

    <h3>Invoice Details</h3>
    <table class="table">
        <thead>
            <tr>
                <th style="width: 50%;">Description</th>
                <th style="width: 15%;" class="text-right">Quantity</th>
                <th style="width: 17.5%;" class="text-right">Unit Price</th>
                <th style="width: 17.5%;" class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($quote->order->items as $item)
            <tr>
                <td>
                    <strong>{{ $item['product_name'] ?? 'Product' }}</strong>
                    @if(isset($item['specifications']))
                    <br><small style="color: #6b7280;">
                        @foreach($item['specifications'] as $key => $value)
                            {{ ucfirst(str_replace('_', ' ', $key)) }}: {{ $value }}<br>
                        @endforeach
                    </small>
                    @endif
                </td>
                <td class="text-right">{{ $item['quantity'] ?? 1 }}</td>
                <td class="text-right">{{ number_format(($item['pricing']['unit_price'] ?? 0) / 100, 2) }}</td>
                <td class="text-right">{{ number_format(($item['pricing']['total_price'] ?? 0) / 100, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="total-section">
        <div class="total-row">
            <div>Subtotal:</div>
            <div>{{ number_format($quote->subtotal / 100, 2) }} {{ $quote->currency }}</div>
        </div>
        @if($quote->handling_fee > 0)
        <div class="total-row">
            <div>Handling Fee:</div>
            <div>{{ number_format($quote->handling_fee / 100, 2) }} {{ $quote->currency }}</div>
        </div>
        @endif
        @if($quote->shipping_cost > 0)
        <div class="total-row">
            <div>Shipping:</div>
            <div>{{ number_format($quote->shipping_cost / 100, 2) }} {{ $quote->currency }}</div>
        </div>
        @endif
        @if($quote->insurance > 0)
        <div class="total-row">
            <div>Insurance:</div>
            <div>{{ number_format($quote->insurance / 100, 2) }} {{ $quote->currency }}</div>
        </div>
        @endif
        @if($quote->other_costs > 0)
        <div class="total-row">
            <div>{{ $quote->other_costs_description ?? 'Other Costs' }}:</div>
            <div>{{ number_format($quote->other_costs / 100, 2) }} {{ $quote->currency }}</div>
        </div>
        @endif
        <div class="total-row">
            <div>Tax ({{ $quote->tax_rate }}%):</div>
            <div>{{ number_format($quote->tax_amount / 100, 2) }} {{ $quote->currency }}</div>
        </div>
        <div class="total-row grand-total">
            <div>TOTAL AMOUNT DUE:</div>
            <div>{{ number_format($quote->grand_total / 100, 2) }} {{ $quote->currency }}</div>
        </div>
        @if($payment->payment_type === 'deposit')
        <div class="total-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
            <div>Down Payment ({{ $payment->payment_percentage }}%):</div>
            <div><strong>{{ number_format($payment->amount / 100, 2) }} {{ $quote->currency }}</strong></div>
        </div>
        @endif
    </div>
    <div style="clear: both;"></div>

    <div class="payment-section">
        <h3>Payment Instructions</h3>
        <div class="info-row">
            <div class="info-label">Payment Type:</div>
            <div><strong>{{ ucfirst($payment->payment_type) }} Payment</strong></div>
        </div>
        <div class="info-row">
            <div class="info-label">Amount to Pay:</div>
            <div><strong>{{ number_format($payment->amount / 100, 2) }} {{ $quote->currency }}</strong></div>
        </div>
        <div class="info-row">
            <div class="info-label">Payment Due Date:</div>
            <div><strong>{{ $payment->payment_due_date->format('F d, Y') }}</strong></div>
        </div>
        <div class="info-row">
            <div class="info-label">Payment Method:</div>
            <div>{{ $payment->payment_method ?? 'Bank Transfer' }}</div>
        </div>
        @if(isset($bankDetails))
        <div style="margin-top: 15px;">
            <strong>Bank Transfer Details:</strong>
            <div style="margin-left: 20px; margin-top: 5px;">
                <div>Bank Name: {{ $bankDetails['bank_name'] ?? 'Bank Name' }}</div>
                <div>Account Name: {{ $bankDetails['account_name'] ?? 'Account Name' }}</div>
                <div>Account Number: {{ $bankDetails['account_number'] ?? 'xxxx-xxxx-xxxx' }}</div>
                @if(isset($bankDetails['swift_code']))
                <div>SWIFT Code: {{ $bankDetails['swift_code'] }}</div>
                @endif
            </div>
        </div>
        @endif
        <div style="margin-top: 15px;">
            <strong>Payment Reference:</strong> {{ $quote->quote_number }}
        </div>
    </div>

    <div class="notice">
        <strong>Important Notice:</strong> This is a Proforma Invoice and not a tax invoice. Payment must be received before goods/services are delivered. This invoice is valid until {{ $quote->valid_until->format('F d, Y') }}.
    </div>

    <div class="terms">
        <h3>Terms & Conditions</h3>
        <div class="info-row">
            <div class="info-label">Payment Terms:</div>
            <div>{{ $quote->payment_terms }}</div>
        </div>
        @if($quote->delivery_timeline)
        <div class="info-row">
            <div class="info-label">Delivery Timeline:</div>
            <div>{{ $quote->delivery_timeline }}</div>
        </div>
        @endif
        @if($quote->terms_and_conditions)
        <div style="margin-top: 15px;">
            <strong>Additional Terms:</strong>
            <p style="white-space: pre-wrap;">{{ $quote->terms_and_conditions }}</p>
        </div>
        @endif
        <div style="margin-top: 15px;">
            <ul style="margin: 5px 0; padding-left: 20px;">
                <li>This proforma invoice is valid until the date specified above.</li>
                <li>Payment must be received before order processing begins.</li>
                <li>Prices are subject to change without prior notice after expiry date.</li>
                <li>Delivery timeline starts after payment confirmation.</li>
                <li>All disputes subject to local jurisdiction.</li>
            </ul>
        </div>
    </div>

    <div class="footer">
        <p>This is a computer-generated proforma invoice and does not require a signature.</p>
        <p>© {{ date('Y') }} {{ config('branding.company_name', config('app.name')) }}. All rights reserved.</p>
        @if(config('branding.footer_text'))
        <p>{{ config('branding.footer_text') }}</p>
        @endif
    </div>
</body>
</html>
