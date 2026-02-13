<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quote Expiring Soon - {{ $quoteNumber }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
    <!-- Header with PT CEX Branding -->
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">CanvaStencil</h1>
        <p style="color: #dbeafe; margin: 10px 0 0 0; font-size: 14px;">Vendor Portal</p>
    </div>
    
    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #f59e0b; margin-bottom: 20px; font-size: 24px;">⏰ Quote Expiring Soon</h2>
        
        <p style="margin-bottom: 20px;">Dear <strong>{{ $vendorName }}</strong>,</p>
        
        <p style="margin-bottom: 20px;">This is a friendly reminder that the following quote request is expiring soon and requires your response.</p>
        
        <!-- Days Remaining Alert -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #f59e0b; text-align: center;">
            <div style="font-size: 48px; font-weight: bold; color: #b45309; margin-bottom: 10px;">
                {{ $daysRemaining }}
            </div>
            <div style="font-size: 20px; color: #92400e; font-weight: bold;">
                {{ $daysRemaining === 1 ? 'Day' : 'Days' }} Remaining
            </div>
            @if($expiresAt)
            <div style="font-size: 14px; color: #92400e; margin-top: 10px;">
                Expires: {{ \Carbon\Carbon::parse($expiresAt)->format('F j, Y \a\t g:i A') }}
            </div>
            @endif
        </div>
        
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
        
        <!-- Urgency Notice -->
        <div style="background-color: #fef2f2; padding: 20px; border-left: 4px solid #dc2626; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b;">
                <strong>⚠️ Urgent Action Required:</strong>
            </p>
            <p style="margin: 10px 0 0 0; color: #991b1b; font-size: 14px;">
                @if($daysRemaining === 1)
                This quote will expire in <strong>1 day</strong>. Please respond as soon as possible to avoid automatic expiration.
                @else
                This quote will expire in <strong>{{ $daysRemaining }} days</strong>. Please respond before the deadline to avoid automatic expiration.
                @endif
            </p>
        </div>
        
        <!-- Action Options -->
        <div style="background-color: #dbeafe; padding: 20px; border-left: 4px solid #2563eb; margin: 25px 0; border-radius: 4px;">
            <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">✅ Response Options</h4>
            <p style="margin: 0 0 10px 0; color: #1e40af;">Please review the quote request and choose one of the following actions:</p>
            <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                <li style="margin-bottom: 8px;"><strong>Accept:</strong> Provide estimated delivery days and any notes</li>
                <li style="margin-bottom: 8px;"><strong>Reject:</strong> Specify a reason for declining the request</li>
                <li style="margin-bottom: 8px;"><strong>Counter Offer:</strong> Propose an alternative price with justification</li>
                <li><strong>Request Extension:</strong> Use the message thread to request more time if needed</li>
            </ul>
        </div>
        
        <!-- View Quote Button -->
        <div style="text-align: center; margin: 35px 0;">
            <a href="{{ $quoteUrl }}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3); transition: all 0.3s;">
                ⚡ Respond Now
            </a>
        </div>
        
        <!-- What Happens if Expired -->
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0; border: 1px solid #e5e7eb;">
            <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">❓ What Happens if the Quote Expires?</h4>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                <li style="margin-bottom: 8px;">The quote will be automatically closed and marked as expired</li>
                <li style="margin-bottom: 8px;">You will no longer be able to respond to the quote request</li>
                <li style="margin-bottom: 8px;">This may negatively impact your vendor performance metrics</li>
                <li style="margin-bottom: 8px;">The customer may be assigned to another vendor</li>
                <li>You will receive an expiration notification email</li>
            </ul>
        </div>
        
        <!-- Need More Time -->
        <div style="background-color: #f0fdf4; padding: 20px; border-left: 4px solid #10b981; margin: 25px 0; border-radius: 4px;">
            <h4 style="color: #047857; font-size: 16px; margin: 0 0 10px 0;">🕐 Need More Time?</h4>
            <p style="margin: 0; color: #047857;">If you need additional time to prepare your response:</p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #047857;">
                <li style="margin-bottom: 5px;">Log in to your vendor portal and use the message thread</li>
                <li style="margin-bottom: 5px;">Contact our team to request a deadline extension</li>
                <li>Provide a valid reason and expected response date</li>
            </ul>
        </div>
        
        <!-- Performance Impact -->
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">📊 Performance Reminder</h4>
            <p style="margin: 0; color: #4b5563;">Timely responses help maintain your vendor performance rating:</p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #4b5563;">
                <li style="margin-bottom: 8px;"><strong>Response Rate:</strong> Percentage of quotes you respond to</li>
                <li style="margin-bottom: 8px;"><strong>Average Response Time:</strong> How quickly you respond to requests</li>
                <li style="margin-bottom: 8px;"><strong>Acceptance Rate:</strong> Percentage of quotes you accept</li>
                <li>These metrics influence future quote assignments</li>
            </ul>
        </div>
        
        <p style="margin-top: 30px; color: #4b5563;">We appreciate your prompt attention to this quote request and look forward to your response.</p>
        
        <p style="margin-top: 25px; color: #1f2937;">
            <strong>Best regards,</strong><br>
            <span style="color: #2563eb; font-weight: bold;">CanvaStencil Team</span>
        </p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 12px;">
        <p style="margin: 0 0 10px 0;">This is an automated reminder. Please do not reply to this email.</p>
        <p style="margin: 0;">© {{ date('Y') }} CanvaStencil. All rights reserved.</p>
    </div>
</body>
</html>
