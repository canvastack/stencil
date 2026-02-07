Vendor Response Received

Hello {{ $admin->name }}!

Vendor {{ $vendor->name }} has {{ $responseLabel }} quote {{ $quoteNumber }}.

Quote Number: {{ $quoteNumber }}
Vendor: {{ $vendor->name }}
Response: {{ ucfirst($responseLabel) }}

@if($responseNotes)
Vendor Notes:
{{ $responseNotes }}
@endif

View Quote Details: {{ $viewUrl }}

What's Next?
@if($quote->getResponseType() === 'accept')
- Review the accepted terms
- Proceed with order processing
- Notify the customer of the acceptance
@elseif($quote->getResponseType() === 'reject')
- Review the rejection reason
- Consider alternative vendors
- Update the customer on the status
@elseif($quote->getResponseType() === 'counter')
- Review the counter offer details
- Evaluate the new terms
- Accept or negotiate further
@endif

Best regards,
The CanvaStencil Team

© {{ date('Y') }} CanvaStencil. All rights reserved.
