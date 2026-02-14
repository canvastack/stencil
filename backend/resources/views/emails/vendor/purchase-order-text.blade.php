NEW PURCHASE ORDER
==================

Dear {{ $vendorName }},

We are pleased to issue the following Purchase Order for your accepted quote.

PURCHASE ORDER DETAILS
-----------------------
PO Number: {{ $poNumber }}
Order Number: {{ $orderNumber }}
Issue Date: {{ $issueDate }}
Expected Delivery: {{ $expectedDeliveryDate }}
Total Amount: {{ formatCurrency($grandTotal, $currency) }}

PRODUCTION TIMELINE
-------------------
Production must be completed within {{ $deliveryDays }} days.
Please ensure delivery by {{ $expectedDeliveryDate }}.

ATTACHED DOCUMENT
-----------------
The complete Purchase Order document is attached to this email as a PDF file.

Please:
- Review all specifications and terms carefully
- Confirm receipt within 24 hours
- Contact us immediately if you have any questions
- Keep this document for your records

NEXT STEPS
----------
1. Confirm receipt of this Purchase Order
2. Begin production according to specifications
3. Update production status in the vendor portal
4. Notify us of any potential delays immediately
5. Arrange delivery by the expected delivery date

VIEW IN PORTAL
--------------
{{ $portalUrl }}

NEED HELP?
----------
If you have any questions or concerns about this Purchase Order:
Email: {{ config('mail.from.address') }}
Vendor Portal: {{ config('app.frontend_url') }}/vendor

Thank you for your partnership and commitment to quality.

Best regards,
PT Custom Etching Xenial
via CanvaStencil Platform

---
This is an automated message. Please do not reply to this email.
For support, please use the vendor portal or contact us directly.

© 2026 CanvaStencil. All rights reserved.
