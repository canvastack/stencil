<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Counter Offer Accepted</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .quote-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .amount { font-size: 32px; font-weight: bold; color: #10b981; }
        .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .success-box { background: #d1fae5; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 6px; }
        .negotiation-summary { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Counter Offer Accepted!</h1>
        </div>
        
        <div class="content">
            <p>Dear {{ $quote->order->customer->name }},</p>
            
            <div class="success-box">
                <strong>Excellent news!</strong> We've accepted your counter offer and your quote is now approved for payment.
            </div>
            
            <div class="quote-info">
                <h2>Agreed Terms</h2>
                <p><strong>Quote Number:</strong> {{ $quote->quote_number }}</p>
                
                <div class="negotiation-summary">
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">
                        <strong>Negotiation Summary:</strong> Round {{ $quote->counter_offer_round }} of {{ $quote->max_negotiation_rounds }}
                    </p>
                </div>
                
                <div style="margin: 30px 0; text-align: center;">
                    <div style="color: #6b7280; font-size: 14px;">Final Agreed Amount</div>
                    <div class="amount">{{ number_format($quote->grand_total / 100, 2) }} {{ $quote->currency }}</div>
                </div>
                
                <p><strong>Payment Terms:</strong> {{ $quote->payment_terms }}</p>
                @if($quote->delivery_timeline)
                <p><strong>Delivery Timeline:</strong> {{ $quote->delivery_timeline }}</p>
                @endif
                
                <h3 style="margin-top: 30px;">Bank Transfer Details:</h3>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 6px;">
                    <p><strong>Bank:</strong> [Bank Name]</p>
                    <p><strong>Account Number:</strong> [Account Number]</p>
                    <p><strong>Account Name:</strong> [Account Name]</p>
                </div>
                
                <p style="margin-top: 20px;"><strong>Payment Instructions:</strong></p>
                <ol>
                    <li>Transfer the agreed amount to the bank account above</li>
                    <li>Upload payment proof via the customer portal</li>
                    <li>Wait for payment verification (usually within 24 hours)</li>
                    <li>Production will start after payment is verified</li>
                </ol>
            </div>
            
            <div style="text-align: center;">
                <a href="{{ $paymentUrl }}" class="button">Proceed to Payment</a>
            </div>
            
            <p style="margin-top: 30px;">Thank you for your business. We appreciate your negotiation and look forward to delivering your order.</p>
            
            <p>If you have any questions about payment or the order, please don't hesitate to contact us.</p>
        </div>
        
        <div class="footer">
            <p>© {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly to this message.</p>
        </div>
    </div>
</body>
</html>
