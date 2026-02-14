<h2>Terms & Conditions</h2>

<h3>Payment Terms</h3>
<ul>
    <li>Payment Method: {{ $po->payment_method ?? 'Bank Transfer' }}</li>
    @if($po->payment_schedule)
        @foreach($po->payment_schedule as $schedule)
        <li>{{ $schedule['description'] ?? '' }}: {{ $schedule['percentage'] ?? 0 }}%</li>
        @endforeach
    @else
        <li>Down Payment: 50% upon PO acceptance</li>
        <li>Balance: 50% upon delivery</li>
    @endif
</ul>

<h3>Delivery Terms</h3>
<ul>
    <li>Estimated Production Time: {{ $po->quote->quote_details['estimated_delivery_days'] ?? 'N/A' }} days from PO acceptance</li>
    <li>Expected Delivery Date: {{ $po->expected_delivery_date->format('d F Y') }}</li>
    @if($po->delivery_address)
    <li>Delivery Location: {{ $po->delivery_address }}</li>
    @endif
    @if($po->delivery_method)
    <li>Delivery Method: {{ ucfirst($po->delivery_method) }}</li>
    @endif
    <li>Packaging Requirements: Standard packaging suitable for product protection</li>
</ul>

<h3>Quality Standards</h3>
<ul>
    <li>Product must meet specifications as detailed above</li>
    <li>Quality inspection will be conducted upon delivery</li>
    <li>Defective items must be replaced at vendor's cost</li>
    <li>Warranty period: 30 days from delivery</li>
</ul>

<h3>General Terms</h3>
<ul>
    <li>This PO is valid for 30 days from issue date</li>
    <li>Any changes must be agreed in writing by both parties</li>
    <li>Late delivery penalties may apply as per agreement</li>
    <li>Force majeure clause applies</li>
    <li>Dispute resolution: Arbitration in Jakarta, Indonesia</li>
</ul>

<div class="signature-section">
    <table class="signature-table">
        <tr>
            <td>
                <div><strong>Issued By:</strong></div>
                <div>{{ config('app.name', 'PT Custom Etching Xenial') }}</div>
                <div class="signature-line"></div>
                <div class="signature-name">{{ $po->createdBy->name ?? 'Authorized Person' }}</div>
                <div class="signature-position">{{ $po->createdBy->position ?? 'Purchasing Manager' }}</div>
                <div>Date: {{ $po->issue_date->format('d F Y') }}</div>
            </td>
            <td>
                <div><strong>Accepted By:</strong></div>
                <div>{{ $po->vendor->name }}</div>
                <div class="signature-line"></div>
                <div class="signature-name">_____________________</div>
                <div class="signature-position">Authorized Person</div>
                <div>Date: _____________________</div>
            </td>
        </tr>
    </table>
</div>
