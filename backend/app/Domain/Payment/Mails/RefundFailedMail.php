<?php

namespace App\Domain\Payment\Mails;

use App\Models\PaymentRefund;
use App\Infrastructure\Persistence\Eloquent\Models\NotificationTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RefundFailedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public PaymentRefund $refund,
        public string $failureReason = '',
        public array $gatewayResponse = [],
        public string $recipientType = 'finance', // finance, cs_team, admin
        public ?NotificationTemplate $template = null
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->template?->subject ?? 'URGENT: Refund Processing Failed - ' . $this->refund->refund_reference;
        
        return new Envelope(
            subject: $this->processTemplateVariables($subject),
        );
    }

    public function content(): Content
    {
        $view = match ($this->recipientType) {
            'finance' => 'mails.refund.failed-finance',
            'cs_team' => 'mails.refund.failed-cs-team',
            'admin' => 'mails.refund.failed-admin',
            default => 'mails.refund.failed-finance'
        };

        return new Content(
            view: $view,
            with: [
                'refund' => $this->refund,
                'order' => $this->refund->order,
                'customer' => $this->refund->customer,
                'failureReason' => $this->failureReason,
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
            '{{customer_name}}' => $this->refund->customer?->name ?? 'Unknown Customer',
            '{{failed_date}}' => now()->format('d M Y, H:i'),
            '{{failure_reason}}' => $this->failureReason,
            '{{error_code}}' => $this->gatewayResponse['error_code'] ?? 'UNKNOWN_ERROR',
            '{{gateway}}' => $this->gatewayResponse['gateway'] ?? 'Unknown',
            '{{tenant_name}}' => $this->refund->tenant?->name ?? 'Our Company',
            '{{support_email}}' => config('mail.support_email', 'support@company.com'),
            '{{admin_panel_url}}' => url('/admin/refunds/' . $this->refund->id),
            '{{retry_url}}' => url('/admin/refunds/' . $this->refund->id . '/retry'),
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
            'finance' => $this->getFinanceDefaultContent(),
            'cs_team' => $this->getCsTeamDefaultContent(),
            'admin' => $this->getAdminDefaultContent(),
            default => $this->getFinanceDefaultContent()
        };
    }

    private function getFinanceDefaultContent(): string
    {
        return "
            <p>Hello Finance Team,</p>
            
            <p><strong style='color: #dc3545;'>URGENT:</strong> A refund processing attempt has failed and requires immediate attention.</p>
            
            <div style='background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;'>
                <h3>🚨 REFUND PROCESSING FAILURE</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Customer:</strong> {{customer_name}}</li>
                    <li><strong>Order:</strong> {{order_number}}</li>
                    <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Method:</strong> {{refund_method}}</li>
                    <li><strong>Gateway:</strong> {{gateway}}</li>
                    <li><strong>Failed Date:</strong> {{failed_date}}</li>
                </ul>
            </div>
            
            <div style='background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <h4>❌ Error Details:</h4>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Error Code:</strong> {{error_code}}</li>
                    <li><strong>Reason:</strong> {{failure_reason}}</li>
                    <li><strong>Gateway Response:</strong> " . json_encode($this->gatewayResponse, JSON_PRETTY_PRINT) . "</li>
                </ul>
            </div>
            
            <p><strong>IMMEDIATE ACTION REQUIRED:</strong></p>
            <ol>
                <li><strong style='color: #dc3545;'>Investigate the failure cause immediately</strong></li>
                <li>Check gateway connection and configuration</li>
                <li>Verify customer's payment method/bank details</li>
                <li>Determine if this requires manual processing</li>
                <li>Update customer on the delay via CS team</li>
                <li>Process refund manually if gateway issue persists</li>
            </ol>
            
            <div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <h4>🛠️ Quick Actions:</h4>
                <p style='margin-bottom: 10px;'>
                    <a href='{{retry_url}}' style='background-color: #ffc107; color: black; padding: 8px 16px; text-decoration: none; border-radius: 3px; margin-right: 10px;'>Retry Processing</a>
                    <a href='{{admin_panel_url}}' style='background-color: #dc3545; color: white; padding: 8px 16px; text-decoration: none; border-radius: 3px;'>View Full Details</a>
                </p>
            </div>
            
            <p><strong style='color: #dc3545;'>Priority:</strong> HIGH - Customer satisfaction at risk</p>
            <p><strong>SLA:</strong> Resolve within 2 hours or escalate to manager</p>
            
            <p>Please handle this matter with utmost priority to maintain customer trust.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} System</p>
        ";
    }

    private function getCsTeamDefaultContent(): string
    {
        return "
            <p>Hello CS Team,</p>
            
            <p><strong style='color: #dc3545;'>ALERT:</strong> A customer refund has failed processing and may result in customer inquiries.</p>
            
            <div style='background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;'>
                <h3>⚠️ Customer Service Alert: Refund Processing Failure</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Customer:</strong> {{customer_name}}</li>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Order:</strong> {{order_number}}</li>
                    <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Failed Date:</strong> {{failed_date}}</li>
                    <li><strong>Failure Reason:</strong> {{failure_reason}}</li>
                </ul>
            </div>
            
            <p><strong>Customer Impact:</strong></p>
            <ul>
                <li>Customer was expecting refund to be processed</li>
                <li>Customer has NOT been automatically notified of the failure</li>
                <li>Customer may contact support asking about refund status</li>
                <li>This could impact customer satisfaction if not handled properly</li>
            </ul>
            
            <p><strong>If Customer Contacts You:</strong></p>
            <ol>
                <li><strong>Acknowledge the delay:</strong> \"I sincerely apologize for the delay in your refund processing.\"</li>
                <li><strong>Explain the situation:</strong> \"We experienced a technical issue with our payment system.\"</li>
                <li><strong>Provide assurance:</strong> \"Our finance team is actively working to resolve this.\"</li>
                <li><strong>Set expectations:</strong> \"We expect to complete your refund within 24-48 hours.\"</li>
                <li><strong>Offer alternatives:</strong> \"Would you prefer store credit for immediate use?\"</li>
                <li><strong>Escalate if needed:</strong> Contact supervisor for additional compensation if customer is upset</li>
            </ol>
            
            <div style='background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <h4>📞 Script for Customer Calls:</h4>
                <p style='margin: 0; font-style: italic;'>\"Hello [Customer Name], thank you for contacting us. I see you're calling about your refund for order {{order_number}}. I sincerely apologize - we've experienced a technical delay with our payment processor. I've escalated this to our finance team with high priority, and I expect your refund of Rp {{refund_amount}} to be completed within 24 hours. I'll personally monitor this and email you as soon as it's processed. Is there anything else I can help you with today?\"</p>
            </div>
            
            <p><a href='{{admin_panel_url}}' style='background-color: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>View Case Details</a></p>
            
            <p><strong>Note:</strong> Finance team has been notified and is working on resolution.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} System</p>
        ";
    }

    private function getAdminDefaultContent(): string
    {
        return "
            <p>Hello Admin,</p>
            
            <p><strong style='color: #dc3545;'>URGENT ISSUE:</strong> A refund processing failure has occurred in your tenant account that requires immediate attention.</p>
            
            <div style='background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;'>
                <h3>🚨 System Alert: Refund Processing Failure</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Customer:</strong> {{customer_name}}</li>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Order:</strong> {{order_number}}</li>
                    <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Gateway:</strong> {{gateway}}</li>
                    <li><strong>Error:</strong> {{error_code}} - {{failure_reason}}</li>
                    <li><strong>Failed Date:</strong> {{failed_date}}</li>
                </ul>
            </div>
            
            <p><strong>Business Impact Assessment:</strong></p>
            <ul>
                <li><strong style='color: #dc3545;'>Customer Satisfaction Risk:</strong> HIGH</li>
                <li><strong>Financial Impact:</strong> Potential chargeback risk if unresolved</li>
                <li><strong>Reputation Risk:</strong> Customer may share negative experience</li>
                <li><strong>Operational Impact:</strong> Requires manual intervention</li>
            </ul>
            
            <p><strong>Teams Involved:</strong></p>
            <ul>
                <li>✅ Finance Team - Notified (Primary Resolution)</li>
                <li>✅ CS Team - Notified (Customer Communication)</li>
                <li>✅ Admin - Notified (Oversight & Escalation)</li>
            </ul>
            
            <p><strong>Escalation Path:</strong></p>
            <ol>
                <li><strong>0-2 hours:</strong> Finance team investigates and attempts resolution</li>
                <li><strong>2-4 hours:</strong> If unresolved, escalate to payment gateway support</li>
                <li><strong>4-8 hours:</strong> Consider manual bank transfer processing</li>
                <li><strong>8+ hours:</strong> Admin intervention for customer compensation</li>
            </ol>
            
            <div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <h4>📊 Recommended Actions:</h4>
                <ol style='margin: 0; padding-left: 20px;'>
                    <li>Monitor resolution progress via admin panel</li>
                    <li>Prepare customer compensation if delay exceeds SLA</li>
                    <li>Review payment gateway configuration</li>
                    <li>Consider backup payment method for future</li>
                </ol>
            </div>
            
            <p><a href='{{admin_panel_url}}' style='background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Monitor Resolution</a></p>
            
            <p>Your immediate attention may be required if this issue persists beyond 2 hours.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} System</p>
        ";
    }
}