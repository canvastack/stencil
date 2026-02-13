<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Quote Request - {{ $quoteNumber }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
    <!-- Header with PT CEX Branding -->
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">CanvaStencil</h1>
        <p style="color: #dbeafe; margin: 10px 0 0 0; font-size: 14px;">Vendor Portal</p>
    </div>
    
    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #1e40af; margin-bottom: 20px; font-size: 24px;">📋 New Quote Request</h2>
        
        <p style="margin-bottom: 20px;">Dear <strong>{{ $vendorName }}</strong>,</p>
        
        <p style="margin-bottom: 20px;">You have received a new quote request that requires your attention. Please review the details below and submit your response before the expiration date.</p>
        
        <!-- Quote Details Section -->
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #2563eb;">
            <h3 style="color: #1e40af; font-size: 18px; margin: 0 0 15px 0;">📦 Quote Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #dbeafe;"><strong>Quote Number:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #dbeafe; color: #2563eb; font-weight: bold;">{{ $quoteNumber }}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #dbeafe;"><strong>Order Number:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #dbeafe;">{{ $orderNumber }}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #dbeafe;"><strong>Customer:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #dbeafe;">{{ $customerName }}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;"><strong>Product:</strong></td>
                    <td style="padding: 8px 0;">{{ $productName }}</td>
                </tr>
            </table>
        </div>
        
        <!-- Expiration Warning -->
        @if($expiresAt)
        <div style="background-color: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;">
                <strong>⏰ Expiration Date:</strong> 
                <span style="font-size: 18px; font-weight: bold; color: #b45309;">{{ \Carbon\Carbon::parse($expiresAt)->format('F j, Y \a\t g:i A') }}</span>
            </p>
            <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">
                Please respond before this date to avoid automatic expiration.
            </p>
        </div>
        @endif
        
        <!-- Action Required Notice -->
        <div style="background-color: #dbeafe; padding: 20px; border-left: 4px solid #2563eb; margin: 25px 0; border-radius: 4px;">
            <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">✅ Action Required</h4>
            <p style="margin: 0; color: #1e40af;">Please review the quote request and choose one of the following actions:</p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #1e40af;">
                <li style="margin-bottom: 5px;"><strong>Accept:</strong> Provide estimated delivery days</li>
                <li style="margin-bottom: 5px;"><strong>Reject:</strong> Specify a reason for declining</li>
                <li><strong>Counter Offer:</strong> Propose an alternative price</li>
            </ul>
        </div>
        
        <!-- View Quote Button -->
        <div style="text-align: center; margin: 35px 0;">
            <a href="{{ $quoteUrl }}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3); transition: all 0.3s;">
                🔍 View Quote Request
            </a>
        </div>
        
        <!-- Quick Tips -->
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">💡 Quick Tips</h4>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                <li style="margin-bottom: 8px;">Review all product specifications carefully before responding</li>
                <li style="margin-bottom: 8px;">Use the message thread to ask questions or request clarifications</li>
                <li style="margin-bottom: 8px;">Respond promptly to maintain your vendor performance rating</li>
                <li>All responses are tracked with timestamps for transparency</li>
            </ul>
        </div>
        
        <p style="margin-top: 30px; color: #4b5563;">Thank you for your prompt attention to this quote request.</p>
        
        <p style="margin-top: 25px; color: #1f2937;">
            <strong>Best regards,</strong><br>
            <span style="color: #2563eb; font-weight: bold;">CanvaStencil Team</span>
        </p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 12px;">
        <p style="margin: 0 0 10px 0;">This is an automated message. Please do not reply to this email.</p>
        <p style="margin: 0;">© 2026 CanvaStencil. All rights reserved.</p>
    </div>
</body>
</html>
