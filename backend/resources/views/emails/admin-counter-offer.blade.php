<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Counter Offer Sent</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .quote-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .comparison { display: flex; justify-content: space-around; margin: 20px 0; }
        .amount-box { text-align: center; padding: 15px; }
        .customer-offer { color: #6b7280; }
        .admin-counter { color: #3b82f6; font-weight: bold; font-size: 24px; }
        .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .info-box { background: #dbeafe; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔄 Counter Offer Sent to Customer</h1>
        </div>
        
        <div class="content">
            <p>Hello Admin,</p>
            
            <div class="info-box">
                <strong>Confirmation:</strong> Your counter offer has been successfully sent to customer <strong>{{ $quote->order->customer->name }}</strong> for quote <strong>{{ $quote->quote_number }}</strong>.
            </div>
            
            <div class="quote-info">
                <h2>Counter Offer Summary</h2>
                
                <div class="comparison">
                    <div class="amount-box">
                        <div style="font-size: 12px; color: #6b7280;">Customer's Offer</div>
                        <div class="customer-offer">{{ number_format($quote->counter_offer_amount / 100, 2) }} {{ $quote->currency }}</div>
                    </div>
                    <div class="amount-box">
                        <div style="font-size: 12px; color: #6b7280;">Your Counter Offer</div>
                        <div class="admin-counter">{{ number_format($quote->grand_total / 100, 2) }} {{ $quote->currency }}</div>
                    </div>
                </div>
                
                <div style="text-align: center; padding: 10px; background: #dbeafe; border-radius: 6px;">
                    <strong>Difference:</strong> 
                    {{ number_format(($quote->grand_total - $quote->counter_offer_amount) / 100, 2) }} {{ $quote->currency }}
                    @if($quote->counter_offer_amount > 0)
                    ({{ number_format((($quote->grand_total - $quote->counter_offer_amount) / $quote->counter_offer_amount) * 100, 2) }}%)
                    @endif
                </div>
                
                @if(isset($notes) && $notes)
                <div style="margin-top: 20px;">
                    <strong>Your Explanation:</strong>
                    <p style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin-top: 10px;">
                        {{ $notes }}
                    </p>
                </div>
                @endif
                
                <p><strong>Negotiation Round:</strong> {{ $quote->counter_offer_round }} of {{ $quote->max_negotiation_rounds }}</p>
                <p><strong>Order Number:</strong> {{ $quote->order->order_number }}</p>
                <p><strong>Customer Email:</strong> {{ $quote->order->customer->email }}</p>
            </div>
            
            <div style="text-align: center;">
                <a href="{{ $adminUrl }}" class="button">View Quote Details</a>
            </div>
            
            <p style="margin-top: 30px;"><strong>Next Steps:</strong></p>
            <ul>
                <li>Customer will receive email notification with your counter offer</li>
                <li>Customer can accept, reject, or submit another counter offer</li>
                <li>You'll be notified when customer responds</li>
                @if($quote->counter_offer_round >= $quote->max_negotiation_rounds)
                <li><strong>Note:</strong> Maximum negotiation rounds reached. Customer can only accept or reject.</li>
                @endif
            </ul>
            
            <p>The customer has been notified and can respond via their portal.</p>
        </div>
        
        <div class="footer">
            <p>© {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
            <p>This is an automated notification for your records.</p>
        </div>
    </div>
</body>
</html>
