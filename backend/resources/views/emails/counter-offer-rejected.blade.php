<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Counter Offer Rejected</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .quote-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .comparison { display: flex; justify-content: space-around; margin: 20px 0; }
        .amount-box { text-align: center; padding: 15px; }
        .original { color: #6b7280; }
        .counter { color: #ef4444; font-weight: bold; font-size: 24px; }
        .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .info-box { background: #fee2e2; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ Counter Offer Rejected</h1>
        </div>
        
        <div class="content">
            <p>Dear {{ $quote->order->customer->name }},</p>
            
            <div class="info-box">
                <strong>We're sorry,</strong> but we are unable to accept your counter offer for quote <strong>{{ $quote->quote_number }}</strong>.
            </div>
            
            <div class="quote-info">
                <h2>Counter Offer Details</h2>
                
                <div class="comparison">
                    <div class="amount-box">
                        <div style="font-size: 12px; color: #6b7280;">Original Quote</div>
                        <div class="original">{{ number_format($quote->grand_total / 100, 2) }} {{ $quote->currency }}</div>
                    </div>
                    <div class="amount-box">
                        <div style="font-size: 12px; color: #6b7280;">Your Counter Offer</div>
                        <div class="counter">{{ number_format($quote->counter_offer_amount / 100, 2) }} {{ $quote->currency }}</div>
                    </div>
                </div>
                
                @if($rejectionReason)
                <div style="margin-top: 20px;">
                    <strong>Reason for Rejection:</strong>
                    <p style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin-top: 10px;">
                        {{ $rejectionReason }}
                    </p>
                </div>
                @endif
            </div>
            
            <p>We understand this may not be the outcome you were hoping for. However, we'd like to offer you the following options:</p>
            
            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3>What's Next?</h3>
                <ul style="line-height: 2;">
                    <li>✅ <strong>Accept the original quote</strong> - The original pricing remains valid until {{ $quote->valid_until->format('F d, Y') }}</li>
                    <li>💬 <strong>Contact us</strong> - We're happy to discuss alternative solutions or adjustments</li>
                    <li>📋 <strong>Request a revised quote</strong> - We can work with you on a modified scope or specifications</li>
                </ul>
            </div>
            
            <div style="text-align: center;">
                <a href="{{ $portalUrl }}" class="button">View Original Quote</a>
            </div>
            
            <p style="margin-top: 30px;">We value your business and hope to find a solution that works for both of us. Please feel free to reach out if you'd like to discuss further.</p>
            
            <p>Thank you for your understanding.</p>
        </div>
        
        <div class="footer">
            <p>© {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly to this message.</p>
        </div>
    </div>
</body>
</html>
