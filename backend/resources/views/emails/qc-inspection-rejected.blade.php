<x-mail::message>
# Quality Control Inspection Failed

Dear {{ $vendor->name ?? 'Vendor' }},

We have completed the quality control inspection for Order #{{ $order->order_number }}, and unfortunately, the product did not meet our quality standards.

## Inspection Details

**Order Number:** {{ $order->order_number }}  
**Inspection Date:** {{ $inspection->inspection_date->format('F d, Y H:i') }}  
**Inspector:** {{ $inspection->inspector->name }}  
**Overall Score:** {{ $inspection->total_score }}%  
**Decision:** {{ $inspection->decision_label }}

## Issues Identified

{{ $inspection->decision_notes }}

@if($inspection->rework_deadline)
## Rework Deadline

Please address these issues and return the product by **{{ $reworkDeadline }}**.
@endif

## Next Steps

1. Review the detailed inspection report
2. Address all identified issues
3. Return the product for re-inspection
4. Contact us if you have any questions

<x-mail::button :url="config('app.url') . '/vendor/orders/' . $order->uuid">
View Order Details
</x-mail::button>

We appreciate your cooperation in maintaining our quality standards.

Best regards,  
{{ config('app.name') }} Quality Control Team
</x-mail::message>
