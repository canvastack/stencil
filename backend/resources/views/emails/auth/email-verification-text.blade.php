Hello {{ $user->name }}!

@if($tenantId)
ORGANIZATION: {{ $user->tenant->name ?? 'Your Organization' }}
You're verifying your email for this tenant account.
@endif

Welcome to {{ $tenantId ? ($user->tenant->name ?? 'CanvaStack') : 'CanvaStack Platform' }}! We're excited to have you on board.

To complete your registration and start using your account, please verify your email address by visiting the following link:

{{ $verificationUrl }}

SECURITY NOTICE:
🔒 This verification link will expire in 24 hours for your security.
🔒 If you didn't request this verification email, please ignore it or contact our support team if you have concerns.

After verifying your email, you'll be able to:
@if($tenantId)
- Access your {{ $user->tenant->name ?? 'organization' }} dashboard
- Collaborate with your team members
- Manage your account settings
@else
- Access your platform dashboard
- Manage tenant accounts
- View analytics and reports
@endif
- Receive important account notifications

Need help? Our support team is here to assist you. Feel free to reach out if you have any questions.

Best regards,
The {{ $tenantId ? ($user->tenant->name ?? 'CanvaStack') : 'CanvaStack Platform' }} Team

---
© {{ date('Y') }} CanvaStack. All rights reserved.

This email was sent to {{ $user->email }}. 
@if($tenantId)
This is an automated message for tenant: {{ $user->tenant->name ?? 'N/A' }}.
@else
This is an automated message for platform account verification.
@endif