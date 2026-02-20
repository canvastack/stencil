<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Purchase Order - {{ $document->document_number }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563EB; padding-bottom: 20px; }
        .logo-container { text-align: center; margin-bottom: 15px; }
        .logo { max-width: 200px; max-height: 80px; }
        .company-name { font-size: 24px; font-weight: bold; color: #2563EB; margin-top: 10px; }
        .company-tagline { font-size: 11px; color: #6b7280; font-style: italic; margin-top: 5px; }
        .document-title { font-size: 22px; font-weight: bold; margin-top: 10px; color: #1E40AF; }
        .po-notice { background: #DBEAFE; padding: 8px; margin-top: 10px; border-radius: 4px; font-size: 11px; color: #1E3A8A; }
        .info-section { margin: 20px 0; }
        .party-box { width: 48%; float: left; padding: 15px; border: 1px solid #E5E7EB; border-radius: 5px; background: #F9FAFB; }
        .party-box.right { float: right; }
        .party-title { font-size: 14px; font-weight: bold; color: #1F2937; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #2563EB; }
        .info-row { display: flex; margin: 5px 0; }
        .info-label { width: 120px; font-weight: bold; color: #6B7280; }
        .info-value { color: #111827; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th { background: #F3F4F6; padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold; color: #1F2937; }
        .table td { padding: 10px; border: 1px solid #ddd; }
        .text-right { text-align: right; }
        .total-section { margin-top: 20px; float: right; width: 350px; }
        .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
        .grand-total { font-size: 18px; font-weight: bold; border-top: 3px solid #2563EB; padding-top: 10px; margin-top: 10px; background: #DBEAFE; padding: 10px; border-radius: 4px; }
        .delivery-info { margin-top: 30px; padding: 15px; background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 5px; page-break-inside: avoid; }
        .delivery-info h3 { margin-top: 0; color: #92400E; }
        .quality-section { margin-top: 20px; padding: 15px; background: #F0FDF4; border-left: 4px solid #10B981; page-break-inside: avoid; }
        .terms { margin-top: 30px; page-break-inside: avoid; }
        .penalty-section { margin-top: 20px; padding: 15px; background: #FEE2E2; border-left: 4px solid #DC2626; page-break-inside: avoid; }
        .signature-section { margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .signature-box { width: 45%; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 10px; color: #6b7280; border-top: 1px solid #ddd; padding-top: 10px; }
        .clearfix { clear: both; }
    </style>
</head>
<body>
    <div class="header">
        @if(config('branding.logo_path') && file_exists(public_path(config('branding.logo_path'))))
        <div class="logo-container">
            <img src="{{ public_path(config('branding.logo_path')) }}" alt="{{ $data['company']['name'] }} Logo" class="logo">
        </div>
        @endif
        <div class="company-name">{{ $data['company']['name'] }}</div>
        @if(config('branding.tagline'))
        <div class="company-tagline">{{ config('branding.tagline') }}</div>
        @endif
        <div>{{ $data['company']['address'] }}</div>
        <div>Phone: {{ $data['company']['phone'] }} | Email: {{ $data['company']['email'] }}</div>
        @if(isset($data['company']['website']))
        <div>Website: {{ $data['company']['website'] }}</div>
        @endif
        <div class="document-title">PURCHASE ORDER</div>
        <div class="po-notice">
            <strong>Official Purchase Order</strong> - This document constitutes a binding agreement
        </div>
    </div>

    <div class="info-section">
        <div class="party-box">
            <div class="party-title">FROM (BUYER):</div>
            <div><strong>{{ $data['company']['name'] }}</strong></div>
            <div>{{ $data['company']['address'] }}</div>
            <div>Phone: {{ $data['company']['phone'] }}</div>
            <div>Email: {{ $data['company']['email'] }}</div>
        </div>
        
        <div class="party-box right">
            <div class="party-title">TO (SUPPLIER):</div>
            <div><strong>{{ $data['vendor']['company_name'] }}</strong></div>
            @if($data['vendor']['contact_person'])
            <div>Attn: {{ $data['vendor']['contact_person'] }}</div>
            @endif
            <div>{{ $data['vendor']['address'] }}</div>
            <div>Phone: {{ $data['vendor']['phone'] }}</div>
            <div>Email: {{ $data['vendor']['email'] }}</div>
        </div>
        <div class="clearfix"></div>
    </div>

    <div class="info-section" style="margin-top: 30px;">
        <div style="float: left; width: 48%;">
            <div class="info-row">
                <div class="info-label">PO Number:</div>
                <div class="info-value"><strong>{{ $document->document_number }}</strong></div>
            </div>
            <div class="info-row">
                <div class="info-label">PO Date:</div>
                <div class="info-value">{{ $data['po_date'] }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Order Reference:</div>
                <div class="info-value">{{ $data['order_reference'] }}</div>
            </div>
        </div>
        <div style="float: right; width: 48%;">
            <div class="info-row">
                <div class="info-label">Quote Reference:</div>
                <div class="info-value">{{ $data['customer_quote_reference'] }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Delivery Deadline:</div>
                <div class="info-value"><strong style="color: #DC2626;">{{ $data['delivery_deadline'] }}</strong></div>
            </div>
            <div class="info-row">
                <div class="info-label">Payment Terms:</div>
                <div class="info-value">{{ $data['payment_terms'] }}</div>
            </div>
        </div>
        <div class="clearfix"></div>
    </div>

    <h3 style="margin-top: 30px;">Order Details</h3>
    <table class="table">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 45%;">Item Description & Specifications</th>
                <th style="width: 12.5%;" class="text-right">Quantity</th>
                <th style="width: 17.5%;" class="text-right">Unit Price</th>
                <th style="width: 20%;" class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['items'] as $index => $item)
            <tr>
                <td class="text-right">{{ $index + 1 }}</td>
                <td>
                    <strong>{{ $item['product_name'] }}</strong>
                    @if(isset($item['specifications']) && is_array($item['specifications']))
                    <br><small style="color: #6b7280;">
                        @foreach($item['specifications'] as $key => $value)
                            <strong>{{ ucfirst(str_replace('_', ' ', $key)) }}:</strong> {{ $value }}<br>
                        @endforeach
                    </small>
                    @endif
                    @if(isset($item['notes']))
                    <br><em style="color: #DC2626;">Note: {{ $item['notes'] }}</em>
                    @endif
                </td>
                <td class="text-right">{{ $item['quantity'] }}</td>
                <td class="text-right">{{ number_format($item['unit_price'] / 100, 2) }}</td>
                <td class="text-right">{{ number_format($item['total_price'] / 100, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="total-section">
        <div class="total-row">
            <div>Subtotal:</div>
            <div>{{ number_format($data['pricing']['subtotal'] / 100, 2) }} {{ $data['pricing']['currency'] }}</div>
        </div>
        @if($data['pricing']['tax_amount'] > 0)
        <div class="total-row">
            <div>Tax ({{ $data['pricing']['tax_rate'] }}%):</div>
            <div>{{ number_format($data['pricing']['tax_amount'] / 100, 2) }} {{ $data['pricing']['currency'] }}</div>
        </div>
        @endif
        <div class="total-row grand-total">
            <div>TOTAL PURCHASE ORDER:</div>
            <div>{{ number_format($data['pricing']['total'] / 100, 2) }} {{ $data['pricing']['currency'] }}</div>
        </div>
    </div>
    <div class="clearfix"></div>

    <div class="delivery-info">
        <h3>Delivery Information</h3>
        <div class="info-row">
            <div class="info-label">Delivery Address:</div>
            <div class="info-value">{{ $data['delivery_address'] ?: 'To be confirmed' }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Delivery Deadline:</div>
            <div class="info-value"><strong style="color: #DC2626;">{{ $data['delivery_deadline'] }}</strong></div>
        </div>
        <div class="info-row">
            <div class="info-label">Delivery Method:</div>
            <div class="info-value">As per agreement</div>
        </div>
        <div style="margin-top: 10px; font-size: 11px; color: #92400E;">
            <strong>⚠️ Important:</strong> Late delivery may result in penalties as specified in the penalty clauses section below.
        </div>
    </div>

    @if(isset($data['quality_requirements']) && !empty($data['quality_requirements']))
    <div class="quality-section">
        <h3 style="margin-top: 0; color: #065F46;">Quality Requirements</h3>
        @if(is_array($data['quality_requirements']))
            <ul style="margin: 5px 0; padding-left: 20px;">
                @foreach($data['quality_requirements'] as $requirement)
                <li>{{ $requirement }}</li>
                @endforeach
            </ul>
        @else
            <p style="margin: 5px 0;">{{ $data['quality_requirements'] }}</p>
        @endif
        <div style="margin-top: 10px; font-size: 11px; color: #065F46;">
            <strong>Note:</strong> All items must meet the specified quality standards. Items not meeting requirements will be rejected.
        </div>
    </div>
    @endif

    <div class="terms">
        <h3>Terms & Conditions</h3>
        <div class="info-row">
            <div class="info-label">Payment Terms:</div>
            <div class="info-value">{{ $data['payment_terms'] }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Delivery Terms:</div>
            <div class="info-value">FOB Destination (Freight on Board)</div>
        </div>
        <div class="info-row">
            <div class="info-label">Warranty:</div>
            <div class="info-value">As per standard terms</div>
        </div>
        
        @if(isset($data['terms_conditions']))
        <div style="margin-top: 15px;">
            <strong>General Terms:</strong>
            @if(is_array($data['terms_conditions']))
                <ul style="margin: 5px 0; padding-left: 20px;">
                    @foreach($data['terms_conditions'] as $term)
                    <li>{{ $term }}</li>
                    @endforeach
                </ul>
            @else
                <p style="white-space: pre-wrap; margin: 5px 0;">{{ $data['terms_conditions'] }}</p>
            @endif
        </div>
        @else
        <div style="margin-top: 15px;">
            <ul style="margin: 5px 0; padding-left: 20px;">
                <li>Supplier must acknowledge receipt of this PO within 24 hours.</li>
                <li>All items must be delivered by the specified deadline.</li>
                <li>Items must meet all quality requirements and specifications.</li>
                <li>Supplier must notify buyer immediately of any delays or issues.</li>
                <li>Payment will be made according to payment terms after successful delivery and inspection.</li>
                <li>This PO is subject to the laws of the Republic of Indonesia.</li>
            </ul>
        </div>
        @endif
    </div>

    @if(isset($data['penalty_clauses']) && !empty($data['penalty_clauses']))
    <div class="penalty-section">
        <h3 style="margin-top: 0; color: #991B1B;">Penalty Clauses</h3>
        @if(is_array($data['penalty_clauses']))
            <ul style="margin: 5px 0; padding-left: 20px;">
                @foreach($data['penalty_clauses'] as $clause)
                <li>{{ $clause }}</li>
                @endforeach
            </ul>
        @else
            <p style="margin: 5px 0;">{{ $data['penalty_clauses'] }}</p>
        @endif
        <div style="margin-top: 10px; font-size: 11px; color: #991B1B;">
            <strong>⚠️ Warning:</strong> Failure to comply with the terms of this purchase order may result in penalties and/or termination of agreement.
        </div>
    </div>
    @endif

    <div class="signature-section">
        <div class="signature-box">
            <div><strong>Issued By (Buyer)</strong></div>
            <div class="signature-line">
                <div>{{ $data['company']['name'] }}</div>
                <div style="font-size: 10px; color: #6b7280;">Authorized Signatory</div>
                <div style="font-size: 10px; color: #6b7280;">Date: {{ $data['po_date'] }}</div>
            </div>
        </div>
        <div class="signature-box">
            <div><strong>Acknowledged By (Supplier)</strong></div>
            <div class="signature-line">
                <div>{{ $data['vendor']['company_name'] }}</div>
                <div style="font-size: 10px; color: #6b7280;">Authorized Signatory</div>
                <div style="font-size: 10px; color: #6b7280;">Date: _______________</div>
            </div>
        </div>
    </div>

    <div style="margin-top: 30px; padding: 15px; background: #F3F4F6; border-radius: 5px; page-break-inside: avoid;">
        <h4 style="margin-top: 0;">Acknowledgment Instructions</h4>
        <p style="margin: 5px 0;">Please acknowledge receipt of this purchase order by:</p>
        <ol style="margin: 5px 0; padding-left: 20px;">
            <li>Logging into the vendor portal at: <strong>[Vendor Portal URL]</strong></li>
            <li>Reviewing the complete purchase order details</li>
            <li>Clicking the "Acknowledge PO" button</li>
            <li>Providing any notes or concerns if applicable</li>
        </ol>
        <p style="margin: 10px 0 5px 0;"><strong>Acknowledgment Deadline:</strong> Within 24 hours of receipt</p>
    </div>

    <div class="footer">
        <p><strong>Official Purchase Order</strong> - This document is legally binding upon acknowledgment.</p>
        <p>© {{ date('Y') }} {{ $data['company']['name'] }}. All rights reserved.</p>
        <p style="margin-top: 5px;">For questions or concerns, please contact: {{ $data['company']['email'] }}</p>
    </div>
</body>
</html>
