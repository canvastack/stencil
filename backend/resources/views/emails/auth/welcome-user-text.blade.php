Welcome to {{ $tenantName ?? 'CanvaStack' }}!

Hello {{ $user->name }}!

@if($tenantId && isset($tenantName))
ORGANIZATION: {{ $tenantName }}
You've been successfully registered for this organization.
@endif

Congratulations! Your account has been successfully created. We're thrilled to have you join our community.

Your account is now active and ready to use. You can access all the features and start collaborating with your team right away.

GET STARTED: {{ $loginUrl }}

@if($showCredentials ?? false)
📋 YOUR ACCOUNT DETAILS:
- Email: {{ $user->email }}
@if($tenantId && isset($tenantDomain))
- Organization: {{ $tenantDomain }}
@endif
- Account Type: {{ $userRole ?? 'User' }}
@endif

🚀 WHAT'S NEXT?
@if(!$user->email_verified_at)
1. Verify your email - Check your inbox for the verification email
@endif
{{ !$user->email_verified_at ? '2' : '1' }}. Complete your profile - Add your photo and personal information
@if($tenantId)
{{ !$user->email_verified_at ? '3' : '2' }}. Explore your workspace - Get familiar with your organization's features
{{ !$user->email_verified_at ? '4' : '3' }}. Connect with your team - Start collaborating on projects
@else
{{ !$user->email_verified_at ? '3' : '2' }}. Set up your first tenant - Create your organization
{{ !$user->email_verified_at ? '4' : '3' }}. Configure platform settings - Customize your experience
@endif
{{ !$user->email_verified_at ? '5' : '4' }}. Need help? - Visit our documentation or contact support

FEATURES AVAILABLE TO YOU:
@if($tenantId)
📊 Dashboard - Monitor your organization's activity and performance
👥 Team Management - Collaborate effectively with your team members
🔒 Security - Enterprise-grade security for your data
@else
🏢 Multi-Tenant - Manage multiple organizations from one platform
📈 Analytics - Comprehensive insights across all tenants
⚙️ Platform Control - Full platform administration capabilities
@endif

If you have any questions or need assistance getting started, our support team is here to help. Don't hesitate to reach out!

Welcome aboard, and let's build something amazing together! 🚀

Best regards,
The {{ $tenantName ?? 'CanvaStack Platform' }} Team

---
Documentation | Support | Community
© {{ date('Y') }} CanvaStack. All rights reserved.

This email was sent to {{ $user->email }}. 
@if($tenantId && isset($tenantName))
Welcome to {{ $tenantName }}!
@else
Welcome to the CanvaStack Platform!
@endif