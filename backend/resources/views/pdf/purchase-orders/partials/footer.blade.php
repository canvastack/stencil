<div class="footer">
    <div>
        <strong>{{ $po->po_number }}</strong> | 
        Page <span class="page-number"></span> | 
        Generated on {{ now()->format('d F Y H:i') }}
    </div>
    <div style="margin-top: 3px;">
        This is a computer-generated document. No signature is required for validity.
    </div>
    <div style="margin-top: 3px;">
        For inquiries, please contact: {{ config('app.company_email', 'info@custometchingxenial.com') }}
    </div>
</div>
