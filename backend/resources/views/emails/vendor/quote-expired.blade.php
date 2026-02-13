<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quote Expired</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
        <h1 style="color: #dc2626; margin-bottom: 20px;">Quote Expired</h1>
        
        <p>Dear {{ $vendorName }},</p>
        
        <p>This is to inform you that the following quote has expired due to the deadline passing without a response.</p>
        
        <div style="background-color: #fff; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #991b1b; font-size: 18px; margin-bottom: 15px;">Expired Quote Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Quote ID:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">{{ $quoteId }}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Order ID:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">{{ $orderId }}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Deadline:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">{{ $deadline }}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Expired At:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">{{ $expiredAt }}</td>
                </tr>
            </table>
        </div>
        
        <div style="background-color: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
            <p style="margin: 0;"><strong>⚠️ Notice:</strong> This quote is now closed and no longer accepting responses. If you believe this was in error, please contact our support team immediately.</p>
        </div>
        
        <div style="margin: 30px 0;">
            <a href="{{ $quoteUrl }}" style="display: inline-block; background-color: #6b7280; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Quote Details</a>
        </div>
        
        <p>We encourage you to respond promptly to future quote requests to avoid missing opportunities.</p>
        
        <p style="margin-top: 30px;">Best regards,<br>{{ config('app.name') }} Team</p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
        <p>This is an automated message. Please do not reply to this email.</p>
    </div>
</body>
</html>
