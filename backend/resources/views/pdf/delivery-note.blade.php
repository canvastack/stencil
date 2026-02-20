<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Delivery Note - {{ $data['order_reference'] }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #10B981; padding-bottom: 20px; }
        .logo-container { text-align: center; margin-bottom: 15px; }
        .logo { max-width: 200px; max-height: 80px; }
        .company-name { font-size: 24px; font-weight: bold; color: #10B981; margin-top: 10px; }
        .company-tagline { font-size: 11px; color: #6b7280; font-style: italic; margin-top: 5px; }
        .document-title { font-size: 22px; font-weight: bold; margin-top: 10px; color: #059669; }
        .delivery-notice { background: #D1FAE5; padding: 8px; margin-top: 10px; border-radius: 4px; font-size: 11px; color: #065F46; }
        .info-section { margin: 20px 0; }
        .party-box { width: 48%; float: left; padding: 15px; border: 1px solid #E5E7EB; border-radius: 5px; background: #F9FAFB; }
        .party-box.right { float: right; }
        .party-title { font-size: 14px; font-weight: bold; color: #1F2937; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #10B981; }
        .info-row { display: flex; margin: 5px 0; }
        .info-label { width: 140px; font-weight: bold; color: #6B7280; }
        .info-value { color: #111827; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th { background: #F3F4F6; padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold; color: #1F2937; }
        .table td { padding: 10px; border: 1px solid #ddd; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .delivery-info { margin-top: 30px; padding: 15px; background: #DBEAFE; border: 1px solid #3B82F6; border-radius: 5px; page-break-inside: avoid; }
        .delivery-info h3 { margin-top: 0; color: #1E40AF; }
        .instructions { margin-top: 20px; padding: 15px; background: #FEF3C7; border-left: 4px solid #F59E0B; page-break-inside: avoid; }
        .signature-section { margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .signature-box { width: 30%; text-align: center; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 10px; color: #6b7280; border-top: 1px solid #ddd; padding-top: 10px; }
        .clearfix { clear: both; }
        .status-badge { display: inline-block; padding: 5px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; }
        .status-pending { background: #FEF3C7; color: #92400E; }
        .status-delivered { background: #D1FAE5; color: #065F46; }
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
        <div class="document-title">DELIVERY NOTE</div>
        <div class="delivery-notice">
            <strong>Goods Delivery Document</strong> - Please verify all items upon receipt
        </div>
    </div>

    <div class="info-section">
        <div class="party-box">
            <div class="party-title">FROM (SENDER):</div>
            <div><strong>{{ $data['company']['name'] }}</strong></div>
            <div>{{ $data['company']['address'] }}</div>
            <div>Phone: {{ $data['company']['phone'] }}</div>
            <div>Email: {{ $data['company']['email'] }}</div>
        </div>
        
        <div class="party-box right">
            <div class="party-title">TO (RECIPIENT):</div>
            <div><strong>{{ $data['customer']['name'] }}</strong></div>
            @if(isset($data['customer']['company']))
            <div>{{ $data['customer']['company'] }}</div>
            @endif
            <div>{{ $data['delivery_address'] }}</div>
            <div>Phone: {{ $data['customer']['phone'] }}</div>
            <div>Email: {{ $data['customer']['email'] }}</div>
        </div>
        <div class="clearfix"></div>
    </div>

    <div class="info-section" style="margin-top: 30px;">
        <div style="float: left; width: 48%;">
            <div class="info-row">
                <div class="info-label">Delivery Note No:</div>
                <div class="info-value"><strong>{{ $document->document_number }}</strong></div>
            </div>
            <div class="info-row">
                <div class="info-label">Delivery Date:</div>
                <div class="info-value">{{ $data['delivery_date'] }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Order Reference:</div>
                <div class="info-value">{{ $data['order_reference'] }}</div>
            </div>
        </div>
        <div style="float: right; width: 48%;">
            <div class="info-row">
                <div class="info-label">Invoice Reference:</div>
                <div class="info-value">{{ $data['invoice_reference'] ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Delivery Method:</div>
                <div class="info-value">{{ $data['delivery_method'] ?? 'Standard Delivery' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Tracking Number:</div>
                <div class="info-value">{{ $data['tracking_number'] ?? 'N/A' }}</div>
            </div>
        </div>
        <div class="clearfix"></div>
    </div>

    <h3 style="margin-top: 30px;">Items Delivered</h3>
    <table class="table">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 45%;">Item Description & Specifications</th>
                <th style="width: 15%;" class="text-center">Ordered Qty</th>
                <th style="width: 15%;" class="text-center">Delivered Qty</th>
                <th style="width: 20%;">Condition</th>
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
                    @if(isset($item['serial_numbers']) && !empty($item['serial_numbers']))
                    <br><small style="color: #059669;"><strong>Serial Numbers:</strong> {{ implode(', ', $item['serial_numbers']) }}</small>
                    @endif
                </td>
                <td class="text-center">{{ $item['ordered_quantity'] }}</td>
                <td class="text-center"><strong>{{ $item['delivered_quantity'] }}</strong></td>
                <td>
                    @if(isset($item['condition']))
                        <span class="status-badge status-delivered">{{ $item['condition'] }}</span>
                    @else
                        <span class="status-badge status-delivered">Good</span>
                    @endif
                    @if(isset($item['notes']))
                    <br><small style="color: #DC2626;">{{ $item['notes'] }}</small>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div style="margin-top: 20px; padding: 10px; background: #F3F4F6; border-radius: 5px;">
        <div class="info-row">
            <div class="info-label">Total Items:</div>
            <div class="info-value"><strong>{{ count($data['items']) }} item(s)</strong></div>
        </div>
        <div class="info-row">
            <div class="info-label">Total Quantity:</div>
            <div class="info-value"><strong>{{ array_sum(array_column($data['items'], 'delivered_quantity')) }} unit(s)</strong></div>
        </div>
        @if(isset($data['total_packages']))
        <div class="info-row">
            <div class="info-label">Total Packages:</div>
            <div class="info-value"><strong>{{ $data['total_packages'] }} package(s)</strong></div>
        </div>
        @endif
    </div>

    <div class="delivery-info">
        <h3>Delivery Information</h3>
        <div class="info-row">
            <div class="info-label">Delivery Address:</div>
            <div class="info-value">{{ $data['delivery_address'] }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Delivery Date:</div>
            <div class="info-value"><strong>{{ $data['delivery_date'] }}</strong></div>
        </div>
        @if(isset($data['delivery_time']))
        <div class="info-row">
            <div class="info-label">Delivery Time:</div>
            <div class="info-value">{{ $data['delivery_time'] }}</div>
        </div>
        @endif
        <div class="info-row">
            <div class="info-label">Delivery Method:</div>
            <div class="info-value">{{ $data['delivery_method'] ?? 'Standard Delivery' }}</div>
        </div>
        @if(isset($data['courier_name']))
        <div class="info-row">
            <div class="info-label">Courier Name:</div>
            <div class="info-value">{{ $data['courier_name'] }}</div>
        </div>
        @endif
        @if(isset($data['courier_phone']))
        <div class="info-row">
            <div class="info-label">Courier Phone:</div>
            <div class="info-value">{{ $data['courier_phone'] }}</div>
        </div>
        @endif
        @if(isset($data['vehicle_number']))
        <div class="info-row">
            <div class="info-label">Vehicle Number:</div>
            <div class="info-value">{{ $data['vehicle_number'] }}</div>
        </div>
        @endif
    </div>

    <div class="instructions">
        <h3 style="margin-top: 0; color: #92400E;">Important Instructions</h3>
        <ul style="margin: 5px 0; padding-left: 20px;">
            <li><strong>Inspect all items immediately upon receipt</strong> - Check for any damage or discrepancies</li>
            <li><strong>Verify quantities</strong> - Ensure delivered quantities match the delivery note</li>
            <li><strong>Check condition</strong> - Examine items for any defects or damage during transit</li>
            <li><strong>Report issues immediately</strong> - Contact us within 24 hours if there are any problems</li>
            <li><strong>Sign and return</strong> - Please sign below to acknowledge receipt of goods</li>
            <li><strong>Keep this document</strong> - Retain for your records and warranty purposes</li>
        </ul>
        @if(isset($data['special_instructions']))
        <div style="margin-top: 10px;">
            <strong>Special Instructions:</strong>
            <p style="margin: 5px 0;">{{ $data['special_instructions'] }}</p>
        </div>
        @endif
    </div>

    @if(isset($data['delivery_notes']) && !empty($data['delivery_notes']))
    <div style="margin-top: 20px; padding: 15px; background: #FEE2E2; border-left: 4px solid #DC2626; page-break-inside: avoid;">
        <h3 style="margin-top: 0; color: #991B1B;">Delivery Notes / Issues</h3>
        <p style="margin: 5px 0;">{{ $data['delivery_notes'] }}</p>
    </div>
    @endif

    <div class="signature-section">
        <div class="signature-box">
            <div><strong>Delivered By</strong></div>
            <div class="signature-line">
                <div>{{ $data['delivered_by'] ?? '_______________' }}</div>
                <div style="font-size: 10px; color: #6b7280;">Name & Signature</div>
                <div style="font-size: 10px; color: #6b7280;">Date: {{ $data['delivery_date'] }}</div>
            </div>
        </div>
        <div class="signature-box">
            <div><strong>Received By</strong></div>
            <div class="signature-line">
                <div>_______________</div>
                <div style="font-size: 10px; color: #6b7280;">Name & Signature</div>
                <div style="font-size: 10px; color: #6b7280;">Date: _______________</div>
            </div>
        </div>
        <div class="signature-box">
            <div><strong>Verified By</strong></div>
            <div class="signature-line">
                <div>_______________</div>
                <div style="font-size: 10px; color: #6b7280;">Name & Signature</div>
                <div style="font-size: 10px; color: #6b7280;">Date: _______________</div>
            </div>
        </div>
    </div>

    <div style="margin-top: 30px; padding: 15px; background: #F3F4F6; border-radius: 5px; page-break-inside: avoid;">
        <h4 style="margin-top: 0;">Acknowledgment & Acceptance</h4>
        <p style="margin: 5px 0;">By signing this delivery note, I acknowledge that:</p>
        <ul style="margin: 5px 0; padding-left: 20px; font-size: 11px;">
            <li>I have received the items listed above in the quantities and condition specified</li>
            <li>I have inspected the items and found them to be satisfactory (or noted any issues above)</li>
            <li>I understand that any claims for damage or shortage must be reported within 24 hours</li>
            <li>This delivery note serves as proof of delivery for the referenced order</li>
        </ul>
        <div style="margin-top: 15px; padding: 10px; background: white; border: 1px dashed #6b7280;">
            <div style="font-size: 11px; color: #6b7280;">
                <strong>Recipient Comments / Issues (if any):</strong>
            </div>
            <div style="height: 40px; margin-top: 5px;"></div>
        </div>
    </div>

    <div class="footer">
        <p><strong>Delivery Note</strong> - This document confirms delivery of goods as specified above.</p>
        <p>© {{ date('Y') }} {{ $data['company']['name'] }}. All rights reserved.</p>
        <p style="margin-top: 5px;">For questions or concerns, please contact: {{ $data['company']['email'] }} | {{ $data['company']['phone'] }}</p>
    </div>
</body>
</html>
