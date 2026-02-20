<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receipt - {{ $document->document_number }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #059669; padding-bottom: 20px; }
        .logo-container { text-align: center; margin-bottom: 15px; }
        .logo { max-width: 200px; max-height: 80px; }
        .company-name { font-size: 24px; font-weight: bold; color: #059669; margin-top: 10px; }
        .company-tagline { font-size: 11px; color: #6b7280; font-style: italic; margin-top: 5px; }
        .document-title { font-size: 22px; font-weight: bold; margin-top: 10px; color: #059669; }
        .receipt-notice { background: #D1FAE5; padding: 10px; margin-top: 10px; border-radius: 4px; font-size: 12px; color: #065F46; text-align: center; }
        .info-section { margin: 20px 0; }
        .info-row { display: flex; margin: 5px 0; }
        .info-label { width: 180px; font-weight: bold; }
        .payment-status { display: inline-block; padding: 5px 15px; background: #D1FAE5; color: #065F46; border-radius: 4px; font-weight: bold; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th { background: #f3f4f6; padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold; }
        .table td { padding: 10px; border: 1px solid #ddd; }
        .text-right { text-align: right; }
        .total-section { margin-top: 20px; float: right; width: 350px; }
        .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
        .subtotal-row { border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px; }
        .grand-total { font-size: 18px; font-weight: bold; border-top: 3px solid #059669; padding-top: 10px; margin-top: 10px; background: #D1FAE5; padding: 10px; border-radius: 4px; }
        .payment-details { margin-top: 40px; padding: 15px; background: #DBEAFE; border: 2px solid #059669; border-radius: 5px; page-break-inside: avoid; }
        .payment-details h3 { margin-top: 0; color: #065F46; }
        .payment-breakdown { margin-top: 20px; padding: 15px; background: #F3F4F6; border-left: 4px solid #059669; }
        .signature-section { margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .signature-box { width: 45%; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
        .stamp-box { width: 150px; height: 150px; border: 2px dashed #059669; margin: 20px auto; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 11px; }
        .thank-you { margin-top: 30px; text-align: center; padding: 20px; background: #FEF3C7; border-radius: 5px; }
        .thank-you h2 { color: #92400E; margin: 0 0 10px 0; }
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
        <div class="document-title">OFFICIAL RECEIPT / KWITANSI</div>
        <div class="receipt-notice">
            <strong>✓ PAYMENT RECEIVED</strong> - This is an official receipt for payment received
        </div>
    </div>

    <div class="info-section">
        <div style="float: left; width: 50%;">
            <h3>Received From / Diterima Dari:</h3>
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
                <div class="info-label">Receipt Number:</div>
                <div><strong>{{ $document->document_number }}</strong></div>
            </div>
            <div class="info-row">
                <div class="info-label">Receipt Date:</div>
                <div>{{ $document->document_date->format('F d, Y') }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Payment Date:</div>
                <div>{{ $payment->paid_at ? $payment->paid_at->format('F d, Y H:i') : now()->format('F d, Y H:i') }}</div>
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
                <div class="info-label">Payment Status:</div>
                <div><span class="payment-status">PAID</span></div>
            </div>
        </div>
        <div style="clear: both;"></div>
    </div>

    <h3>Order Details / Rincian Pesanan</h3>
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
        <div class="total-row">
            <div>VAT / PPN ({{ $quote->tax_rate }}%):</div>
            <div>{{ number_format($quote->tax_amount / 100, 2) }} {{ $quote->currency }}</div>
        </div>
        <div class="total-row grand-total">
            <div>TOTAL AMOUNT / JUMLAH TOTAL:</div>
            <div>{{ number_format($quote->grand_total / 100, 2) }} {{ $quote->currency }}</div>
        </div>
    </div>
    <div style="clear: both;"></div>

    <div class="payment-details">
        <h3>Payment Details / Rincian Pembayaran</h3>
        <div class="info-row">
            <div class="info-label">Payment Type:</div>
            <div><strong>{{ ucfirst($payment->type ?? 'Payment') }}</strong></div>
        </div>
        <div class="info-row">
            <div class="info-label">Payment Method:</div>
            <div>{{ ucfirst(str_replace('_', ' ', $payment->method ?? 'Bank Transfer')) }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Amount Paid:</div>
            <div><strong style="color: #059669; font-size: 16px;">{{ number_format($payment->amount / 100, 2) }} {{ $quote->currency }}</strong></div>
        </div>
        <div class="info-row">
            <div class="info-label">Payment Date:</div>
            <div>{{ $payment->paid_at ? $payment->paid_at->format('F d, Y H:i:s') : now()->format('F d, Y H:i:s') }}</div>
        </div>
        @if($payment->reference)
        <div class="info-row">
            <div class="info-label">Payment Reference:</div>
            <div>{{ $payment->reference }}</div>
        </div>
        @endif
        @if($payment->verified_by ?? false)
        <div class="info-row">
            <div class="info-label">Verified By:</div>
            <div>{{ $payment->verifiedBy->name ?? 'System' }}</div>
        </div>
        @endif
        @if($payment->verification_notes ?? false)
        <div style="margin-top: 10px;">
            <strong>Verification Notes:</strong>
            <div style="margin-left: 20px; color: #6b7280;">{{ $payment->verification_notes }}</div>
        </div>
        @endif
    </div>

    <div class="payment-breakdown">
        <h3 style="margin-top: 0;">Payment Summary / Ringkasan Pembayaran</h3>
        <div class="info-row">
            <div class="info-label">Total Order Amount:</div>
            <div>{{ number_format($quote->grand_total / 100, 2) }} {{ $quote->currency }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Amount Paid:</div>
            <div><strong style="color: #059669;">{{ number_format($payment->amount / 100, 2) }} {{ $quote->currency }}</strong></div>
        </div>
        <div class="info-row">
            <div class="info-label">Payment Status:</div>
            <div><strong style="color: #059669;">{{ $payment->amount >= $quote->grand_total ? 'PAID IN FULL' : 'PARTIAL PAYMENT' }}</strong></div>
        </div>
        @if($payment->amount >= $quote->grand_total)
        <div style="margin-top: 15px; padding: 10px; background: #D1FAE5; border-radius: 4px; text-align: center;">
            <strong style="color: #065F46;">✓ Full payment received. Thank you for your business!</strong>
        </div>
        @else
        <div class="info-row">
            <div class="info-label">Remaining Balance:</div>
            <div><strong style="color: #DC2626;">{{ number_format(($quote->grand_total - $payment->amount) / 100, 2) }} {{ $quote->currency }}</strong></div>
        </div>
        <div style="margin-top: 15px; padding: 10px; background: #FEF3C7; border-radius: 4px;">
            <strong>Note:</strong> This receipt is for a partial payment. The remaining balance of {{ number_format(($quote->grand_total - $payment->amount) / 100, 2) }} {{ $quote->currency }} is due before delivery as per the agreed payment terms.
        </div>
        @endif
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <div><strong>Received By / Diterima Oleh</strong></div>
            <div><strong>{{ config('branding.company_name', config('app.name')) }}</strong></div>
            <div class="signature-line">
                <div>Authorized Signatory</div>
                <div style="font-size: 10px; color: #6b7280;">Finance Department</div>
            </div>
            <div class="stamp-box">
                Company Stamp<br>Here
            </div>
        </div>
        <div class="signature-box">
            <div><strong>Paid By / Dibayar Oleh</strong></div>
            <div><strong>{{ $quote->order->customer->name }}</strong></div>
            <div class="signature-line">
                <div>Customer Signature</div>
                <div style="font-size: 10px; color: #6b7280;">Date: {{ $payment->paid_at ? $payment->paid_at->format('F d, Y') : now()->format('F d, Y') }}</div>
            </div>
        </div>
    </div>

    <div class="thank-you">
        <h2>Thank You for Your Payment!</h2>
        <p>We appreciate your business and look forward to serving you again.</p>
        <p style="margin-top: 10px; font-size: 11px; color: #6b7280;">
            This receipt is computer-generated and serves as official proof of payment.<br>
            For any inquiries, please contact us at {{ config('mail.from.address') }} or call +62 xxx xxx xxxx
        </p>
    </div>

    <div style="margin-top: 30px; padding: 15px; background: #F3F4F6; border-radius: 5px; font-size: 11px;">
        <strong>Important Notes / Catatan Penting:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
            <li>This receipt is an official document for accounting and tax purposes.</li>
            <li>Please keep this receipt for your records.</li>
            <li>This receipt confirms that payment has been received and verified.</li>
            <li>Goods/services will be delivered as per the agreed terms and timeline.</li>
            <li>For any payment disputes, please contact us within 7 days of receipt date.</li>
        </ul>
    </div>

    <div class="footer">
        <p><strong>Official Payment Receipt</strong> - This document is computer-generated and legally valid.</p>
        <p>© {{ date('Y') }} {{ config('branding.company_name', config('app.name')) }}. All rights reserved. | NPWP: {{ config('branding.tax_id', 'xx.xxx.xxx.x-xxx.xxx') }}</p>
        @if(config('branding.footer_text'))
        <p>{{ config('branding.footer_text') }}</p>
        @endif
    </div>
</body>
</html>
