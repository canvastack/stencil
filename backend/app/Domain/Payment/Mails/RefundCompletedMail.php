<?php

namespace App\Domain\Payment\Mails;

use App\Models\PaymentRefund;
use App\Infrastructure\Persistence\Eloquent\Models\NotificationTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RefundCompletedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public PaymentRefund $refund,
        public array $gatewayResponse = [],
        public string $recipientType = 'customer', // customer, finance, admin
        public ?NotificationTemplate $template = null
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->template?->subject ?? 'Refund Completed - ' . $this->refund->refund_reference;
        
        return new Envelope(
            subject: $this->processTemplateVariables($subject),
        );
    }

    public function content(): Content
    {
        $view = match ($this->recipientType) {
            'customer' => 'mails.refund.completed-customer',
            'finance' => 'mails.refund.completed-finance',
            'admin' => 'mails.refund.completed-admin',
            default => 'mails.refund.completed-customer'
        };

        return new Content(
            view: $view,
            with: [
                'refund' => $this->refund,
                'order' => $this->refund->order,
                'customer' => $this->refund->customer,
                'gatewayResponse' => $this->gatewayResponse,
                'template' => $this->template,
                'recipientType' => $this->recipientType,
                'content' => $this->getProcessedContent(),
            ]
        );
    }

    private function processTemplateVariables(string $content): string
    {
        $variables = [
            '{{refund_reference}}' => $this->refund->refund_reference,
            '{{refund_amount}}' => number_format($this->refund->refund_amount, 2),
            '{{refund_method}}' => ucfirst(str_replace('_', ' ', $this->refund->refund_method)),
            '{{order_number}}' => $this->refund->order?->order_number ?? 'N/A',
            '{{customer_name}}' => $this->refund->customer?->name ?? 'Valued Customer',
            '{{completed_date}}' => now()->format('d M Y, H:i'),
            '{{transaction_id}}' => $this->gatewayResponse['transaction_id'] ?? 'N/A',
            '{{gateway_reference}}' => $this->gatewayResponse['gateway_reference'] ?? 'N/A',
            '{{processing_time}}' => $this->calculateProcessingTime(),
            '{{tenant_name}}' => $this->refund->tenant?->name ?? 'Our Company',
            '{{support_email}}' => config('mail.support_email', 'support@company.com'),
            '{{admin_panel_url}}' => url('/admin/refunds/' . $this->refund->id),
        ];

        return str_replace(array_keys($variables), array_values($variables), $content);
    }

    private function calculateProcessingTime(): string
    {
        if (!$this->refund->created_at) {
            return 'N/A';
        }

        $processingDays = $this->refund->created_at->diffInDays(now());
        
        if ($processingDays === 0) {
            return 'Same day';
        } elseif ($processingDays === 1) {
            return '1 day';
        } else {
            return $processingDays . ' days';
        }
    }

    private function getProcessedContent(): string
    {
        if (!$this->template) {
            return $this->getDefaultContent();
        }

        return $this->processTemplateVariables($this->template->content);
    }

    private function getDefaultContent(): string
    {
        return match ($this->recipientType) {
            'customer' => $this->getCustomerDefaultContent(),
            'finance' => $this->getFinanceDefaultContent(),
            'admin' => $this->getAdminDefaultContent(),
            default => $this->getCustomerDefaultContent()
        };
    }

    private function getCustomerDefaultContent(): string
    {
        return "
            <p>Dear {{customer_name}},</p>
            
            <p>Excellent news! Your refund has been successfully processed and completed.</p>
            
            <div style='background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;'>
                <h3>✅ Refund Completed Successfully</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Original Order:</strong> {{order_number}}</li>
                    <li><strong>Refund Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Refund Method:</strong> {{refund_method}}</li>
                    <li><strong>Completed Date:</strong> {{completed_date}}</li>
                    <li><strong>Processing Time:</strong> {{processing_time}}</li>
                    <li><strong>Transaction ID:</strong> {{transaction_id}}</li>
                </ul>
            </div>
            
            " . $this->getRefundMethodSpecificInstructions() . "
            
            <p><strong>Important Notes:</strong></p>
            <ul>
                <li>Please save this email for your records</li>
                <li>If you don't see the refund in the expected timeframe, please contact us</li>
                <li>This completes the refund process for order {{order_number}}</li>
            </ul>
            
            <p>We sincerely apologize for any inconvenience that led to this refund request. We value your business and hope to serve you better in the future.</p>
            
            <p>If you have any questions about this refund, please don't hesitate to contact our support team at {{support_email}}.</p>
            
            <p>Thank you for choosing {{tenant_name}}.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} Team</p>
        ";
    }

    private function getRefundMethodSpecificInstructions(): string
    {
        return match ($this->refund->refund_method) {
            'original_method' => "
                <div style='background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                    <h4>💳 Refund to Original Payment Method</h4>
                    <p style='margin: 0;'>Your refund has been processed back to your original payment method. Depending on your bank or card issuer, it may take 3-5 business days to appear in your account.</p>
                </div>
            ",
            'bank_transfer' => "
                <div style='background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                    <h4>🏦 Bank Transfer Refund</h4>
                    <p style='margin: 0;'>Your refund has been transferred to your bank account. Please check your account within 1-2 business days. The transfer reference is: {{gateway_reference}}</p>
                </div>
            ",
            'cash' => "
                <div style='background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                    <h4>💵 Cash Refund</h4>
                    <p style='margin: 0;'>Your cash refund is ready for pickup at our main office. Please bring a valid ID and this email confirmation. Office hours: Monday-Friday, 9 AM - 5 PM.</p>
                </div>
            ",
            'store_credit' => "
                <div style='background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                    <h4>🎁 Store Credit</h4>
                    <p style='margin: 0;'>Your store credit has been added to your account and is immediately available for use. Credit Code: {{gateway_reference}}. This credit is valid for one year from today.</p>
                </div>
            ",
            default => "
                <div style='background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                    <h4>💰 Refund Processed</h4>
                    <p style='margin: 0;'>Your refund has been processed successfully. Please allow 3-5 business days for the amount to appear in your account.</p>
                </div>
            "
        };
    }

    private function getFinanceDefaultContent(): string
    {
        return "
            <p>Hello Finance Team,</p>
            
            <p>A refund has been successfully completed and processed.</p>
            
            <div style='background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;'>
                <h3>✅ Refund Processing Complete</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Customer:</strong> {{customer_name}}</li>
                    <li><strong>Order:</strong> {{order_number}}</li>
                    <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Method:</strong> {{refund_method}}</li>
                    <li><strong>Completed Date:</strong> {{completed_date}}</li>
                    <li><strong>Transaction ID:</strong> {{transaction_id}}</li>
                    <li><strong>Gateway Reference:</strong> {{gateway_reference}}</li>
                </ul>
            </div>
            
            <div style='background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <h4>📊 Financial Impact:</h4>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Processing Time:</strong> {{processing_time}}</li>
                    <li><strong>Gateway Used:</strong> " . ($this->gatewayResponse['gateway'] ?? 'Unknown') . "</li>
                    <li><strong>Status:</strong> Completed Successfully</li>
                </ul>
            </div>
            
            <p><strong>Action Items Completed:</strong></p>
            <ul>
                <li>✅ Refund processed via gateway</li>
                <li>✅ Customer notification sent</li>
                <li>✅ Financial records updated</li>
                <li>✅ Transaction logged for audit</li>
            </ul>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
                <li>Update accounting records for this refund</li>
                <li>File transaction confirmation for audit trail</li>
                <li>Monitor for any potential chargebacks</li>
                <li>Close the refund case in the system</li>
            </ol>
            
            <p><a href='{{admin_panel_url}}' style='background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>View Complete Transaction</a></p>
            
            <p>This refund case is now closed and completed.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} System</p>
        ";
    }

    private function getAdminDefaultContent(): string
    {
        return "
            <p>Hello Admin,</p>
            
            <p>A refund has been successfully completed in your tenant account.</p>
            
            <div style='background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;'>
                <h3>✅ Refund Successfully Completed</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Customer:</strong> {{customer_name}}</li>
                    <li><strong>Order:</strong> {{order_number}}</li>
                    <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Method:</strong> {{refund_method}}</li>
                    <li><strong>Processing Time:</strong> {{processing_time}}</li>
                    <li><strong>Completed Date:</strong> {{completed_date}}</li>
                </ul>
            </div>
            
            <p><strong>Summary:</strong></p>
            <ul>
                <li>Customer has been successfully refunded</li>
                <li>All team members have been notified</li>
                <li>Financial records have been updated</li>
                <li>Customer satisfaction maintained</li>
            </ul>
            
            <p>This refund request has been handled efficiently by your team, maintaining good customer service standards.</p>
            
            <p><a href='{{admin_panel_url}}' style='background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>View in Admin Panel</a></p>
            
            <p>Thank you for maintaining excellent customer service standards.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} System</p>
        ";
    }
}