<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Purchase Order - {{ $po->po_number }}</title>
    <style>
        @include('pdf.purchase-orders.styles')
    </style>
</head>
<body>
    @include('pdf.purchase-orders.partials.header', ['po' => $po])
    
    <div class="vendor-section">
        @include('pdf.purchase-orders.partials.vendor-info', ['vendor' => $po->vendor])
    </div>
    
    <div class="order-details">
        <h2>Order Details</h2>
        <table class="info-table">
            <tr>
                <td>Order Number:</td>
                <td>{{ $po->order->order_number }}</td>
            </tr>
            <tr>
                <td>Order Date:</td>
                <td>{{ $po->order->created_at->format('d F Y') }}</td>
            </tr>
            <tr>
                <td>Expected Delivery:</td>
                <td>{{ $po->expected_delivery_date->format('d F Y') }}</td>
            </tr>
            @if($po->delivery_address)
            <tr>
                <td>Delivery Address:</td>
                <td>{{ $po->delivery_address }}</td>
            </tr>
            @endif
            @if($po->special_instructions)
            <tr>
                <td>Special Instructions:</td>
                <td>{{ $po->special_instructions }}</td>
            </tr>
            @endif
        </table>
    </div>
    
    <div class="items-section">
        @include('pdf.purchase-orders.partials.items-table', ['items' => $items])
    </div>
    
    <div class="pricing-section">
        @include('pdf.purchase-orders.partials.pricing', ['po' => $po])
    </div>
    
    <div class="terms-section">
        @include('pdf.purchase-orders.partials.terms', ['po' => $po])
    </div>
    
    @include('pdf.purchase-orders.partials.footer', ['po' => $po])
</body>
</html>
