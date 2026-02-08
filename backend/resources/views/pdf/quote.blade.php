<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quote {{ $quote['quote_number'] }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
        }
        
        .header h1 {
            font-size: 24px;
            color: #1e40af;
            margin-bottom: 5px;
        }
        
        .header .quote-number {
            font-size: 14px;
            color: #64748b;
            font-weight: bold;
        }
        
        .info-section {
            margin-bottom: 25px;
        }
        
        .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }
        
        .info-row {
            display: table-row;
        }
        
        .info-cell {
            display: table-cell;
            padding: 8px;
            vertical-align: top;
            width: 50%;
        }
        
        .info-box {
            background: #f8fafc;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #e2e8f0;
        }
        
        .info-box h3 {
            font-size: 13px;
            color: #1e40af;
            margin-bottom: 10px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 5px;
        }
        
        .info-box p {
            margin: 5px 0;
            font-size: 11px;
        }
        
        .info-box .label {
            color: #64748b;
            font-weight: 600;
        }
        
        .summary-box {
            background: #eff6ff;
            padding: 15px;
            border-radius: 5px;
            border: 2px solid #3b82f6;
            margin-bottom: 20px;
        }
        
        .summary-grid {
            display: table;
            width: 100%;
        }
        
        .summary-row {
            display: table-row;
        }
        
        .summary-cell {
            display: table-cell;
            padding: 8px;
            width: 33.33%;
        }
        
        .summary-item h4 {
            font-size: 10px;
            color: #64748b;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        
        .summary-item .value {
            font-size: 16px;
            font-weight: bold;
            color: #1e40af;
        }
        
        .summary-item .sub-value {
            font-size: 9px;
            color: #64748b;
            margin-top: 2px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .items-table th {
            background: #1e40af;
            color: white;
            padding: 10px;
            text-align: left;
            font-size: 11px;
            font-weight: 600;
        }
        
        .items-table td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10px;
        }
        
        .items-table tr:nth-child(even) {
            background: #f8fafc;
        }
        
        .item-description {
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 5px;
        }
        
        .item-specs {
            font-size: 9px;
            color: #64748b;
            margin-top: 5px;
        }
        
        .item-specs dt {
            font-weight: 600;
            display: inline;
        }
        
        .item-specs dd {
            display: inline;
            margin-left: 5px;
            margin-right: 15px;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .total-row {
            background: #eff6ff !important;
            font-weight: bold;
            font-size: 12px;
        }
        
        .total-row td {
            padding: 15px 10px;
            border-top: 2px solid #3b82f6;
        }
        
        .terms-section {
            margin-top: 30px;
            padding: 15px;
            background: #f8fafc;
            border-radius: 5px;
            border: 1px solid #e2e8f0;
        }
        
        .terms-section h3 {
            font-size: 13px;
            color: #1e40af;
            margin-bottom: 10px;
        }
        
        .terms-section p {
            font-size: 10px;
            line-height: 1.8;
            color: #475569;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-draft { background: #f1f5f9; color: #475569; }
        .status-sent { background: #dbeafe; color: #1e40af; }
        .status-accepted { background: #dcfce7; color: #166534; }
        .status-rejected { background: #fee2e2; color: #991b1b; }
        .status-expired { background: #f1f5f9; color: #64748b; }
        
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <div class="container">
        {{-- Header --}}
        <div class="header">
            <h1>QUOTATION</h1>
            <div class="quote-number">{{ $quote['quote_number'] }}</div>
            <div style="margin-top: 10px;">
                <span class="status-badge status-{{ $quote['status'] }}">
                    {{ strtoupper($quote['status']) }}
                </span>
            </div>
        </div>

        {{-- Summary Box --}}
        <div class="summary-box">
            <div class="summary-grid">
                <div class="summary-row">
                    <div class="summary-cell">
                        <div class="summary-item">
                            <h4>Total Amount</h4>
                            <div class="value">{{ $quote['currency'] ?? 'IDR' }} {{ number_format($quote['grand_total'] ?? 0, 2) }}</div>
                            <div class="sub-value">≈ ${{ number_format(($quote['grand_total'] ?? 0) / $exchangeRate, 2) }}</div>
                        </div>
                    </div>
                    <div class="summary-cell">
                        <div class="summary-item">
                            <h4>Valid Until</h4>
                            @if(!empty($quote['valid_until']))
                            <div class="value">{{ date('M d, Y', strtotime($quote['valid_until'])) }}</div>
                            <div class="sub-value">{{ \Carbon\Carbon::parse($quote['valid_until'])->diffForHumans() }}</div>
                            @else
                            <div class="value">Not Set</div>
                            <div class="sub-value">-</div>
                            @endif
                        </div>
                    </div>
                    <div class="summary-cell">
                        <div class="summary-item">
                            <h4>Exchange Rate</h4>
                            <div class="value">1 USD = {{ number_format($exchangeRate, 0) }}</div>
                            <div class="sub-value">{{ $quote['currency'] ?? 'IDR' }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {{-- Customer & Vendor Info --}}
        <div class="info-grid">
            <div class="info-row">
                <div class="info-cell">
                    <div class="info-box">
                        <h3>Customer Information</h3>
                        @if(!empty($quote['customer']))
                        <p><span class="label">Name:</span> {{ $quote['customer']['name'] ?? 'N/A' }}</p>
                        @if(!empty($quote['customer']['company']))
                        <p><span class="label">Company:</span> {{ $quote['customer']['company'] }}</p>
                        @endif
                        <p><span class="label">Email:</span> {{ $quote['customer']['email'] ?? 'N/A' }}</p>
                        @else
                        <p>Customer information not available</p>
                        @endif
                    </div>
                </div>
                <div class="info-cell">
                    <div class="info-box">
                        <h3>Vendor Information</h3>
                        @if(!empty($quote['vendor']))
                        <p><span class="label">Name:</span> {{ $quote['vendor']['name'] ?? 'N/A' }}</p>
                        @if(!empty($quote['vendor']['company']))
                        <p><span class="label">Company:</span> {{ $quote['vendor']['company'] }}</p>
                        @endif
                        <p><span class="label">Email:</span> {{ $quote['vendor']['email'] ?? 'N/A' }}</p>
                        @else
                        <p>Vendor information not available</p>
                        @endif
                    </div>
                </div>
            </div>
        </div>

        {{-- Quote Information --}}
        @if(!empty($quote['title']) || !empty($quote['description']))
        <div class="info-section">
            <div class="info-box">
                <h3>Quote Information</h3>
                @if(!empty($quote['title']))
                <p><span class="label">Title:</span> {{ $quote['title'] }}</p>
                @endif
                @if(!empty($quote['description']))
                <p style="margin-top: 8px;">{{ $quote['description'] }}</p>
                @endif
            </div>
        </div>
        @endif

        {{-- Items Table --}}
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 35%;">Description</th>
                    <th style="width: 10%;" class="text-center">Qty</th>
                    <th style="width: 15%;" class="text-right">Unit Price</th>
                    <th style="width: 15%;" class="text-right">Vendor Cost</th>
                    <th style="width: 20%;" class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                @if(!empty($quote['items']) && is_array($quote['items']))
                    @foreach($quote['items'] as $index => $item)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td>
                            <div class="item-description">{{ $item['description'] ?? 'No description' }}</div>
                            @if(!empty($item['specifications']) && is_array($item['specifications']))
                            <dl class="item-specs">
                                @foreach($item['specifications'] as $key => $value)
                                    @if(!empty($value))
                                    <dt>{{ ucfirst(str_replace('_', ' ', $key)) }}:</dt>
                                    <dd>{{ is_array($value) ? implode(', ', $value) : $value }}</dd>
                                    @endif
                                @endforeach
                            </dl>
                            @endif
                        </td>
                        <td class="text-center">{{ number_format($item['quantity'] ?? 0) }}</td>
                        <td class="text-right">{{ $quote['currency'] ?? 'IDR' }} {{ number_format($item['unit_price'] ?? 0, 2) }}</td>
                        <td class="text-right">{{ $quote['currency'] ?? 'IDR' }} {{ number_format($item['vendor_cost'] ?? 0, 2) }}</td>
                        <td class="text-right">{{ $quote['currency'] ?? 'IDR' }} {{ number_format($item['total_price'] ?? 0, 2) }}</td>
                    </tr>
                    @endforeach
                @else
                    <tr>
                        <td colspan="6" class="text-center">No items available</td>
                    </tr>
                @endif
                
                {{-- Total Row --}}
                <tr class="total-row">
                    <td colspan="5" class="text-right">TOTAL AMOUNT:</td>
                    <td class="text-right">{{ $quote['currency'] ?? 'IDR' }} {{ number_format($quote['grand_total'] ?? 0, 2) }}</td>
                </tr>
            </tbody>
        </table>

        {{-- Terms & Conditions --}}
        @if(!empty($quote['terms_and_conditions']))
        <div class="terms-section">
            <h3>Terms & Conditions</h3>
            <p>{!! nl2br(strip_tags($quote['terms_and_conditions'])) !!}</p>
        </div>
        @endif

        {{-- Footer --}}
        <div class="footer">
            <p>Generated on {{ date('F d, Y \a\t H:i:s') }}</p>
            <p>Quote ID: {{ $quote['id'] }} | Created: {{ date('M d, Y', strtotime($quote['created_at'])) }}</p>
        </div>
    </div>
</body>
</html>
