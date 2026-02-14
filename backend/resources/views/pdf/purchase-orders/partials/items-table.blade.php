<h2>Product Specifications</h2>
<table class="items-table">
    <thead>
        <tr>
            <th style="width: 5%;">No</th>
            <th style="width: 25%;">Product Description</th>
            <th style="width: 35%;">Specifications</th>
            <th style="width: 10%;">Quantity</th>
            <th style="width: 12.5%;">Unit Price</th>
            <th style="width: 12.5%;">Total Price</th>
        </tr>
    </thead>
    <tbody>
        @foreach($items as $index => $item)
        <tr>
            <td>{{ $index + 1 }}</td>
            <td>{{ $item['product_name'] ?? 'N/A' }}</td>
            <td>
                <div class="specifications">
                    @if(isset($item['specifications']) && is_array($item['specifications']))
                        @foreach($item['specifications'] as $key => $value)
                            @if(!empty($value))
                            <div class="specifications-item">
                                <strong>{{ ucfirst(str_replace('_', ' ', $key)) }}:</strong> {{ $value }}
                            </div>
                            @endif
                        @endforeach
                    @else
                        N/A
                    @endif
                </div>
            </td>
            <td>{{ $item['quantity'] ?? 1 }} pcs</td>
            <td class="text-right">{{ formatCurrency($item['pricing']['unit_price'] ?? 0) }}</td>
            <td class="text-right">{{ formatCurrency($item['pricing']['total_price'] ?? 0) }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
