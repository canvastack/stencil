<?php

namespace App\Domain\Payment\Mails;

use App\Models\PaymentRefund;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\NotificationTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RefundApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public PaymentRefund $refund,
        public ?User $approver = null,
        public string $recipientType = 'customer', // customer, finance, requester
        public ?NotificationTemplate $template = null
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->template?->subject ?? 'Refund Approved - ' . $this->refund->refund_reference;
        
        return new Envelope(
            subject: $this->processTemplateVariables($subject),
        );
    }

    public function content(): Content
    {
        $view = match ($this->recipientType) {
            'customer' => 'mails.refund.approved-customer',
            'finance' => 'mails.refund.approved-finance',
            'requester' => 'mails.refund.approved-requester',
            default => 'mails.refund.approved-customer'
        };

        return new Content(
            view: $view,
            with: [
                'refund' => $this->refund,
                'order' => $this->refund->order,
                'customer' => $this->refund->customer,
                'approver' => $this->approver,
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
            '{{approved_date}}' => now()->format('d M Y, H:i'),
            '{{approver_name}}' => $this->approver?->name ?? 'System',
            '{{processing_time}}' => $this->getProcessingTimeEstimate(),
            '{{tenant_name}}' => $this->refund->tenant?->name ?? 'Our Company',
            '{{support_email}}' => config('mail.support_email', 'support@company.com'),
            '{{admin_panel_url}}' => url('/admin/refunds/' . $this->refund->id),
        ];

        return str_replace(array_keys($variables), array_values($variables), $content);
    }

    private function getProcessingTimeEstimate(): string
    {
        return match ($this->refund->refund_method) {
            'original_method' => '3-5 business days',
            'bank_transfer' => '1-2 business days',
            'cash' => 'Available for pickup immediately',
            'store_credit' => 'Immediately available',
            'manual' => '5-7 business days',
            default => '3-5 business days'
        };
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
            'requester' => $this->getRequesterDefaultContent(),
            default => $this->getCustomerDefaultContent()
        };
    }

    private function getCustomerDefaultContent(): string
    {
        return "
            <p>Dear {{customer_name}},</p>
            
            <p>Great news! Your refund request has been <strong>approved</strong>.</p>
            
            <div style='background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;'>
                <h3>✅ Approved Refund Details:</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Refund Method:</strong> {{refund_method}}</li>
                    <li><strong>Approved by:</strong> {{approver_name}}</li>
                    <li><strong>Approved Date:</strong> {{approved_date}}</li>
                    <li><strong>Expected Processing Time:</strong> {{processing_time}}</li>
                </ul>
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ol>
                <li>Your refund will be processed by our finance team</li>
                <li>You will receive another email confirmation once the refund is completed</li>
                <li>The refund will be issued via {{refund_method}}</li>
            </ol>
            
            <p>We appreciate your patience during this process. If you have any questions, please contact us at {{support_email}}.</p>
            
            <p>Thank you for choosing {{tenant_name}}.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} Team</p>
        ";
    }

    private function getFinanceDefaultContent(): string
    {
        return "
            <p>Hello Finance Team,</p>
            
            <p>A refund request has been approved and is now ready for processing.</p>
            
            <div style='background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;'>
                <h3>💰 Action Required: Process Refund Payment</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Customer:</strong> {{customer_name}}</li>
                    <li><strong>Order:</strong> {{order_number}}</li>
                    <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Method:</strong> {{refund_method}}</li>
                    <li><strong>Approved by:</strong> {{approver_name}}</li>
                    <li><strong>Approved Date:</strong> {{approved_date}}</li>
                </ul>
            </div>
            
            <p><strong>Processing Instructions:</strong></p>
            <ol>
                <li>Verify the refund details in the admin panel</li>
                <li>Process the refund via the specified method</li>
                <li>Update the refund status once completed</li>
                <li>Ensure proper documentation for audit trail</li>
            </ol>
            
            <p><strong>Priority Level:</strong> Standard (SLA: {{processing_time}})</p>
            
            <p><a href='{{admin_panel_url}}' style='background-color: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Process Refund</a></p>
            
            <p>Please process this refund promptly to maintain customer satisfaction.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} System</p>
        ";
    }

    private function getRequesterDefaultContent(): string
    {
        return "
            <p>Hello,</p>
            
            <p>The refund request you submitted has been <strong>approved</strong> by {{approver_name}}.</p>
            
            <div style='background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;'>
                <h3>✅ Refund Request Status Update</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Customer:</strong> {{customer_name}}</li>
                    <li><strong>Order:</strong> {{order_number}}</li>
                    <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Method:</strong> {{refund_method}}</li>
                    <li><strong>Approved Date:</strong> {{approved_date}}</li>
                </ul>
            </div>
            
            <p>The refund is now being processed by our finance team. The customer will be notified once the refund is completed.</p>
            
            <p><a href='{{admin_panel_url}}' style='background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>View Refund Status</a></p>
            
            <p>Thank you for handling this customer request efficiently.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} System</p>
        ";
    }
}