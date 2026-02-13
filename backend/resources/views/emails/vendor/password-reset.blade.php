<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
        <h1 style="color: #2563eb; margin-bottom: 20px;">Password Reset Request</h1>
        
        <p>Dear {{ $vendorName }},</p>
        
        <p>We received a request to reset your password for your vendor portal account. If you didn't make this request, you can safely ignore this email.</p>
        
        <div style="background-color: #fff; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #1e40af; font-size: 18px; margin-bottom: 15px;">Reset Your Password</h2>
            <p>Click the button below to reset your password. This link will expire in <strong>{{ $expiresIn }} minutes</strong>.</p>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
            <a href="{{ $resetUrl }}" style="display: inline-block; background-color: #2563eb; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="margin: 0;"><strong>🔒 Security Tip:</strong> Never share your password with anyone. Our team will never ask for your password via email.</p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">If the button above doesn't work, copy and paste this link into your browser:</p>
            <p style="margin: 10px 0 0 0; word-break: break-all; font-size: 12px; color: #2563eb;">{{ $resetUrl }}</p>
        </div>
        
        <p>If you didn't request a password reset, please contact our support team immediately to secure your account.</p>
        
        <p style="margin-top: 30px;">Best regards,<br>{{ config('app.name') }} Team</p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>Request received from IP: {{ $ipAddress }} at {{ $requestedAt }}</p>
    </div>
</body>
</html>
