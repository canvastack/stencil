<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{ config('app.name') }} Vendor Portal</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
    <!-- Header with PT CEX Branding -->
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">{{ config('app.name') }}</h1>
        <p style="color: #dbeafe; margin: 10px 0 0 0; font-size: 14px;">Vendor Portal</p>
    </div>
    
    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #1e40af; margin-bottom: 20px; font-size: 24px;">Welcome to Our Vendor Network!</h2>
        
        <p style="margin-bottom: 20px;">Dear <strong>{{ $vendorName }}</strong>,</p>
        
        <p style="margin-bottom: 20px;">We're excited to have you join our network of trusted vendors at <strong>{{ config('app.name') }}</strong>. Your vendor portal account has been successfully created, giving you direct access to manage quote requests, communicate with our team, and track your business performance.</p>
        
        <!-- Login Credentials Section -->
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #2563eb;">
            <h3 style="color: #1e40af; font-size: 18px; margin: 0 0 15px 0;">🔐 Your Login Credentials</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0;"><strong>Email:</strong></td>
                    <td style="padding: 8px 0; color: #2563eb;">{{ $email }}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; vertical-align: top;"><strong>Temporary Password:</strong></td>
                    <td style="padding: 8px 0;">
                        <code style="background-color: #1e293b; color: #10b981; padding: 8px 12px; border-radius: 4px; font-size: 14px; font-family: 'Courier New', monospace; display: inline-block;">{{ $temporaryPassword }}</code>
                    </td>
                </tr>
            </table>
        </div>
        
        <!-- Security Notice -->
        <div style="background-color: #fef3c7; padding: 15px 20px; border-left: 4px solid #f59e0b; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;"><strong>⚠️ Security Notice:</strong> This is a temporary password. You will be required to change it upon your first login. Your temporary password will expire in 7 days.</p>
        </div>
        
        <!-- Portal Access Button -->
        <div style="text-align: center; margin: 35px 0;">
            <a href="{{ $loginUrl }}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3); transition: all 0.3s;">
                🚀 Access Vendor Portal
            </a>
        </div>
        
        <!-- Getting Started Guide -->
        <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #1e40af; font-size: 18px; margin: 0 0 20px 0;">📚 Getting Started Guide</h3>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #2563eb; font-size: 16px; margin: 0 0 10px 0;">1️⃣ First Login</h4>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                    <li style="margin-bottom: 8px;">Click the "Access Vendor Portal" button above</li>
                    <li style="margin-bottom: 8px;">Enter your email and temporary password</li>
                    <li style="margin-bottom: 8px;">You'll be prompted to create a new secure password</li>
                    <li>Complete your profile information</li>
                </ul>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #2563eb; font-size: 16px; margin: 0 0 10px 0;">2️⃣ Dashboard Overview</h4>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                    <li style="margin-bottom: 8px;">View your quote statistics and performance metrics</li>
                    <li style="margin-bottom: 8px;">See pending quote requests requiring your attention</li>
                    <li style="margin-bottom: 8px;">Track accepted, rejected, and countered quotes</li>
                    <li>Monitor upcoming quote expiration dates</li>
                </ul>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #2563eb; font-size: 16px; margin: 0 0 10px 0;">3️⃣ Managing Quote Requests</h4>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                    <li style="margin-bottom: 8px;"><strong>Accept:</strong> Provide estimated delivery days and optional notes</li>
                    <li style="margin-bottom: 8px;"><strong>Reject:</strong> Specify a reason for declining the quote</li>
                    <li style="margin-bottom: 8px;"><strong>Counter Offer:</strong> Propose an alternative price with notes</li>
                    <li>All responses are tracked with timestamps for transparency</li>
                </ul>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #2563eb; font-size: 16px; margin: 0 0 10px 0;">4️⃣ Communication</h4>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                    <li style="margin-bottom: 8px;">Use the message thread on each quote to communicate with our team</li>
                    <li style="margin-bottom: 8px;">Attach files (PDF, images, documents) up to 10MB each</li>
                    <li style="margin-bottom: 8px;">Receive email notifications for new messages</li>
                    <li>All communication is logged for reference</li>
                </ul>
            </div>
            
            <div>
                <h4 style="color: #2563eb; font-size: 16px; margin: 0 0 10px 0;">5️⃣ Profile Management</h4>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                    <li style="margin-bottom: 8px;">Keep your contact information up to date</li>
                    <li style="margin-bottom: 8px;">View your performance metrics and ratings</li>
                    <li style="margin-bottom: 8px;">Update your password and security settings</li>
                    <li>Review your quote history and statistics</li>
                </ul>
            </div>
        </div>
        
        <!-- Important Reminders -->
        <div style="background-color: #dbeafe; padding: 20px; border-left: 4px solid #2563eb; margin: 25px 0; border-radius: 4px;">
            <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">💡 Important Reminders</h4>
            <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                <li style="margin-bottom: 8px;">Respond to quote requests before the expiration date</li>
                <li style="margin-bottom: 8px;">Check your email regularly for new quote notifications</li>
                <li style="margin-bottom: 8px;">Keep your profile information current for smooth communication</li>
                <li>Contact support if you encounter any issues</li>
            </ul>
        </div>
        
        <!-- Support Information -->
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e5e7eb;">
            <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">📞 Need Help?</h4>
            <p style="margin: 0 0 10px 0; color: #4b5563;">Our support team is here to assist you:</p>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                <li style="margin-bottom: 8px;">Email: <a href="mailto:support@{{ parse_url(config('app.url'), PHP_URL_HOST) }}" style="color: #2563eb; text-decoration: none;">support@{{ parse_url(config('app.url'), PHP_URL_HOST) }}</a></li>
                <li style="margin-bottom: 8px;">Portal: Use the message thread on any quote</li>
                <li>Response time: Within 24 hours on business days</li>
            </ul>
        </div>
        
        <p style="margin-top: 30px; color: #4b5563;">We look forward to a successful partnership with you!</p>
        
        <p style="margin-top: 25px; color: #1f2937;">
            <strong>Best regards,</strong><br>
            <span style="color: #2563eb; font-weight: bold;">{{ config('app.name') }} Team</span>
        </p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 12px;">
        <p style="margin: 0 0 10px 0;">This is an automated message. Please do not reply to this email.</p>
        <p style="margin: 0;">© {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
    </div>
</body>
</html>
