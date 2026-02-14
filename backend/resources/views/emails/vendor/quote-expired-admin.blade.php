<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quote Expired - {{ $quoteNumber }}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">CanvaStencil</h1>
            <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px; font-weight: 500;">Vendor Portal - Admin Notification</p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <!-- Greeting -->
            <p style="font-size: 16px; color: #374151; margin: 0 0 24px 0;">Dear Admin Team,</p>

            <!-- Introduction -->
            <p style="font-size: 15px; color: #4b5563; margin: 0 0 28px 0; line-height: 1.7;">
                A quote request has expired without receiving a response from the vendor. Please review the details below and take appropriate action.
            </p>

            <!-- Expired Badge -->
            <div style="text-align: center; margin: 0 0 32px 0;">
                <div style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; padding: 16px 32px; border-radius: 12px; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                    ⏰ QUOTE EXPIRED
                </div>
            </div>

            <!-- Quote Details Box -->
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 24px; margin: 0 0 28px 0; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);">
                <h2 style="color: #1e40af; font-size: 18px; margin: 0 0 16px 0; font-weight: 600; border-bottom: 2px solid #3b82f6; padding-bottom: 12px;">📋 Quote Information</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600; width: 40%;">Quote Number:</td>
                        <td style="padding: 10px 0; color: #2563eb; font-size: 15px; font-weight: 700;">{{ $quoteNumber }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600; border-top: 1px solid #bfdbfe;">Vendor Name:</td>
                        <td style="padding: 10px 0; color: #1f2937; font-size: 15px; font-weight: 600; border-top: 1px solid #bfdbfe;">{{ $vendorName }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600; border-top: 1px solid #bfdbfe;">Order Number:</td>
                        <td style="padding: 10px 0; color: #1f2937; font-size: 15px; border-top: 1px solid #bfdbfe;">{{ $orderNumber }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600; border-top: 1px solid #bfdbfe;">Customer:</td>
                        <td style="padding: 10px 0; color: #1f2937; font-size: 15px; border-top: 1px solid #bfdbfe;">{{ $customerName }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600; border-top: 1px solid #bfdbfe;">Product:</td>
                        <td style="padding: 10px 0; color: #1f2937; font-size: 15px; border-top: 1px solid #bfdbfe;">{{ $productName }}</td>
                    </tr>
                </table>
            </div>

            <!-- Expiration Details Box -->
            <div style="background-color: #fef2f2; border: 2px solid #dc2626; border-radius: 12px; padding: 24px; margin: 0 0 28px 0;">
                <h2 style="color: #991b1b; font-size: 18px; margin: 0 0 16px 0; font-weight: 600; border-bottom: 2px solid #dc2626; padding-bottom: 12px;">⏰ Expiration Details</h2>
                
                <div style="margin-bottom: 16px;">
                    <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Expired On:</p>
                    <p style="margin: 0; color: #991b1b; font-size: 18px; font-weight: 700;">{{ \Carbon\Carbon::parse($expiresAt)->format('F j, Y \a\t g:i A') }}</p>
                </div>
                
                <div>
                    <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Status:</p>
                    <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6; background-color: #ffffff; padding: 12px; border-radius: 6px; border-left: 3px solid #dc2626;">
                        The vendor did not respond to this quote request before the expiration deadline. The quote has been automatically closed.
                    </p>
                </div>
            </div>

            <!-- Action Required Box -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 0 0 32px 0;">
                <p style="margin: 0 0 12px 0; color: #92400e; font-size: 15px; font-weight: 700;">⚠️ Action Required</p>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                    Please review this expired quote and determine the next steps. You may need to:
                </p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #78350f; font-size: 14px;">
                    <li style="margin-bottom: 5px;">Contact the vendor to understand why they didn't respond</li>
                    <li style="margin-bottom: 5px;">Extend the quote expiration date if the vendor is still interested</li>
                    <li style="margin-bottom: 5px;">Assign the quote to an alternative vendor</li>
                    <li>Update the customer on the order status</li>
                </ul>
            </div>

            <!-- View Quote Button -->
            <div style="text-align: center; margin: 0 0 32px 0;">
                <a href="{{ $quoteUrl }}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3); transition: all 0.3s ease;">
                    🔍 View Quote Details
                </a>
            </div>

            <!-- Recommended Actions -->
            <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin: 0 0 28px 0;">
                <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; font-weight: 700;">💡 Recommended Actions</p>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                    <li>Review the vendor's recent response history and performance metrics</li>
                    <li>Check if there were any communication issues or technical problems</li>
                    <li>Consider whether to extend the deadline or reassign to another vendor</li>
                    <li>Update the vendor's performance rating if this is a recurring issue</li>
                    <li>Communicate with the customer about potential delays</li>
                    <li>Document the reason for expiration in the quote notes</li>
                </ul>
            </div>

            <!-- Vendor Performance Note -->
            <div style="background-color: #dbeafe; padding: 20px; border-left: 4px solid #2563eb; margin: 25px 0; border-radius: 4px;">
                <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">📊 Vendor Performance Impact</h4>
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                    This expired quote without a response will be reflected in the vendor's performance metrics, including their response rate and average response time. You may want to review the vendor's overall performance to determine if any action is needed.
                </p>
            </div>

            <!-- Closing -->
            <p style="font-size: 15px; color: #4b5563; margin: 0 0 8px 0;">Best regards,</p>
            <p style="font-size: 15px; color: #1f2937; font-weight: 600; margin: 0;">CanvaStencil Vendor Portal System</p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
                This is an automated notification from the Vendor Portal system.
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © {{ date('Y') }} Custom Etching Xenial. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
