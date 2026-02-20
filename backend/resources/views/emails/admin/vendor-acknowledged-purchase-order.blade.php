<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vendor Acknowledged Purchase Order</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #10b981;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
        }
        .info-box {
            background-color: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
            border-left: 4px solid #10b981;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: bold;
            color: #6b7280;
        }
        .value {
            color: #111827;
        }
        .notes-box {
            background-color: #fef3c7;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            border-left: 4px solid #f59e0b;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 5px;
        }
        .button:hover {
            background-color: #2563eb;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .success-badge {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>✓ Purchase Order Acknowledged</h1>
        <p>Vendor has confirmed receipt and will begin production</p>
    </div>

    <div class="content">
        <p>Hello {{ $admin->name }},</p>

        <p>
            <strong>{{ $vendor->name }}</strong> has acknowledged purchase order 
            <strong>{{ $purchaseOrder->document_number }}</strong> for order 
            <strong>{{ $order->order_number }}</strong>.
        </p>

        <div class="info-box">
            <h3 style="margin-top: 0;">Purchase Order Details</h3>
            
            <div class="info-row">
                <span class="label">PO Number:</span>
                <span class="value">{{ $purchaseOrder->document_number }}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Order Number:</span>
                <span class="value">{{ $order->order_number }}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Vendor:</span>
                <span class="value">{{ $vendor->name }}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Customer:</span>
                <span class="value">{{ $order->customer->name }}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Acknowledged At:</span>
                <span class="value">{{ $acknowledgedAt->format('d M Y, H:i') }}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Acknowledged By:</span>
                <span class="value">{{ $acknowledgedBy->name ?? 'Vendor User' }}</span>
            </div>
            
            <div class="info-row">
                <span class="label">Status:</span>
                <span class="value"><span class="success-badge">ACKNOWLEDGED</span></span>
            </div>
        </div>

        @if($acknowledgmentNotes)
        <div class="notes-box">
            <h4 style="margin-top: 0;">Vendor Notes:</h4>
            <p style="margin-bottom: 0;">{{ $acknowledgmentNotes }}</p>
        </div>
        @endif

        <p><strong>Next Steps:</strong></p>
        <ul>
            <li>Vendor will begin production as per the purchase order</li>
            <li>Order status has been updated to "Production"</li>
            <li>Monitor production progress in the admin panel</li>
            <li>Vendor will notify when ready for delivery</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.frontend_url') }}/admin/orders/{{ $order->uuid }}" class="button">
                View Order Details
            </a>
            <a href="{{ config('app.frontend_url') }}/admin/vendor-purchase-orders/{{ $purchaseOrder->uuid }}" class="button">
                View Purchase Order
            </a>
        </div>

        <p>
            This is an automated notification. The vendor has confirmed receipt of the purchase order 
            and production will begin according to the agreed timeline.
        </p>
    </div>

    <div class="footer">
        <p>
            © {{ date('Y') }} {{ config('app.name') }}. All rights reserved.<br>
            This email was sent to {{ $admin->email }}
        </p>
    </div>
</body>
</html>
