<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Counter Offer Received</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .quote-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .comparison { display: flex; justify-content: space-around; margin: 20px 0; }
        .amount-box { text-align: center; padding: 15px; }
        .original { color: #6b7280; }
        .counter { color: #f59e0b; font-weight: bold; font-size: 24px; }
        .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💬 Counter Offer Received</h1>
        </div>
        
        <div class="content">
            <p>Hello Admin,</p>
            
            <p>Customer <strong>{{ $quote->order->customer->name }}</strong> has submitted a counter offer for quote <strong>{{ $quote->quote_number }}</strong>.</p>
            
            <div class="quote-info">
                <h2>Counter Offer Details</h2>
                
                <div class="comparison">
                    <div class="amount-box">
                        <div style="font-size: 12px; color: #6b7280;">Original Amount</div>
                        <div class="original">{{ number_format($quote->grand_total / 100, 2) }} {{ $quote->currency }}</div>
                    </div>
                    <div class="amount-box">
                        <div style="font-size: 12px; color: #6b7280;">Counter Offer</div>
                        <div class="counter">{{ number_format($quote->counter_offer_amount / 100, 2) }} {{ $quote->currency }}</div>
                    </div>
                </div>
                
                <div style="text-align: center; padding: 10px; background: #fef3c7; border-radius: 6px;">
                    <strong>Difference:</strong> 
                    {{ number_format(($quote->grand_total - $quote->counter_offer_amount) / 100, 2) }} {{ $quote->currency }}
                    ({{ number_format((($quote->grand_total - $quote->counter_offer_amount) / $quote->grand_total) * 100, 2) }}%)
                </div>
                
                @if($quote->counter_offer_notes)
                <div style="margin-top: 20px;">
                    <strong>Customer's Reason:</strong>
                    <p style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin-top: 10px;">
                        {{ $quote->counter_offer_notes }}
                    </p>
                </div>
                @endif
                
                <p><strong>Negotiation Round:</strong> {{ $quote->counter_offer_round }} of {{ $quote->max_negotiation_rounds }}</p>
            </div>
            
            <div style="text-align: center;">
                <a href="{{ $adminUrl }}" class="button">Review Counter Offer</a>
            </div>
            
            <p style="margin-top: 30px;">Please review and respond to this counter offer promptly.</p>
        </div>
        
        <div class="footer">
            <p>© {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
