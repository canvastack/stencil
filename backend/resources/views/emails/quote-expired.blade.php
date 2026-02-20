<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quote Expired</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .quote-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .amount { font-size: 32px; font-weight: bold; color: #6b7280; text-decoration: line-through; }
        .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .expired-box { background: #fee2e2; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; }
        .info-box { background: #dbeafe; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Quote Expired</h1>
        </div>
        
        <div class="content">
            <p>Dear {{ $quote->order->customer->name }},</p>
            
            <div class="expired-box">
                <strong>Notice:</strong> Your quote has expired and is no longer valid for acceptance.
            </div>
            
            <div class="quote-info">
                <h2>Expired Quote Details</h2>
                <p><strong>Quote Number:</strong> {{ $quote->quote_number }}</p>
                <p><strong>Order Number:</strong> {{ $quote->order->order_number }}</p>
                <p><strong>Expired On:</strong> {{ $quote->valid_until->format('F d, Y') }}</p>
                
                <div style="margin: 30px 0; text-align: center;">
                    <div style="color: #6b7280; font-size: 14px;">Quote Amount</div>
                    <div class="amount">{{ number_format($quote->grand_total / 100, 2) }} {{ $quote->currency }}</div>
                </div>
            </div>
            
            <div class="info-box">
                <strong>ℹ️ What happens next?</strong>
                <p style="margin: 10px 0 0 0;">We understand that timing doesn't always work out. If you're still interested in this order, we'd be happy to provide you with a revised quotation.</p>
            </div>
            
            <p><strong>To request a new quote:</strong></p>
            <ul>
                <li>Contact us directly to discuss your requirements</li>
                <li>We'll review current pricing and availability</li>
                <li>A new quotation will be prepared for you</li>
                <li>You'll receive the updated quote via email</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="{{ $contactUrl ?? '#' }}" class="button">Contact Us</a>
            </div>
            
            <p style="margin-top: 30px;">We appreciate your interest and look forward to working with you.</p>
            
            <p>If you have any questions or would like to discuss this further, please don't hesitate to reach out.</p>
        </div>
        
        <div class="footer">
            <p>© {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly to this message.</p>
        </div>
    </div>
</body>
</html>
