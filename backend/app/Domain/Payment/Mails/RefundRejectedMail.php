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

class RefundRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public PaymentRefund $refund,
        public ?User $rejector = null,
        public string $rejectionReason = '',
        public string $recipientType = 'customer', // customer, requester, cs_team
        public ?NotificationTemplate $template = null
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->template?->subject ?? 'Refund Request Update - ' . $this->refund->refund_reference;
        
        return new Envelope(
            subject: $this->processTemplateVariables($subject),
        );
    }

    public function content(): Content
    {
        $view = match ($this->recipientType) {
            'customer' => 'mails.refund.rejected-customer',
            'requester' => 'mails.refund.rejected-requester',
            'cs_team' => 'mails.refund.rejected-cs-team',
            default => 'mails.refund.rejected-customer'
        };

        return new Content(
            view: $view,
            with: [
                'refund' => $this->refund,
                'order' => $this->refund->order,
                'customer' => $this->refund->customer,
                'rejector' => $this->rejector,
                'rejectionReason' => $this->rejectionReason,
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
            '{{order_number}}' => $this->refund->order?->order_number ?? 'N/A',
            '{{customer_name}}' => $this->refund->customer?->name ?? 'Valued Customer',
            '{{rejected_date}}' => now()->format('d M Y, H:i'),
            '{{rejector_name}}' => $this->rejector?->name ?? 'System',
            '{{rejection_reason}}' => $this->rejectionReason,
            '{{tenant_name}}' => $this->refund->tenant?->name ?? 'Our Company',
            '{{support_email}}' => config('mail.support_email', 'support@company.com'),
            '{{admin_panel_url}}' => url('/admin/refunds/' . $this->refund->id),
            '{{appeal_form_url}}' => url('/appeal-refund/' . $this->refund->refund_reference),
        ];

        return str_replace(array_keys($variables), array_values($variables), $content);
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
            'requester' => $this->getRequesterDefaultContent(),
            'cs_team' => $this->getCsTeamDefaultContent(),
            default => $this->getCustomerDefaultContent()
        };
    }

    private function getCustomerDefaultContent(): string
    {
        return "
            <p>Dear {{customer_name}},</p>
            
            <p>Thank you for your refund request regarding order {{order_number}}. After careful review, we regret to inform you that your refund request cannot be approved at this time.</p>
            
            <div style='background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;'>
                <h3>❌ Refund Request Status</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Amount Requested:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Decision Date:</strong> {{rejected_date}}</li>
                    <li><strong>Reviewed by:</strong> {{rejector_name}}</li>
                    <li><strong>Status:</strong> Not Approved</li>
                </ul>
            </div>
            
            <div style='background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <h4>📋 Reason for Decision:</h4>
                <p style='margin: 0;'>{{rejection_reason}}</p>
            </div>
            
            <p><strong>What you can do next:</strong></p>
            <ul>
                <li>If you believe this decision was made in error, you can <a href='{{appeal_form_url}}' style='color: #007bff;'>submit an appeal</a> with additional supporting information</li>
                <li>Contact our customer support team at {{support_email}} to discuss alternative solutions</li>
                <li>Review our refund policy for more information about eligible refund scenarios</li>
            </ul>
            
            <p>We understand this may not be the outcome you were hoping for, and we sincerely apologize for any inconvenience. We value your business and would be happy to explore other ways to address your concerns.</p>
            
            <p>If you have any questions about this decision, please don't hesitate to contact our support team.</p>
            
            <p>Thank you for your understanding.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} Team</p>
        ";
    }

    private function getRequesterDefaultContent(): string
    {
        return "
            <p>Hello,</p>
            
            <p>The refund request you submitted has been reviewed and unfortunately was not approved.</p>
            
            <div style='background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;'>
                <h3>❌ Refund Request Decision</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Customer:</strong> {{customer_name}}</li>
                    <li><strong>Order:</strong> {{order_number}}</li>
                    <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Decision Date:</strong> {{rejected_date}}</li>
                    <li><strong>Reviewed by:</strong> {{rejector_name}}</li>
                </ul>
            </div>
            
            <div style='background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <h4>📋 Rejection Reason:</h4>
                <p style='margin: 0;'>{{rejection_reason}}</p>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
                <li>Customer has been notified of the decision via email</li>
                <li>If customer appeals, the case will be escalated for secondary review</li>
                <li>Document this decision in the customer's history for future reference</li>
                <li>Be prepared to handle any customer inquiries regarding this decision</li>
            </ol>
            
            <p><a href='{{admin_panel_url}}' style='background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>View Full Case Details</a></p>
            
            <p>Thank you for handling this request thoroughly.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} System</p>
        ";
    }

    private function getCsTeamDefaultContent(): string
    {
        return "
            <p>Hello CS Team,</p>
            
            <p>A refund request has been rejected and may require follow-up customer service.</p>
            
            <div style='background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;'>
                <h3>⚠️ Customer Service Alert: Rejected Refund</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Customer:</strong> {{customer_name}}</li>
                    <li><strong>Order:</strong> {{order_number}}</li>
                    <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Rejected by:</strong> {{rejector_name}}</li>
                    <li><strong>Decision Date:</strong> {{rejected_date}}</li>
                    <li><strong>Rejection Reason:</strong> {{rejection_reason}}</li>
                </ul>
            </div>
            
            <p><strong>Important Notes:</strong></p>
            <ul>
                <li>Customer has been notified of the decision</li>
                <li>Customer may contact support for clarification or appeal</li>
                <li>Be prepared to explain the decision and company policy</li>
                <li>Escalate to supervisor if customer disputes the decision</li>
            </ul>
            
            <p><strong>Talking Points for Customer Contact:</strong></p>
            <ol>
                <li>Express understanding and empathy for their situation</li>
                <li>Clearly explain the reason for rejection</li>
                <li>Offer alternative solutions where possible</li>
                <li>Guide them through the appeal process if applicable</li>
            </ol>
            
            <p><a href='{{admin_panel_url}}' style='background-color: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>View Case Details</a></p>
            
            <p>Please be prepared for potential customer inquiries regarding this decision.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} System</p>
        ";
    }
}