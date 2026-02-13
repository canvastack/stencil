<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quote Expired - {{ $quoteNumber }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
    <!-- Header with PT CEX Branding -->
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">CanvaStencil</h1>
        <p style="color: #dbeafe; margin: 10px 0 0 0; font-size: 14px;">Vendor Portal</p>
    </div>
    
    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #dc2626; margin-bottom: 20px; font-size: 24px;">⏰ Quote Request Expired</h2>
        
        <p style="margin-bottom: 20px;">Dear <strong>{{ $vendorName }}</strong>,</p>
        
        <p style="margin-bottom: 20px;">This is to inform you that the following quote request has expired due to the response deadline passing without a submission.</p>
        
        <!-- Quote Details Section -->
        <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #dc2626;">
            <h3 style="color: #991b1b; font-size: 18px; margin: 0 0 15px 0;">📦 Expired Quote Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;"><strong>Quote Number:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #fecaca; color: #dc2626; font-weight: bold;">{{ $quoteNumber }}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;"><strong>Order Number:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">{{ $orderNumber }}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;"><strong>Customer:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">{{ $customerName }}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;"><strong>Product:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">{{ $productName }}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;"><strong>Expired On:</strong></td>
                    <td style="padding: 8px 0; color: #991b1b; font-weight: bold;">{{ \Carbon\Carbon::parse($expiresAt)->format('F j, Y \a\t g:i A') }}</td>
                </tr>
            </table>
        </div>
        
        <!-- Expiration Notice -->
        <div style="background-color: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;">
                <strong>⚠️ What This Means:</strong>
            </p>
            <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">
                This quote request has been automatically closed due to expiration. No further action can be taken on this quote. If you believe this was an error or would like to discuss this opportunity, please contact our team directly.
            </p>
        </div>
        
        <!-- Impact on Performance -->
        <div style="background-color: #dbeafe; padding: 20px; border-left: 4px solid #2563eb; margin: 25px 0; border-radius: 4px;">
            <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">📊 Performance Impact</h4>
            <p style="margin: 0; color: #1e40af;">Expired quotes without a response may affect your vendor performance metrics:</p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #1e40af;">
                <li style="margin-bottom: 5px;">Response rate calculation</li>
                <li style="margin-bottom: 5px;">Average response time</li>
                <li>Overall vendor rating</li>
            </ul>
        </div>
        
        <!-- View Portal Button -->
        <div style="text-align: center; margin: 35px 0;">
            <a href="{{ $portalUrl }}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3); transition: all 0.3s;">
                🏠 Go to Vendor Portal
            </a>
        </div>
        
        <!-- Future Opportunities -->
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">💡 For Future Quote Requests</h4>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                <li style="margin-bottom: 8px;">Enable email notifications to receive instant alerts for new quotes</li>
                <li style="margin-bottom: 8px;">Check your vendor portal dashboard regularly for pending requests</li>
                <li style="margin-bottom: 8px;">Set up calendar reminders for quote expiration dates</li>
                <li style="margin-bottom: 8px;">Respond promptly to maintain your vendor performance rating</li>
                <li>Use the message thread to request deadline extensions if needed</li>
            </ul>
        </div>
        
        <!-- Support Information -->
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e5e7eb;">
            <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">📞 Need Assistance?</h4>
            <p style="margin: 0 0 10px 0; color: #4b5563;">If you have questions about this expired quote or would like to discuss future opportunities:</p>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                <li style="margin-bottom: 8px;">Email: <a href="mailto:support@{{ parse_url(config('app.url'), PHP_URL_HOST) }}" style="color: #2563eb; text-decoration: none;">support@{{ parse_url(config('app.url'), PHP_URL_HOST) }}</a></li>
                <li style="margin-bottom: 8px;">Portal: Log in to your vendor portal to contact us</li>
                <li>Response time: Within 24 hours on business days</li>
            </ul>
        </div>
        
        <p style="margin-top: 30px; color: #4b5563;">We look forward to working with you on future quote requests.</p>
        
        <p style="margin-top: 25px; color: #1f2937;">
            <strong>Best regards,</strong><br>
            <span style="color: #2563eb; font-weight: bold;">CanvaStencil Team</span>
        </p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 12px;">
        <p style="margin: 0 0 10px 0;">This is an automated message. Please do not reply to this email.</p>
        <p style="margin: 0;">© {{ date('Y') }} CanvaStencil. All rights reserved.</p>
    </div>
</body>
</html>
