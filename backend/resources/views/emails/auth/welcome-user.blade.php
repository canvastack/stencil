<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{ $tenantName ?? 'CanvaStack' }}!</title>
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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
        .welcome-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 16px 0;
            text-align: center;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            transition: all 0.2s ease;
        }
        .welcome-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 24px;
            margin: 32px 0;
        }
        .feature-card {
            background: #f8fafc;
            padding: 24px;
            border-radius: 8px;
            text-align: center;
        }
        .feature-icon {
            font-size: 32px;
            margin-bottom: 12px;
            display: block;
        }
        .feature-title {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 8px;
        }
        .feature-desc {
            color: #718096;
            font-size: 14px;
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
            font-size: 18px;
        }
        .tenant-details {
            color: #4299e1;
            font-size: 14px;
        }
        .credentials-box {
            background: #fffbeb;
            border: 1px solid #fed7aa;
            border-radius: 6px;
            padding: 20px;
            margin: 24px 0;
        }
        .credentials-title {
            color: #92400e;
            font-weight: 600;
            margin-bottom: 12px;
            font-size: 16px;
        }
        .credential-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #fde68a;
        }
        .credential-item:last-child {
            border-bottom: none;
        }
        .credential-label {
            font-weight: 500;
            color: #78350f;
        }
        .credential-value {
            font-family: 'Courier New', monospace;
            color: #92400e;
            background: #fef3c7;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 13px;
        }
        .next-steps {
            background: #f0fff4;
            border-left: 4px solid #10b981;
            padding: 20px;
            margin: 24px 0;
            border-radius: 0 6px 6px 0;
        }
        .next-steps-title {
            color: #047857;
            font-weight: 600;
            margin-bottom: 12px;
        }
        .steps-list {
            color: #065f46;
            margin: 0;
            padding-left: 20px;
        }
        .steps-list li {
            margin-bottom: 8px;
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
        .social-links {
            margin: 20px 0;
        }
        .social-links a {
            display: inline-block;
            margin: 0 8px;
            color: #718096;
            text-decoration: none;
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
            .features-grid {
                grid-template-columns: 1fr;
            }
            .welcome-button {
                display: block;
                width: 100%;
                box-sizing: border-box;
            }
            .credential-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="header">
                <span class="icon">🎉</span>
                <h1>Welcome to {{ $tenantName ?? 'CanvaStack' }}!</h1>
            </div>
            
            <div class="content">
                <div class="greeting">Hello {{ $user->name }}!</div>
                
                @if($tenantId && isset($tenantName))
                <div class="tenant-info">
                    <div class="tenant-name">{{ $tenantName }}</div>
                    <div class="tenant-details">You've been successfully registered for this organization</div>
                </div>
                @endif
                
                <div class="message">
                    <p>Congratulations! Your account has been successfully created. We're thrilled to have you join our community.</p>
                    
                    <p>Your account is now active and ready to use. You can access all the features and start collaborating with your team right away.</p>
                </div>
                
                <div class="button-container">
                    <a href="{{ $loginUrl }}" class="welcome-button">
                        Get Started Now
                    </a>
                </div>
                
                @if($showCredentials ?? false)
                <div class="credentials-box">
                    <div class="credentials-title">📋 Your Account Details</div>
                    <div class="credential-item">
                        <span class="credential-label">Email:</span>
                        <span class="credential-value">{{ $user->email }}</span>
                    </div>
                    @if($tenantId && isset($tenantDomain))
                    <div class="credential-item">
                        <span class="credential-label">Organization:</span>
                        <span class="credential-value">{{ $tenantDomain }}</span>
                    </div>
                    @endif
                    <div class="credential-item">
                        <span class="credential-label">Account Type:</span>
                        <span class="credential-value">{{ $userRole ?? 'User' }}</span>
                    </div>
                </div>
                @endif
                
                <div class="next-steps">
                    <div class="next-steps-title">🚀 What's Next?</div>
                    <ol class="steps-list">
                        @if(!$user->email_verified_at)
                        <li><strong>Verify your email</strong> - Check your inbox for the verification email</li>
                        @endif
                        <li><strong>Complete your profile</strong> - Add your photo and personal information</li>
                        @if($tenantId)
                        <li><strong>Explore your workspace</strong> - Get familiar with your organization's features</li>
                        <li><strong>Connect with your team</strong> - Start collaborating on projects</li>
                        @else
                        <li><strong>Set up your first tenant</strong> - Create your organization</li>
                        <li><strong>Configure platform settings</strong> - Customize your experience</li>
                        @endif
                        <li><strong>Need help?</strong> - Visit our documentation or contact support</li>
                    </ol>
                </div>
                
                <div class="features-grid">
                    @if($tenantId)
                    <div class="feature-card">
                        <span class="feature-icon">📊</span>
                        <div class="feature-title">Dashboard</div>
                        <div class="feature-desc">Monitor your organization's activity and performance</div>
                    </div>
                    <div class="feature-card">
                        <span class="feature-icon">👥</span>
                        <div class="feature-title">Team Management</div>
                        <div class="feature-desc">Collaborate effectively with your team members</div>
                    </div>
                    <div class="feature-card">
                        <span class="feature-icon">🔒</span>
                        <div class="feature-title">Security</div>
                        <div class="feature-desc">Enterprise-grade security for your data</div>
                    </div>
                    @else
                    <div class="feature-card">
                        <span class="feature-icon">🏢</span>
                        <div class="feature-title">Multi-Tenant</div>
                        <div class="feature-desc">Manage multiple organizations from one platform</div>
                    </div>
                    <div class="feature-card">
                        <span class="feature-icon">📈</span>
                        <div class="feature-title">Analytics</div>
                        <div class="feature-desc">Comprehensive insights across all tenants</div>
                    </div>
                    <div class="feature-card">
                        <span class="feature-icon">⚙️</span>
                        <div class="feature-title">Platform Control</div>
                        <div class="feature-desc">Full platform administration capabilities</div>
                    </div>
                    @endif
                </div>
                
                <div class="message">
                    <p>If you have any questions or need assistance getting started, our support team is here to help. Don't hesitate to reach out!</p>
                    
                    <p>Welcome aboard, and let's build something amazing together! 🚀</p>
                </div>
            </div>
            
            <div class="footer">
                <p class="footer-text">
                    Best regards,<br>
                    The {{ $tenantName ?? 'CanvaStack Platform' }} Team
                </p>
                
                <div class="social-links">
                    <a href="#">Documentation</a> |
                    <a href="#">Support</a> |
                    <a href="#">Community</a>
                </div>
                
                <p class="footer-text" style="margin-top: 16px;">
                    © {{ date('Y') }} CanvaStack. All rights reserved.
                </p>
                
                <p class="footer-text" style="font-size: 12px; margin-top: 16px;">
                    This email was sent to {{ $user->email }}. 
                    @if($tenantId && isset($tenantName))
                    Welcome to {{ $tenantName }}!
                    @else
                    Welcome to the CanvaStack Platform!
                    @endif
                </p>
            </div>
        </div>
    </div>
</body>
</html>