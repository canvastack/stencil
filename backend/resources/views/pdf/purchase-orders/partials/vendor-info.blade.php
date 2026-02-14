<div class="vendor-title">Vendor Information</div>
<table class="info-table">
    <tr>
        <td>Vendor Name:</td>
        <td>{{ $vendor->name }}</td>
    </tr>
    @if(isset($vendor->email))
    <tr>
        <td>Email:</td>
        <td>{{ $vendor->email }}</td>
    </tr>
    @endif
    @if(isset($vendor->phone))
    <tr>
        <td>Phone:</td>
        <td>{{ $vendor->phone }}</td>
    </tr>
    @endif
    @if(isset($vendor->address))
    <tr>
        <td>Address:</td>
        <td>{{ $vendor->address }}</td>
    </tr>
    @endif
</table>
