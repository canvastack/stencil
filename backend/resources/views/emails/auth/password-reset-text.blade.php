Password Reset Request - {{ $appName }}

Hello {{ $user->name }},

We received a request to reset the password for your account.

If you made this request, please visit the following URL to reset your password:
{{ $resetUrl }}

IMPORTANT INFORMATION:
- This reset link will expire in {{ $expiresIn }} hours
- The link can only be used once
- If you didn't request this reset, you can safely ignore this email

SECURITY NOTE:
If you didn't request this password reset, please ignore this email or contact our support team if you have concerns about your account security.

@if($tenantId)
Tenant ID: {{ $tenantId }}
@endif

This email was sent from {{ $appName }}.
If you have any questions, please contact our support team.