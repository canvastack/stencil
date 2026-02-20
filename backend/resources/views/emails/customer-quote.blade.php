<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Quotation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .quote-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .amount { font-size: 32px; font-weight: bold; color: #4F46E5; }
        .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .warning { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Quotation</h1>
        </div>
        
        <div class="content">
            <p>Dear {{ $quote->order->customer->name }},</p>
            
            <p>Thank you for your interest. We're pleased to provide you with a quotation for your order.</p>
            
            <div class="quote-info">
                <h2>Quote Details</h2>
                <p><strong>Quote Number:</strong> {{ $quote->quote_number }}</p>
                <p><strong>Order Number:</strong> {{ $quote->order->order_number }}</p>
                <p><strong>Valid Until:</strong> {{ $quote->valid_until->format('F d, Y') }}</p>
                
                <div style="margin: 30px 0; text-align: center;">
                    <div style="color: #6b7280; font-size: 14px;">Total Amount</div>
                    <div class="amount">{{ number_format($quote->grand_total / 100, 2) }} {{ $quote->currency }}</div>
                </div>
                
                <p><strong>Payment Terms:</strong> {{ $quote->payment_terms }}</p>
                @if($quote->delivery_timeline)
                <p><strong>Delivery Timeline:</strong> {{ $quote->delivery_timeline }}</p>
                @endif
            </div>
            
            <div class="warning">
                <strong>⏰ Important:</strong> This quote is valid until {{ $quote->valid_until->format('F d, Y') }}. 
                Please respond before this date.
            </div>
            
            <div style="text-align: center;">
                <a href="{{ $portalUrl }}" class="button">View & Respond to Quote</a>
            </div>
            
            <p style="margin-top: 30px;">You can:</p>
            <ul>
                <li>✅ Accept the quote</li>
                <li>💬 Submit a counter offer</li>
                <li>❌ Decline with feedback</li>
            </ul>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>
        
        <div class="footer">
            <p>© {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly to this message.</p>
        </div>
    </div>
</body>
</html>
