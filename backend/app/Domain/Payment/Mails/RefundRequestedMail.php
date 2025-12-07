<?php

namespace App\Domain\Payment\Mails;

use App\Models\PaymentRefund;
use App\Infrastructure\Persistence\Eloquent\Models\NotificationTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RefundRequestedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public PaymentRefund $refund,
        public string $recipientType = 'customer', // customer, internal, admin
        public ?NotificationTemplate $template = null
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->template?->subject ?? 'Refund Request Submitted - ' . $this->refund->refund_reference;
        
        return new Envelope(
            subject: $this->processTemplateVariables($subject),
        );
    }

    public function content(): Content
    {
        $view = match ($this->recipientType) {
            'customer' => 'mails.refund.requested-customer',
            'internal' => 'mails.refund.requested-internal',
            'admin' => 'mails.refund.requested-admin',
            default => 'mails.refund.requested-customer'
        };

        return new Content(
            view: $view,
            with: [
                'refund' => $this->refund,
                'order' => $this->refund->order,
                'customer' => $this->refund->customer,
                'template' => $this->template,
                'recipientType' => $this->recipientType,
                'content' => $this->getProcessedContent(),
            ]
        );
    }

    /**
     * Get processed email content with variables replaced
     */
    private function getProcessedContent(): string
    {
        if (!$this->template) {
            return $this->getDefaultContent();
        }

        return $this->processTemplateVariables($this->template->content);
    }

    /**
     * Process template variables
     */
    private function processTemplateVariables(string $content): string
    {
        $variables = [
            '{{refund_reference}}' => $this->refund->refund_reference,
            '{{refund_amount}}' => number_format($this->refund->refund_amount, 2),
            '{{refund_reason}}' => $this->refund->reason,
            '{{order_number}}' => $this->refund->order?->order_number ?? 'N/A',
            '{{customer_name}}' => $this->refund->customer?->name ?? 'Valued Customer',
            '{{requested_date}}' => $this->refund->created_at->format('d M Y, H:i'),
            '{{status}}' => ucfirst(str_replace('_', ' ', $this->refund->status->value)),
            '{{tenant_name}}' => $this->refund->tenant?->name ?? 'Our Company',
            '{{support_email}}' => config('mail.support_email', 'support@company.com'),
            '{{admin_panel_url}}' => url('/admin/refunds/' . $this->refund->id),
        ];

        return str_replace(array_keys($variables), array_values($variables), $content);
    }

    /**
     * Get default content based on recipient type
     */
    private function getDefaultContent(): string
    {
        return match ($this->recipientType) {
            'customer' => $this->getCustomerDefaultContent(),
            'internal' => $this->getInternalDefaultContent(),
            'admin' => $this->getAdminDefaultContent(),
            default => $this->getCustomerDefaultContent()
        };
    }

    private function getCustomerDefaultContent(): string
    {
        return "
            <p>Dear {{customer_name}},</p>
            
            <p>We have received your refund request for order <strong>{{order_number}}</strong>.</p>
            
            <div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <h3>Refund Details:</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Reason:</strong> {{refund_reason}}</li>
                    <li><strong>Status:</strong> {{status}}</li>
                    <li><strong>Date Requested:</strong> {{requested_date}}</li>
                </ul>
            </div>
            
            <p>Your refund request is now being processed by our team. We will review your request and get back to you within 1-2 business days.</p>
            
            <p>If you have any questions about your refund, please contact our support team at {{support_email}}.</p>
            
            <p>Thank you for your patience.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} Team</p>
        ";
    }

    private function getInternalDefaultContent(): string
    {
        return "
            <p>Hello Team,</p>
            
            <p>A new refund request has been submitted and requires review.</p>
            
            <div style='background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;'>
                <h3>🔍 Action Required: Refund Review</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Customer:</strong> {{customer_name}}</li>
                    <li><strong>Order:</strong> {{order_number}}</li>
                    <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Reason:</strong> {{refund_reason}}</li>
                    <li><strong>Date Requested:</strong> {{requested_date}}</li>
                </ul>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
                <li>Review the refund request details</li>
                <li>Verify order information and payment history</li>
                <li>Assess the refund reason and validity</li>
                <li>Process approval or rejection through admin panel</li>
            </ol>
            
            <p><a href='{{admin_panel_url}}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Review Refund Request</a></p>
            
            <p>Please process this request promptly to maintain customer satisfaction.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} System</p>
        ";
    }

    private function getAdminDefaultContent(): string
    {
        return "
            <p>Hello Admin,</p>
            
            <p>A new refund request has been submitted to your tenant account.</p>
            
            <div style='background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;'>
                <h3>📊 Refund Request Summary</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Customer:</strong> {{customer_name}}</li>
                    <li><strong>Order:</strong> {{order_number}}</li>
                    <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Reason:</strong> {{refund_reason}}</li>
                    <li><strong>Status:</strong> {{status}}</li>
                    <li><strong>Date Requested:</strong> {{requested_date}}</li>
                </ul>
            </div>
            
            <p>This refund request has been automatically routed to your CS team for initial review. You can monitor the progress and intervene if necessary.</p>
            
            <p><a href='{{admin_panel_url}}' style='background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>View in Admin Panel</a></p>
            
            <p>Best regards,<br>
            {{tenant_name}} System</p>
        ";
    }
}