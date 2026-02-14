<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vendor Accepted Quote - {{ $quoteNumber }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .email-wrapper {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header .icon {
            font-size: 48px;
            margin-bottom: 16px;
            display: block;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 16px;
            color: #2d3748;
        }
        .message {
            color: #4a5568;
            margin-bottom: 32px;
        }
        .success-banner {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border-left: 4px solid #10b981;
            padding: 20px;
            margin: 24px 0;
            border-radius: 0 6px 6px 0;
        }
        .success-banner h3 {
            color: #065f46;
            margin: 0 0 8px 0;
            font-size: 18px;
        }
        .success-banner p {
            color: #047857;
            margin: 0;
            font-size: 14px;
        }
        .info-card {
            background: #f7fafc;
            border-radius: 6px;
            padding: 20px;
            margin: 24px 0;
        }
        .info-card h3 {
            color: #2d3748;
            margin: 0 0 16px 0;
            font-size: 16px;
            font-weight: 600;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: #4a5568;
        }
        .info-value {
            color: #2d3748;
            text-align: right;
        }
        .price-highlight {
            color: #10b981;
            font-weight: 700;
            font-size: 18px;
        }
        .delivery-badge {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
        }
        .next-steps {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 24px 0;
            border-radius: 0 6px 6px 0;
        }
        .next-steps h3 {
            color: #92400e;
            margin: 0 0 12px 0;
            font-size: 16px;
        }
        .next-steps ul {
            margin: 0;
            padding-left: 20px;
            color: #78350f;
        }
        .next-steps li {
            margin-bottom: 8px;
        }
        .action-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 8px 8px 8px 0;
            text-align: center;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .action-button-secondary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .footer {
            background: #f8fafc;
            padding: 32px 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer-text {
            color: #718096;
            font-size: 14px;
            margin: 0;
        }
        @media only screen and (max-width: 600px) {
            .container {
                padding: 20px 10px;
            }
            .content {
                padding: 30px 20px;
            }
            .header {
                padding: 30px 20px;
            }
            .action-button {
                display: block;
                margin: 8px 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="header">
                <span class="icon">🎉</span>
                <h1>Quote Accepted!</h1>
            </div>
            
            <div class="content">
                <div class="greeting">Hello {{ $admin->name }}!</div>
                
                <div class="message">
                    <p>Great news! Vendor <strong>{{ $vendorName }}</strong> has accepted quote <strong>{{ $quoteNumber }}</strong> for order <strong>{{ $orderNumber }}</strong>.</p>
                </div>
                
                <div class="success-banner">
                    <h3>✅ Order Status Updated</h3>
                    <p>The order has been automatically advanced to <strong>Customer Quote</strong> stage. You can now proceed with creating a customer quotation.</p>
                </div>
                
                <div class="info-card">
                    <h3>📋 Quote Details</h3>
                    <div class="info-row">
                        <span class="info-label">Quote Number:</span>
                        <span class="info-value">{{ $quoteNumber }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Order Number:</span>
                        <span class="info-value">{{ $orderNumber }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Vendor:</span>
                        <span class="info-value">{{ $vendorName }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Agreed Price:</span>
                        <span class="info-value price-highlight">Rp {{ number_format($agreedPrice, 0, ',', '.') }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Estimated Delivery:</span>
                        <span class="info-value">
                            <span class="delivery-badge">{{ $estimatedDeliveryDays }} days</span>
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Expected Delivery Date:</span>
                        <span class="info-value">{{ \Carbon\Carbon::now()->addDays($estimatedDeliveryDays)->format('F j, Y') }}</span>
                    </div>
                </div>
                
                <div class="next-steps">
                    <h3>📌 Next Steps</h3>
                    <ul>
                        <li><strong>Review Order Details:</strong> Check the order page for complete information</li>
                        <li><strong>Create Customer Quote:</strong> Prepare quotation for the customer</li>
                        <li><strong>Monitor Production:</strong> Track production progress against the delivery timeline</li>
                        <li><strong>Generate Purchase Order:</strong> Create PO for the vendor (optional)</li>
                    </ul>
                </div>
                
                <div class="button-container">
                    <a href="{{ $orderUrl }}" class="action-button">
                        📦 View Order Details
                    </a>
                    <a href="{{ $quoteUrl }}" class="action-button action-button-secondary">
                        📄 View Quote Details
                    </a>
                </div>
                
                <div class="message">
                    <p style="margin-top: 24px; color: #4a5568; font-size: 14px;">
                        <strong>💡 Tip:</strong> The order page now displays vendor quote information and production progress tracking. You can monitor the countdown to the expected delivery date.
                    </p>
                </div>
            </div>
            
            <div class="footer">
                <p class="footer-text">
                    Best regards,<br>
                    The CanvaStencil Team
                </p>
                
                <p class="footer-text" style="margin-top: 16px;">
                    © {{ date('Y') }} CanvaStencil. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
