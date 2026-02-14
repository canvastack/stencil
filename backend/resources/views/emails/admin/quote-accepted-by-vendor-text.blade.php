QUOTE ACCEPTED BY VENDOR
========================

Hello {{ $admin->name }}!

Great news! Vendor {{ $vendorName }} has accepted quote {{ $quoteNumber }} for order {{ $orderNumber }}.

ORDER STATUS UPDATED
--------------------
The order has been automatically advanced to Customer Quote stage. You can now proceed with creating a customer quotation.

QUOTE DETAILS
-------------
Quote Number: {{ $quoteNumber }}
Order Number: {{ $orderNumber }}
Vendor: {{ $vendorName }}
Agreed Price: Rp {{ number_format($agreedPrice, 0, ',', '.') }}
Estimated Delivery: {{ $estimatedDeliveryDays }} days
Expected Delivery Date: {{ \Carbon\Carbon::now()->addDays($estimatedDeliveryDays)->format('F j, Y') }}

NEXT STEPS
----------
1. Review Order Details: Check the order page for complete information
2. Create Customer Quote: Prepare quotation for the customer
3. Monitor Production: Track production progress against the delivery timeline
4. Generate Purchase Order: Create PO for the vendor (optional)

ACTION REQUIRED
---------------
View Order Details: {{ $orderUrl }}
View Quote Details: {{ $quoteUrl }}

TIP: The order page now displays vendor quote information and production progress tracking. You can monitor the countdown to the expected delivery date.

Best regards,
The CanvaStencil Team

© {{ date('Y') }} CanvaStencil. All rights reserved.
