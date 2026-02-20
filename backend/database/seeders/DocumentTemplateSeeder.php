<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\Models\DocumentTemplate;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;

class DocumentTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('📄 Seeding Document Templates...');
        
        $tenants = TenantEloquentModel::all();
        
        foreach ($tenants as $tenant) {
            // Check if templates already exist for this tenant
            $existingCount = DocumentTemplate::where('tenant_id', $tenant->id)->count();
            
            if ($existingCount > 0) {
                $this->command->info("   ℹ️  Templates already exist for {$tenant->name}, skipping...");
                continue;
            }
            
            $this->createTemplatesForTenant($tenant);
            $this->command->info("   ✅ Created document templates for {$tenant->name}");
        }
        
        $this->command->info('✅ Document Templates seeded successfully!');
        $this->command->info("   Total: " . DocumentTemplate::count() . " templates created");
    }
    
    /**
     * Create all document templates for a tenant
     */
    private function createTemplatesForTenant($tenant): void
    {
        $templates = [
            [
                'template_name' => 'Default Quotation Template',
                'template_type' => 'quotation',
                'description' => 'Standard quotation template for customer quotes',
                'is_default' => true,
                'body_html' => $this->getQuotationTemplate(),
            ],
            [
                'template_name' => 'Default Proforma Invoice Template',
                'template_type' => 'proforma_invoice',
                'description' => 'Standard proforma invoice template',
                'is_default' => true,
                'body_html' => $this->getProformaInvoiceTemplate(),
            ],
            [
                'template_name' => 'Default Tax Invoice Template',
                'template_type' => 'tax_invoice',
                'description' => 'Standard tax invoice template',
                'is_default' => true,
                'body_html' => $this->getTaxInvoiceTemplate(),
            ],
            [
                'template_name' => 'Default Purchase Order Template',
                'template_type' => 'purchase_order',
                'description' => 'Standard purchase order template',
                'is_default' => true,
                'body_html' => $this->getPurchaseOrderTemplate(),
            ],
            [
                'template_name' => 'Default Delivery Note Template',
                'template_type' => 'delivery_note',
                'description' => 'Standard delivery note template',
                'is_default' => true,
                'body_html' => $this->getDeliveryNoteTemplate(),
            ],
            [
                'template_name' => 'Default Receipt Template',
                'template_type' => 'receipt',
                'description' => 'Standard payment receipt template',
                'is_default' => true,
                'body_html' => $this->getReceiptTemplate(),
            ],
        ];
        
        foreach ($templates as $templateData) {
            DocumentTemplate::create([
                'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'tenant_id' => $tenant->id,
                'template_name' => $templateData['template_name'],
                'template_type' => $templateData['template_type'],
                'description' => $templateData['description'],
                'body_html' => $templateData['body_html'],
                'is_default' => $templateData['is_default'],
                'is_active' => true,
            ]);
        }
    }
    
    /**
     * Get quotation template HTML
     */
    private function getQuotationTemplate(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quotation - {{quote_number}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; }
        .document-title { font-size: 20px; margin-top: 10px; }
        .info-section { margin: 20px 0; }
        .info-label { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total-row { font-weight: bold; }
        .footer { margin-top: 40px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{company_name}}</div>
        <div class="document-title">QUOTATION</div>
    </div>
    
    <div class="info-section">
        <div><span class="info-label">Quote Number:</span> {{quote_number}}</div>
        <div><span class="info-label">Date:</span> {{date}}</div>
        <div><span class="info-label">Valid Until:</span> {{valid_until}}</div>
    </div>
    
    <div class="info-section">
        <div><span class="info-label">Customer:</span> {{customer_name}}</div>
        <div>{{customer_address}}</div>
        <div>{{customer_phone}}</div>
        <div>{{customer_email}}</div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            {{items}}
        </tbody>
        <tfoot>
            <tr><td colspan="4">Subtotal</td><td>{{subtotal}}</td></tr>
            <tr><td colspan="4">Tax ({{tax_rate}}%)</td><td>{{tax_amount}}</td></tr>
            <tr class="total-row"><td colspan="4">Grand Total</td><td>{{grand_total}}</td></tr>
        </tfoot>
    </table>
    
    <div class="info-section">
        <div><span class="info-label">Payment Terms:</span> {{payment_terms}}</div>
        <div><span class="info-label">Delivery Timeline:</span> {{delivery_timeline}}</div>
    </div>
    
    <div class="footer">
        <p>{{terms_and_conditions}}</p>
    </div>
</body>
</html>
HTML;
    }
    
    /**
     * Get proforma invoice template HTML
     */
    private function getProformaInvoiceTemplate(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Proforma Invoice - {{invoice_number}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; }
        .document-title { font-size: 20px; margin-top: 10px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{company_name}}</div>
        <div class="document-title">PROFORMA INVOICE</div>
    </div>
    
    <div><strong>Invoice Number:</strong> {{invoice_number}}</div>
    <div><strong>Date:</strong> {{date}}</div>
    <div><strong>Customer:</strong> {{customer_name}}</div>
    
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            {{items}}
        </tbody>
        <tfoot>
            <tr><td colspan="3">Subtotal</td><td>{{subtotal}}</td></tr>
            <tr><td colspan="3">Tax</td><td>{{tax_amount}}</td></tr>
            <tr class="total-row"><td colspan="3">Total Amount</td><td>{{grand_total}}</td></tr>
        </tfoot>
    </table>
    
    <p><strong>Payment Instructions:</strong> {{payment_instructions}}</p>
</body>
</html>
HTML;
    }
    
    /**
     * Get tax invoice template HTML
     */
    private function getTaxInvoiceTemplate(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Tax Invoice - {{invoice_number}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .company-name { font-size: 24px; font-weight: bold; }
        .document-title { font-size: 20px; margin-top: 10px; }
        .tax-id { font-size: 14px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background-color: #e0e0e0; font-weight: bold; }
        .total-row { font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{company_name}}</div>
        <div class="tax-id">Tax ID: {{company_tax_id}}</div>
        <div class="document-title">TAX INVOICE</div>
    </div>
    
    <div><strong>Invoice Number:</strong> {{invoice_number}}</div>
    <div><strong>Date:</strong> {{date}}</div>
    <div><strong>Customer:</strong> {{customer_name}}</div>
    <div><strong>Customer Tax ID:</strong> {{customer_tax_id}}</div>
    
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            {{items}}
        </tbody>
        <tfoot>
            <tr><td colspan="5">Total Before Tax</td><td>{{subtotal}}</td></tr>
            <tr><td colspan="5">Tax Amount ({{tax_rate}}%)</td><td>{{tax_amount}}</td></tr>
            <tr class="total-row"><td colspan="5">Total Amount Due</td><td>{{grand_total}}</td></tr>
        </tfoot>
    </table>
</body>
</html>
HTML;
    }
    
    /**
     * Get purchase order template HTML
     */
    private function getPurchaseOrderTemplate(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Purchase Order - {{po_number}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; }
        .document-title { font-size: 20px; margin-top: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{company_name}}</div>
        <div class="document-title">PURCHASE ORDER</div>
    </div>
    
    <div><strong>PO Number:</strong> {{po_number}}</div>
    <div><strong>Date:</strong> {{date}}</div>
    <div><strong>Vendor:</strong> {{vendor_name}}</div>
    <div><strong>Delivery Date:</strong> {{delivery_date}}</div>
    
    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            {{items}}
        </tbody>
        <tfoot>
            <tr><td colspan="4">Total Amount</td><td>{{total_amount}}</td></tr>
        </tfoot>
    </table>
    
    <p><strong>Delivery Address:</strong> {{delivery_address}}</p>
    <p><strong>Payment Terms:</strong> {{payment_terms}}</p>
</body>
</html>
HTML;
    }
    
    /**
     * Get delivery note template HTML
     */
    private function getDeliveryNoteTemplate(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Delivery Note - {{delivery_number}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; }
        .document-title { font-size: 20px; margin-top: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .signature-section { margin-top: 60px; }
        .signature-box { display: inline-block; width: 45%; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{company_name}}</div>
        <div class="document-title">DELIVERY NOTE</div>
    </div>
    
    <div><strong>Delivery Number:</strong> {{delivery_number}}</div>
    <div><strong>Date:</strong> {{date}}</div>
    <div><strong>Order Number:</strong> {{order_number}}</div>
    <div><strong>Customer:</strong> {{customer_name}}</div>
    <div><strong>Delivery Address:</strong> {{delivery_address}}</div>
    
    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Quantity</th>
            </tr>
        </thead>
        <tbody>
            {{items}}
        </tbody>
    </table>
    
    <div class="signature-section">
        <div class="signature-box">
            <p>Delivered By:</p>
            <br><br>
            <p>_________________</p>
            <p>{{driver_name}}</p>
        </div>
        <div class="signature-box">
            <p>Received By:</p>
            <br><br>
            <p>_________________</p>
            <p>Name & Signature</p>
        </div>
    </div>
</body>
</html>
HTML;
    }
    
    /**
     * Get receipt template HTML
     */
    private function getReceiptTemplate(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receipt - {{receipt_number}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .company-name { font-size: 24px; font-weight: bold; }
        .document-title { font-size: 20px; margin-top: 10px; }
        .info-row { margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total-row { font-weight: bold; font-size: 16px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{company_name}}</div>
        <div class="document-title">PAYMENT RECEIPT</div>
    </div>
    
    <div class="info-row"><strong>Receipt Number:</strong> {{receipt_number}}</div>
    <div class="info-row"><strong>Date:</strong> {{date}}</div>
    <div class="info-row"><strong>Order Number:</strong> {{order_number}}</div>
    <div class="info-row"><strong>Customer:</strong> {{customer_name}}</div>
    <div class="info-row"><strong>Payment Method:</strong> {{payment_method}}</div>
    
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            {{items}}
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td>Total Amount Paid</td>
                <td>{{total_amount}}</td>
            </tr>
        </tfoot>
    </table>
    
    <div class="footer">
        <p>Thank you for your payment!</p>
        <p>This is a computer-generated receipt and does not require a signature.</p>
    </div>
</body>
</html>
HTML;
    }
}
