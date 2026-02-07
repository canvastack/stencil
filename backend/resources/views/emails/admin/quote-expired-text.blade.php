Quote Expired

Hello {{ $admin->name }}!

Quote {{ $quoteNumber }} sent to vendor {{ $vendor->name }} has expired without a response.

Quote Number: {{ $quoteNumber }}
Vendor: {{ $vendor->name }}
Expired On: {{ $expiresAt ? $expiresAt->format('F j, Y') : 'N/A' }}

⚠️ Action Required

This quote has expired without receiving a response from the vendor. You may want to:
- Extend the quote expiration date
- Contact the vendor directly
- Consider alternative vendors

View Quote Details: {{ $viewUrl }}

What's Next?
- Review the quote details and vendor history
- Decide whether to extend the quote or seek alternatives
- Update the customer on the order status

Best regards,
The CanvaStencil Team

© {{ date('Y') }} CanvaStencil. All rights reserved.
