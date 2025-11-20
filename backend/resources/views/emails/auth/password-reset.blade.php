<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
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
        .email-card {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 40px 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #2d3748;
        }
        .message {
            font-size: 16px;
            line-height: 1.7;
            margin-bottom: 30px;
            color: #4a5568;
        }
        .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: transform 0.2s;
        }
        .reset-button:hover {
            transform: translateY(-2px);
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .info-box {
            background: #edf2f7;
            border-left: 4px solid #4299e1;
            padding: 20px;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
        }
        .info-box h3 {
            margin: 0 0 10px;
            color: #2b6cb0;
            font-size: 16px;
        }
        .info-box p {
            margin: 0;
            color: #4a5568;
            font-size: 14px;
        }
        .footer {
            background: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 0;
            color: #718096;
            font-size: 14px;
        }
        .footer a {
            color: #4299e1;
            text-decoration: none;
        }
        .security-note {
            background: #fff5f5;
            border: 1px solid #feb2b2;
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
        }
        .security-note h4 {
            margin: 0 0 10px;
            color: #c53030;
            font-size: 14px;
            font-weight: 600;
        }
        .security-note p {
            margin: 0;
            color: #742a2a;
            font-size: 13px;
        }
        .link-fallback {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
            word-break: break-all;
        }
        .link-fallback p {
            margin: 0 0 10px;
            font-size: 14px;
            color: #4a5568;
        }
        .link-fallback code {
            background: #edf2f7;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
            font-size: 13px;
            color: #2d3748;
            display: block;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-card">
            <div class="header">
                <h1>Password Reset Request</h1>
                <p>{{ $appName }}</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Hello {{ $user->name }},
                </div>
                
                <div class="message">
                    <p>We received a request to reset the password for your account. If you made this request, please click the button below to reset your password:</p>
                </div>
                
                <div class="button-container">
                    <a href="{{ $resetUrl }}" class="reset-button">Reset My Password</a>
                </div>
                
                <div class="info-box">
                    <h3>Important Information:</h3>
                    <p>
                        • This reset link will expire in <strong>{{ $expiresIn }} hours</strong><br>
                        • The link can only be used once<br>
                        • If you didn't request this reset, you can safely ignore this email
                    </p>
                </div>
                
                <div class="link-fallback">
                    <p><strong>Having trouble with the button above?</strong> Copy and paste the following URL into your browser:</p>
                    <code>{{ $resetUrl }}</code>
                </div>
                
                <div class="security-note">
                    <h4>Security Note</h4>
                    <p>
                        If you didn't request this password reset, please ignore this email or contact our support team if you have concerns about your account security.
                    </p>
                </div>
            </div>
            
            <div class="footer">
                <p>
                    This email was sent from <strong>{{ $appName }}</strong><br>
                    @if($tenantId)
                        Tenant ID: {{ $tenantId }}<br>
                    @endif
                    If you have any questions, please contact our support team.
                </p>
            </div>
        </div>
    </div>
</body>
</html>