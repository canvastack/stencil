<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Counter Offer Rejected</title>
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
            background-color: #dc2626;
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
        .quote-info {
            background-color: white;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #dc2626;
            border-radius: 4px;
        }
        .rejection-reason {
            background-color: #fee2e2;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            border: 1px solid #fecaca;
        }
        .counter-offer-summary {
            background-color: white;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
        }
        .item {
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .item:last-child {
            border-bottom: none;
        }
        .total {
            font-size: 18px;
            font-weight: bold;
            color: #dc2626;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #e5e7eb;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .label {
            font-weight: bold;
            color: #4b5563;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0;">Counter Offer Rejected</h1>
    </div>
    
    <div class="content">
        <p>Dear {{ $vendor_name }},</p>
        
        <p>We regret to inform you that your counter offer for <strong>Quote {{ $quote_number }}</strong> has been rejected by our team.</p>
        
        <div class="quote-info">
            <p style="margin: 5px 0;"><span class="label">Quote Number:</span> {{ $quote_number }}</p>
            <p style="margin: 5px 0;"><span class="label">Submitted:</span> {{ $submitted_at ? \Carbon\Carbon::parse($submitted_at)->format('F d, Y H:i') : 'N/A' }}</p>
            <p style="margin: 5px 0;"><span class="label">Rejection Count:</span> 
                <strong style="color: #dc2626;">{{ $rejection_count ?? 1 }} of 2</strong>
            </p>
        </div>
        
        <div class="rejection-reason">
            <h3 style="margin-top: 0; color: #dc2626;">Rejection Reason:</h3>
            <p style="margin-bottom: 0;">{{ $rejection_reason }}</p>
        </div>
        
        @if($counter_offer && isset($counter_offer['items']))
        <div class="counter-offer-summary">
            <h3 style="margin-top: 0;">Your Counter Offer Summary:</h3>
            
            @foreach($counter_offer['items'] as $item)
            <div class="item">
                <p style="margin: 5px 0; font-weight: bold;">{{ $item['product_name'] }}</p>
                <p style="margin: 5px 0; font-size: 14px;">
                    Quantity: {{ $item['quantity'] }} × 
                    {{ $currency === 'IDR' ? 'Rp ' . number_format($item['counter_unit_price'], 0, ',', '.') : $currency . ' ' . number_format($item['counter_unit_price'] / 100, 2) }}
                    = {{ $currency === 'IDR' ? 'Rp ' . number_format($item['counter_total_price'], 0, ',', '.') : $currency . ' ' . number_format($item['counter_total_price'] / 100, 2) }}
                </p>
                @if(isset($item['notes']) && $item['notes'])
                <p style="margin: 5px 0; font-size: 13px; color: #6b7280;">Note: {{ $item['notes'] }}</p>
                @endif
            </div>
            @endforeach
            
            <div class="total">
                Total Counter Offer: {{ $currency === 'IDR' ? 'Rp ' . number_format($counter_offer['total_counter'], 0, ',', '.') : $currency . ' ' . number_format($counter_offer['total_counter'] / 100, 2) }}
            </div>
        </div>
        @endif
        
        <h3>What's Next?</h3>
        @if(isset($rejection_count) && $rejection_count >= 2)
        <p style="color: #dc2626; font-weight: bold;">
            This was your final rejection (2 of 2). Unfortunately, you cannot submit more counter offers for this order. 
            The admin will need to select a different vendor.
        </p>
        @else
        <p>While we couldn't accept this particular counter offer, we value our partnership with you. Here are your options:</p>
        <ul>
            <li><strong>You have {{ 2 - ($rejection_count ?? 1) }} more chance to submit a revised counter offer</strong></li>
            <li>Review the rejection reason carefully and adjust your pricing accordingly</li>
            <li>Contact us to discuss alternative solutions before submitting</li>
            <li>Submit your revised counter offer through the vendor portal</li>
        </ul>
        <p style="background-color: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 15px 0;">
            <strong>Important:</strong> This is rejection {{ $rejection_count ?? 1 }} of 2. After 2 rejections, you will not be able to submit more offers for this order.
        </p>
        @endif
        
        <p>If you have any questions or would like to discuss this further, please don't hesitate to reach out to us.</p>
        
        <center>
            <a href="{{ $portal_url }}/vendor/quotes/{{ $quote_uuid }}" class="button">View Quote Details</a>
        </center>
        
        <p>Thank you for your understanding and continued partnership.</p>
        
        <p>Best regards,<br>
        <strong>{{ $admin_contact_name }}</strong><br>
        {{ $admin_contact_email }}</p>
    </div>
    
    <div class="footer">
        <p>This is an automated email. Please do not reply directly to this message.</p>
        <p>If you need assistance, please contact us at {{ $admin_contact_email }}</p>
    </div>
</body>
</html>
