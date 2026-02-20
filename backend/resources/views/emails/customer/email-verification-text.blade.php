Verify Your Email Address

Hello {{ $customer->name }}!

@if($customer->tenant)
{{ $customer->tenant->name }}
Welcome to our customer portal
@endif

Thank you for registering with {{ $customer->tenant->name ?? 'CanvaStencil' }}! We're excited to have you as a customer.

To complete your registration and access your customer portal, please verify your email address by visiting the following link:

{{ $verificationUrl }}

SECURITY NOTICE:
- This verification link will expire in 24 hours for your security.
- If you didn't create an account with us, please ignore this email or contact our support team if you have concerns.

After verifying your email, you'll be able to:
- View and respond to quotations
- Track your orders in real-time
- Manage your profile and preferences
- Access your order history
- Submit product reviews
- Receive important notifications

Need help? Our support team is here to assist you. Feel free to reach out if you have any questions.

Best regards,
The {{ $customer->tenant->name ?? 'CanvaStencil' }} Team

© {{ date('Y') }} {{ $customer->tenant->name ?? 'CanvaStencil' }}. All rights reserved.

This email was sent to {{ $customer->email }}.
This is an automated message for customer account verification.
