<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Tax Invoice - {{ $document->document_number }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4F46E5; padding-bottom: 20px; }
        .logo-container { text-align: center; margin-bottom: 15px; }
        .logo { max-width: 200px; max-height: 80px; }
        .company-name { font-size: 24px; font-weight: bold; color: #4F46E5; margin-top: 10px; }
        .company-tagline { font-size: 11px; color: #6b7280; font-style: italic; margin-top: 5px; }
        .document-title { font-size: 22px; font-weight: bold; margin-top: 10px; color: #059669; }
        .tax-notice { background: #D1FAE5; padding: 8px; margin-top: 10px; border-radius: 4px; font-size: 11px; color: #065F46; }
        .info-section { margin: 20px 0; }
        .info-row { display: flex; margin: 5px 0; }
        .info-label { width: 150px; font-weight: bold; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th { background: #f3f4f6; padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold; }
        .table td { padding: 10px; border: 1px solid #ddd; }
        .text-right { text-align: right; }
        .total-section { margin-top: 20px; float: right; width: 350px; }
        .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
        .subtotal-row { border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px; }
        .tax-row { background: #FEF3C7; padding: 8px; margin: 5px 0; border-radius: 4px; font-weight: bold; }
        .grand-total { font-size: 18px; font-weight: bold; border-top: 3px solid #333; padding-top: 10px; margin-top: 10px; background: #F3F4F6; padding: 10px; border-radius: 4px; }
        .payment-info { margin-top: 40px; padding: 15px; background: #DBEAFE; border: 1px solid #3B82F6; border-radius: 5px; page-break-inside: avoid; }
        .payment-info h3 { margin-top: 0; color: #1E40AF; }
        .terms { margin-top: 30px; page-break-inside: avoid; }
        .signature-section { margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .signature-box { width: 45%; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
        .tax-details { margin-top: 20px; padding: 15px; background: #F3F4F6; border-left: 4px solid #059669; }
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
        <div>NPWP: {{ config('branding.tax_id', 'xx.xxx.xxx.x-xxx.xxx') }} (Tax ID Number)</div>
        @if(config('branding.website'))
        <div>Website: {{ config('branding.website') }}</div>
        @endif
        <div class="document-title">TAX INVOICE / FAKTUR PAJAK</div>
        <div class="tax-notice">
            <strong>Official Tax Document</strong> - This invoice is valid for tax deduction purposes
        </div>
    </div>

    <div class="info-section">
        <div style="float: left; width: 50%;">
            <h3>Bill To / Ditagih Kepada:</h3>
            <div><strong>{{ $quote->order->customer->name }}</strong></div>
            <div>{{ $quote->order->customer->email }}</div>
            <div>{{ $quote->order->customer->phone }}</div>
            @if($quote->order->customer->address)
            <div>{{ $quote->order->customer->address }}</div>
            @endif
            @if(isset($quote->order->customer->tax_id))
            <div style="margin-top: 10px;">
                <strong>Customer NPWP:</strong> {{ $quote->order->customer->tax_id }}
            </div>
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
            @if(isset($payment))
            <div class="info-row">
                <div class="info-label">Payment Date:</div>
                <div>{{ $payment->verified_at ? $payment->verified_at->format('F d, Y') : 'Pending' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Payment Status:</div>
                <div><strong style="color: #059669;">{{ ucfirst($payment->status) }}</strong></div>
            </div>
            @endif
        </div>
        <div style="clear: both;"></div>
    </div>

    <h3>Invoice Details / Rincian Tagihan</h3>
    <table class="table">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 45%;">Description / Deskripsi</th>
                <th style="width: 12.5%;" class="text-right">Qty</th>
                <th style="width: 17.5%;" class="text-right">Unit Price / Harga</th>
                <th style="width: 20%;" class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($quote->order->items as $index => $item)
            <tr>
                <td class="text-right">{{ $index + 1 }}</td>
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
            <div>Subtotal (Before Tax):</div>
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
            <div>Shipping Cost:</div>
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
        <div class="total-row subtotal-row">
            <div><strong>Subtotal (Taxable Amount):</strong></div>
            <div><strong>{{ number_format($quote->subtotal / 100, 2) }} {{ $quote->currency }}</strong></div>
        </div>
        <div class="total-row tax-row">
            <div>VAT / PPN ({{ $quote->tax_rate }}%):</div>
            <div>{{ number_format($quote->tax_amount / 100, 2) }} {{ $quote->currency }}</div>
        </div>
        <div class="total-row grand-total">
            <div>TOTAL AMOUNT / JUMLAH TOTAL:</div>
            <div>{{ number_format($quote->grand_total / 100, 2) }} {{ $quote->currency }}</div>
        </div>
    </div>
    <div style="clear: both;"></div>

    <div class="tax-details">
        <h3 style="margin-top: 0;">Tax Information / Informasi Pajak</h3>
        <div class="info-row">
            <div class="info-label">Tax Type:</div>
            <div>Value Added Tax (VAT) / Pajak Pertambahan Nilai (PPN)</div>
        </div>
        <div class="info-row">
            <div class="info-label">Tax Rate:</div>
            <div>{{ $quote->tax_rate }}%</div>
        </div>
        <div class="info-row">
            <div class="info-label">Taxable Base:</div>
            <div>{{ number_format($quote->subtotal / 100, 2) }} {{ $quote->currency }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Tax Amount:</div>
            <div><strong>{{ number_format($quote->tax_amount / 100, 2) }} {{ $quote->currency }}</strong></div>
        </div>
        <div style="margin-top: 10px; font-size: 11px; color: #6b7280;">
            <em>This tax invoice is issued in accordance with Indonesian tax regulations and is valid for tax deduction purposes.</em>
        </div>
    </div>

    @if(isset($payment))
    <div class="payment-info">
        <h3>Payment Information / Informasi Pembayaran</h3>
        <div class="info-row">
            <div class="info-label">Payment Status:</div>
            <div><strong style="color: #059669;">{{ ucfirst($payment->status) }}</strong></div>
        </div>
        <div class="info-row">
            <div class="info-label">Payment Method:</div>
            <div>{{ $payment->payment_method ?? 'Bank Transfer' }}</div>
        </div>
        @if($payment->verified_at)
        <div class="info-row">
            <div class="info-label">Payment Date:</div>
            <div>{{ $payment->verified_at->format('F d, Y H:i') }}</div>
        </div>
        @endif
        <div class="info-row">
            <div class="info-label">Amount Paid:</div>
            <div><strong>{{ number_format($payment->amount / 100, 2) }} {{ $quote->currency }}</strong></div>
        </div>
        @if($payment->payment_type === 'deposit')
        <div style="margin-top: 10px; padding: 10px; background: #FEF3C7; border-radius: 4px;">
            <strong>Note:</strong> This is a {{ $payment->payment_percentage }}% down payment. Balance payment of {{ number_format(($quote->grand_total - $payment->amount) / 100, 2) }} {{ $quote->currency }} is due before delivery.
        </div>
        @endif
    </div>
    @endif

    <div class="terms">
        <h3>Terms & Conditions / Syarat & Ketentuan</h3>
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
                <li>This tax invoice is a legal document for tax purposes.</li>
                <li>Goods remain the property of the seller until full payment is received.</li>
                <li>Any disputes arising from this invoice shall be subject to local jurisdiction.</li>
                <li>This invoice is computer-generated and valid without signature.</li>
            </ul>
        </div>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <div><strong>Issued By / Diterbitkan Oleh</strong></div>
            <div class="signature-line">
                <div>{{ config('branding.company_name', config('app.name')) }}</div>
                <div style="font-size: 10px; color: #6b7280;">Authorized Signatory</div>
            </div>
        </div>
        <div class="signature-box">
            <div><strong>Received By / Diterima Oleh</strong></div>
            <div class="signature-line">
                <div>{{ $quote->order->customer->name }}</div>
                <div style="font-size: 10px; color: #6b7280;">Customer Signature</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p><strong>Official Tax Invoice</strong> - This document is computer-generated and legally valid.</p>
        <p>© {{ date('Y') }} {{ config('branding.company_name', config('app.name')) }}. All rights reserved. | NPWP: {{ config('branding.tax_id', 'xx.xxx.xxx.x-xxx.xxx') }}</p>
        @if(config('branding.footer_text'))
        <p>{{ config('branding.footer_text') }}</p>
        @endif
    </div>
</body>
</html>
