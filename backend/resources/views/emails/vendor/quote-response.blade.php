<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vendor Quote Response</title>
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
                A vendor has responded to a quote request. Please review the response details below and take appropriate action.
            </p>

            <!-- Response Type Badge -->
            <div style="text-align: center; margin: 0 0 32px 0;">
                @if($responseType === 'accept')
                    <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 16px 32px; border-radius: 12px; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                        ✅ QUOTE ACCEPTED
                    </div>
                @elseif($responseType === 'reject')
                    <div style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; padding: 16px 32px; border-radius: 12px; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);">
                        ❌ QUOTE REJECTED
                    </div>
                @elseif($responseType === 'counter')
                    <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; padding: 16px 32px; border-radius: 12px; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">
                        💰 COUNTER OFFER
                    </div>
                @endif
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
                </table>
            </div>

            <!-- Response Details Box -->
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 0 0 28px 0;">
                <h2 style="color: #374151; font-size: 18px; margin: 0 0 16px 0; font-weight: 600; border-bottom: 2px solid #d1d5db; padding-bottom: 12px;">📝 Response Details</h2>
                
                @if($responseType === 'accept')
                    <!-- Accept Details -->
                    @if(isset($estimatedDeliveryDays))
                    <div style="margin-bottom: 16px;">
                        <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Estimated Delivery:</p>
                        <p style="margin: 0; color: #059669; font-size: 18px; font-weight: 700;">{{ $estimatedDeliveryDays }} days</p>
                    </div>
                    @endif
                    
                    @if(isset($notes) && $notes)
                    <div>
                        <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Vendor Notes:</p>
                        <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6; background-color: #ffffff; padding: 12px; border-radius: 6px; border-left: 3px solid #10b981;">{{ $notes }}</p>
                    </div>
                    @endif
                    
                    @if(!isset($estimatedDeliveryDays) && (!isset($notes) || !$notes))
                    <p style="margin: 0; color: #6b7280; font-size: 14px; font-style: italic;">The vendor accepted the quote without additional details.</p>
                    @endif

                @elseif($responseType === 'reject')
                    <!-- Reject Details -->
                    @if(isset($rejectionReason) && $rejectionReason)
                    <div>
                        <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Rejection Reason:</p>
                        <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6; background-color: #ffffff; padding: 12px; border-radius: 6px; border-left: 3px solid #ef4444;">{{ $rejectionReason }}</p>
                    </div>
                    @else
                    <p style="margin: 0; color: #6b7280; font-size: 14px; font-style: italic;">No rejection reason provided.</p>
                    @endif

                @elseif($responseType === 'counter')
                    <!-- Counter Offer Details -->
                    @if(isset($counterOfferAmount))
                    <div style="margin-bottom: 16px;">
                        <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Counter Offer Amount:</p>
                        <p style="margin: 0; color: #d97706; font-size: 22px; font-weight: 700;">Rp {{ number_format($counterOfferAmount, 0, ',', '.') }}</p>
                    </div>
                    @endif
                    
                    @if(isset($notes) && $notes)
                    <div>
                        <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Vendor Notes:</p>
                        <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6; background-color: #ffffff; padding: 12px; border-radius: 6px; border-left: 3px solid #f59e0b;">{{ $notes }}</p>
                    </div>
                    @endif
                    
                    @if(!isset($counterOfferAmount) && (!isset($notes) || !$notes))
                    <p style="margin: 0; color: #6b7280; font-size: 14px; font-style: italic;">The vendor submitted a counter offer without additional details.</p>
                    @endif
                @endif
            </div>

            <!-- Action Required Box -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 0 0 32px 0;">
                <p style="margin: 0 0 12px 0; color: #92400e; font-size: 15px; font-weight: 700;">⚠️ Action Required</p>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                    Please review this vendor response and take appropriate action in the admin panel. 
                    @if($responseType === 'accept')
                        You may need to proceed with order processing.
                    @elseif($responseType === 'reject')
                        You may need to contact another vendor or adjust the quote requirements.
                    @elseif($responseType === 'counter')
                        You may need to review and accept/reject the counter offer or negotiate further.
                    @endif
                </p>
            </div>

            <!-- View Quote Button -->
            <div style="text-align: center; margin: 0 0 32px 0;">
                <a href="{{ $quoteUrl }}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3); transition: all 0.3s ease;">
                    🔍 View Quote Details
                </a>
            </div>

            <!-- Quick Actions -->
            <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; margin: 0 0 28px 0;">
                <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; font-weight: 700;">💡 Quick Actions</p>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                    <li>Review the vendor's response details carefully</li>
                    <li>Check the quote history and previous negotiations</li>
                    <li>Verify pricing and delivery timeline alignment</li>
                    @if($responseType === 'accept')
                        <li>Proceed with order confirmation and vendor coordination</li>
                    @elseif($responseType === 'reject')
                        <li>Consider alternative vendors or quote adjustments</li>
                    @elseif($responseType === 'counter')
                        <li>Evaluate the counter offer against budget and requirements</li>
                    @endif
                    <li>Update the customer on the quote status if needed</li>
                </ul>
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

