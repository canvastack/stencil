<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Counter Offer Accepted</title>
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
            background-color: #16a34a;
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
            border-left: 4px solid #16a34a;
            border-radius: 4px;
        }
        .acceptance-notice {
            background-color: #dcfce7;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            border: 1px solid #bbf7d0;
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
            color: #16a34a;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #e5e7eb;
        }
        .next-steps {
            background-color: #dbeafe;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            border: 1px solid #bfdbfe;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #16a34a;
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
        .success-icon {
            font-size: 48px;
            text-align: center;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0;">✓ Counter Offer Accepted!</h1>
    </div>
    
    <div class="content">
        <div class="success-icon">🎉</div>
        
        <p>Dear {{ $vendor_name }},</p>
        
        <p>Great news! We are pleased to inform you that your counter offer for <strong>Quote {{ $quote_number }}</strong> has been <strong style="color: #16a34a;">ACCEPTED</strong> by our team.</p>
        
        <div class="quote-info">
            <p style="margin: 5px 0;"><span class="label">Quote Number:</span> {{ $quote_number }}</p>
            <p style="margin: 5px 0;"><span class="label">Accepted Amount:</span> {{ $currency === 'IDR' ? 'Rp ' . number_format($accepted_amount, 0, ',', '.') : $currency . ' ' . number_format($accepted_amount / 100, 2) }}</p>
            @if($estimated_delivery_days)
            <p style="margin: 5px 0;"><span class="label">Estimated Delivery:</span> {{ $estimated_delivery_days }} days</p>
            @endif
        </div>
        
        <div class="acceptance-notice">
            <h3 style="margin-top: 0; color: #16a34a;">✓ Acceptance Confirmed</h3>
            <p style="margin-bottom: 0;">Your counter offer has been reviewed and approved. We are moving forward with your proposed pricing.</p>
        </div>
        
        @if($counter_offer && isset($counter_offer['items']))
        <div class="counter-offer-summary">
            <h3 style="margin-top: 0;">Accepted Counter Offer Details:</h3>
            
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
                Total Accepted Amount: {{ $currency === 'IDR' ? 'Rp ' . number_format($counter_offer['total_counter'], 0, ',', '.') : $currency . ' ' . number_format($counter_offer['total_counter'] / 100, 2) }}
            </div>
        </div>
        @endif
        
        <div class="next-steps">
            <h3 style="margin-top: 0; color: #1e40af;">📋 Next Steps:</h3>
            <ol style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Prepare for Production:</strong> Begin preparing materials and resources for this order</li>
                <li><strong>Confirm Timeline:</strong> Ensure you can meet the estimated delivery timeline</li>
                <li><strong>Quality Assurance:</strong> Maintain our agreed quality standards</li>
                <li><strong>Stay in Touch:</strong> Keep us updated on production progress</li>
                <li><strong>Delivery Coordination:</strong> We'll coordinate delivery details closer to completion</li>
            </ol>
        </div>
        
        <p>We will be in touch with you shortly regarding the next steps and any additional details needed for production.</p>
        
        <center>
            <a href="{{ $portal_url }}/vendor/quotes/{{ $quote_uuid }}" class="button">View Quote Details</a>
        </center>
        
        <p>Thank you for your competitive pricing and continued partnership. We look forward to working with you on this project!</p>
        
        <p>Best regards,<br>
        <strong>{{ $admin_contact_name }}</strong><br>
        {{ $admin_contact_email }}</p>
    </div>
    
    <div class="footer">
        <p>This is an automated email. Please do not reply directly to this message.</p>
        <p>If you have any questions, please contact us at {{ $admin_contact_email }}</p>
    </div>
</body>
</html>
