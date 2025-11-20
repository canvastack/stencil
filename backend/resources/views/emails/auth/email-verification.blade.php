<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email Address</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .email-wrapper {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header .icon {
            font-size: 48px;
            margin-bottom: 16px;
            display: block;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 16px;
            color: #2d3748;
        }
        .message {
            color: #4a5568;
            margin-bottom: 32px;
        }
        .verification-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 16px 0;
            text-align: center;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            transition: all 0.2s ease;
        }
        .verification-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .alternative-text {
            font-size: 14px;
            color: #718096;
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
        }
        .verification-code {
            background: #f7fafc;
            border: 2px dashed #cbd5e0;
            border-radius: 6px;
            padding: 16px;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            color: #2d3748;
            margin: 16px 0;
        }
        .footer {
            background: #f8fafc;
            padding: 32px 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer-text {
            color: #718096;
            font-size: 14px;
            margin: 0;
        }
        .tenant-info {
            background: #ebf8ff;
            border-left: 4px solid #3182ce;
            padding: 16px;
            margin: 24px 0;
            border-radius: 0 6px 6px 0;
        }
        .tenant-name {
            font-weight: 600;
            color: #2b6cb0;
            margin-bottom: 4px;
        }
        .warning-box {
            background: #fffbeb;
            border: 1px solid #fed7aa;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
        }
        .warning-title {
            color: #92400e;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .warning-text {
            color: #b45309;
            font-size: 14px;
        }
        @media only screen and (max-width: 600px) {
            .container {
                padding: 20px 10px;
            }
            .content, .footer {
                padding: 24px 20px;
            }
            .header {
                padding: 32px 20px;
            }
            .header h1 {
                font-size: 24px;
            }
            .verification-button {
                display: block;
                width: 100%;
                box-sizing: border-box;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="header">
                <span class="icon">✉️</span>
                <h1>Verify Your Email</h1>
            </div>
            
            <div class="content">
                <div class="greeting">Hello {{ $user->name }}!</div>
                
                @if($tenantId)
                <div class="tenant-info">
                    <div class="tenant-name">{{ $user->tenant->name ?? 'Your Organization' }}</div>
                    <div>You're verifying your email for this tenant account</div>
                </div>
                @endif
                
                <div class="message">
                    <p>Welcome to {{ $tenantId ? ($user->tenant->name ?? 'CanvaStack') : 'CanvaStack Platform' }}! We're excited to have you on board.</p>
                    
                    <p>To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
                </div>
                
                <div class="button-container">
                    <a href="{{ $verificationUrl }}" class="verification-button">
                        Verify Email Address
                    </a>
                </div>
                
                <div class="alternative-text">
                    <p><strong>Having trouble clicking the button?</strong> Copy and paste the following link into your web browser:</p>
                    <div style="background: #f7fafc; padding: 12px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px; color: #4a5568;">
                        {{ $verificationUrl }}
                    </div>
                </div>
                
                <div class="warning-box">
                    <div class="warning-title">🔒 Security Notice</div>
                    <div class="warning-text">
                        <p>This verification link will expire in <strong>24 hours</strong> for your security.</p>
                        <p>If you didn't request this verification email, please ignore it or contact our support team if you have concerns.</p>
                    </div>
                </div>
                
                <div class="alternative-text">
                    <p>After verifying your email, you'll be able to:</p>
                    <ul style="color: #4a5568; padding-left: 20px;">
                        @if($tenantId)
                        <li>Access your {{ $user->tenant->name ?? 'organization' }} dashboard</li>
                        <li>Collaborate with your team members</li>
                        <li>Manage your account settings</li>
                        @else
                        <li>Access your platform dashboard</li>
                        <li>Manage tenant accounts</li>
                        <li>View analytics and reports</li>
                        @endif
                        <li>Receive important account notifications</li>
                    </ul>
                </div>
                
                <div class="alternative-text">
                    <p>Need help? Our support team is here to assist you. Feel free to reach out if you have any questions.</p>
                </div>
            </div>
            
            <div class="footer">
                <p class="footer-text">
                    Best regards,<br>
                    The {{ $tenantId ? ($user->tenant->name ?? 'CanvaStack') : 'CanvaStack Platform' }} Team
                </p>
                
                <p class="footer-text" style="margin-top: 16px;">
                    © {{ date('Y') }} CanvaStack. All rights reserved.
                </p>
                
                <p class="footer-text" style="font-size: 12px; margin-top: 16px;">
                    This email was sent to {{ $user->email }}. 
                    @if($tenantId)
                    This is an automated message for tenant: {{ $user->tenant->name ?? 'N/A' }}.
                    @else
                    This is an automated message for platform account verification.
                    @endif
                </p>
            </div>
        </div>
    </div>
</body>
</html>