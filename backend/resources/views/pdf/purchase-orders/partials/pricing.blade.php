<h2>Price Summary</h2>
<table class="price-summary">
    <tr>
        <td>Subtotal:</td>
        <td>{{ formatCurrency($po->subtotal) }}</td>
    </tr>
    @if($po->discount > 0)
    <tr>
        <td>Discount:</td>
        <td>-{{ formatCurrency($po->discount) }}</td>
    </tr>
    @endif
    <tr>
        <td>Tax (PPN 11%):</td>
        <td>{{ formatCurrency($po->tax) }}</td>
    </tr>
    @if($po->shipping > 0)
    <tr>
        <td>Shipping:</td>
        <td>{{ formatCurrency($po->shipping) }}</td>
    </tr>
    @endif
    <tr class="total-row">
        <td>Grand Total:</td>
        <td>{{ formatCurrency($po->grand_total) }}</td>
    </tr>
</table>
