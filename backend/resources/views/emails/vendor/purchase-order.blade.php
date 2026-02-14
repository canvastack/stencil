<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchase Order - {{ $poNumber }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
    <!-- Header with PT CEX Branding -->
    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">CanvaStencil</h1>
        <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 14px;">Purchase Order Notification</p>
    </div>
    
    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #047857; margin-bottom: 20px; font-size: 24px;">📄 New Purchase Order</h2>
        
        <p style="margin-bottom: 20px;">Dear <strong>{{ $vendorName }}</strong>,</p>
        
        <p style="margin-bottom: 20px;">We are pleased to issue the following Purchase Order for your accepted quote. Please review the attached PDF document for complete details and specifications.</p>
        
        <!-- PO Details Section -->
        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #059669;">
            <h3 style="color: #047857; font-size: 18px; margin: 0 0 15px 0;">📋 Purchase Order Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0;"><strong>PO Number:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0; color: #059669; font-weight: bold;">{{ $poNumber }}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0;"><strong>Order Number:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0;">{{ $orderNumber }}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0;"><strong>Issue Date:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0;">{{ $issueDate }}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0;"><strong>Expected Delivery:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #a7f3d0; color: #dc2626; font-weight: bold;">{{ $expectedDeliveryDate }}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;"><strong>Total Amount:</strong></td>
                    <td style="padding: 8px 0; color: #059669; font-weight: bold; font-size: 18px;">{{ formatCurrency($grandTotal, $currency) }}</td>
                </tr>
            </table>
        </div>
        
        <!-- Delivery Timeline -->
        <div style="background-color: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;">
                <strong>⏰ Production Timeline:</strong> 
                <span style="font-size: 18px; font-weight: bold; color: #b45309;">{{ $deliveryDays }} days</span>
            </p>
            <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">
                Please ensure production is completed and delivered by the expected delivery date.
            </p>
        </div>
        
        <!-- Important Notice -->
        <div style="background-color: #dbeafe; padding: 20px; border-left: 4px solid #2563eb; margin: 25px 0; border-radius: 4px;">
            <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">📎 Attached Document</h4>
            <p style="margin: 0; color: #1e40af;">The complete Purchase Order document is attached to this email as a PDF file. Please:</p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #1e40af;">
                <li style="margin-bottom: 5px;">Review all specifications and terms carefully</li>
                <li style="margin-bottom: 5px;">Confirm receipt within 24 hours</li>
                <li style="margin-bottom: 5px;">Contact us immediately if you have any questions</li>
                <li>Keep this document for your records</li>
            </ul>
        </div>
        
        <!-- View in Portal Button -->
        <div style="text-align: center; margin: 35px 0;">
            <a href="{{ $portalUrl }}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3); transition: all 0.3s;">
                🔍 View in Vendor Portal
            </a>
        </div>
        
        <!-- Next Steps -->
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h4 style="color: #047857; font-size: 16px; margin: 0 0 10px 0;">✅ Next Steps</h4>
            <ol style="margin: 0; padding-left: 20px; color: #4b5563;">
                <li style="margin-bottom: 8px;">Confirm receipt of this Purchase Order</li>
                <li style="margin-bottom: 8px;">Begin production according to specifications</li>
                <li style="margin-bottom: 8px;">Update production status in the vendor portal</li>
                <li style="margin-bottom: 8px;">Notify us of any potential delays immediately</li>
                <li>Arrange delivery by the expected delivery date</li>
            </ol>
        </div>
        
        <!-- Contact Information -->
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">📞 Need Help?</h4>
            <p style="margin: 0; color: #4b5563;">If you have any questions or concerns about this Purchase Order, please contact us:</p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #4b5563; list-style: none;">
                <li style="margin-bottom: 5px;">📧 Email: {{ config('mail.from.address') }}</li>
                <li style="margin-bottom: 5px;">🌐 Vendor Portal: <a href="{{ config('app.frontend_url') }}/vendor" style="color: #2563eb;">Login Here</a></li>
            </ul>
        </div>
        
        <p style="margin-top: 30px; color: #4b5563;">Thank you for your partnership and commitment to quality.</p>
        
        <p style="margin-top: 25px; color: #1f2937;">
            <strong>Best regards,</strong><br>
            <span style="color: #059669; font-weight: bold;">PT Custom Etching Xenial</span><br>
            <span style="color: #6b7280; font-size: 14px;">via CanvaStencil Platform</span>
        </p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 12px;">
        <p style="margin: 0 0 10px 0;">This is an automated message. Please do not reply to this email.</p>
        <p style="margin: 0 0 10px 0;">For support, please use the vendor portal or contact us directly.</p>
        <p style="margin: 0;">© 2026 CanvaStencil. All rights reserved.</p>
    </div>
</body>
</html>
