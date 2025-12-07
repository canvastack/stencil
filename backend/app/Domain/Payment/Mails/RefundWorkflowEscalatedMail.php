<?php

namespace App\Domain\Payment\Mails;

use App\Models\PaymentRefund;
use App\Models\RefundApprovalWorkflow;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\NotificationTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RefundWorkflowEscalatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public PaymentRefund $refund,
        public RefundApprovalWorkflow $workflow,
        public User $escalatedToUser,
        public ?User $originalAssignee = null,
        public string $escalationReason = '',
        public ?NotificationTemplate $template = null,
        public string $recipientType = 'escalated_to' // escalated_to, original_assignee, admin
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->template?->subject ?? 'ESCALATED: Refund Approval Required - ' . $this->refund->refund_reference;
        
        return new Envelope(
            subject: $this->processTemplateVariables($subject),
        );
    }

    public function content(): Content
    {
        $view = match ($this->recipientType) {
            'escalated_to' => 'mails.refund.escalated-to',
            'original_assignee' => 'mails.refund.escalated-original',
            'admin' => 'mails.refund.escalated-admin',
            default => 'mails.refund.escalated-to'
        };

        return new Content(
            view: $view,
            with: [
                'refund' => $this->refund,
                'workflow' => $this->workflow,
                'order' => $this->refund->order,
                'customer' => $this->refund->customer,
                'escalatedToUser' => $this->escalatedToUser,
                'originalAssignee' => $this->originalAssignee,
                'escalationReason' => $this->escalationReason,
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
            '{{customer_name}}' => $this->refund->customer?->name ?? 'Unknown Customer',
            '{{escalated_to}}' => $this->escalatedToUser->name,
            '{{original_assignee}}' => $this->originalAssignee?->name ?? 'Unknown',
            '{{escalation_reason}}' => $this->escalationReason,
            '{{escalated_date}}' => now()->format('d M Y, H:i'),
            '{{priority}}' => 'HIGH',
            '{{new_deadline}}' => now()->addHours(4)->format('d M Y, H:i'),
            '{{workflow_id}}' => $this->workflow->id,
            '{{tenant_name}}' => $this->refund->tenant?->name ?? 'Our Company',
            '{{admin_panel_url}}' => url('/admin/refunds/' . $this->refund->id),
            '{{approval_url}}' => url('/admin/refunds/' . $this->refund->id . '/approve'),
            '{{rejection_url}}' => url('/admin/refunds/' . $this->refund->id . '/reject'),
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
            'escalated_to' => $this->getEscalatedToDefaultContent(),
            'original_assignee' => $this->getOriginalAssigneeDefaultContent(),
            'admin' => $this->getAdminDefaultContent(),
            default => $this->getEscalatedToDefaultContent()
        };
    }

    private function getEscalatedToDefaultContent(): string
    {
        return "
            <p>Hello {{escalated_to}},</p>
            
            <p><strong style='color: #dc3545;'>URGENT ESCALATION:</strong> A refund approval has been escalated to you and requires immediate attention.</p>
            
            <div style='background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;'>
                <h3>🚨 ESCALATED REFUND APPROVAL</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Customer:</strong> {{customer_name}}</li>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Order:</strong> {{order_number}}</li>
                    <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Originally Assigned To:</strong> {{original_assignee}}</li>
                    <li><strong>Escalated Date:</strong> {{escalated_date}}</li>
                    <li><strong>Priority:</strong> HIGH</li>
                    <li><strong>New Deadline:</strong> {{new_deadline}}</li>
                </ul>
            </div>
            
            <div style='background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <h4>📋 Escalation Reason:</h4>
                <p style='margin: 0;'>{{escalation_reason}}</p>
            </div>
            
            <p><strong>Why This Was Escalated:</strong></p>
            <ul>
                <li>Case complexity requires senior approval authority</li>
                <li>Amount exceeds standard approval limits</li>
                <li>Deadline was missed requiring expedited review</li>
                <li>Customer has escalated their complaint</li>
                <li>Policy exception or special circumstances involved</li>
            </ul>
            
            <p><strong>IMMEDIATE ACTION REQUIRED:</strong></p>
            <ol>
                <li><strong style='color: #dc3545;'>Review case details within 1 hour</strong></li>
                <li>Assess the escalation reason and context</li>
                <li>Make approval/rejection decision</li>
                <li>Document reasoning thoroughly</li>
                <li>Notify relevant teams of decision</li>
                <li>Provide feedback to original assignee if applicable</li>
            </ol>
            
            <div style='background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <h4>🔍 Senior Review Criteria:</h4>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li>Business impact and customer relationship value</li>
                    <li>Precedent setting implications</li>
                    <li>Policy interpretation and exceptions</li>
                    <li>Risk assessment (financial and reputational)</li>
                    <li>Team training and development opportunities</li>
                </ul>
            </div>
            
            <div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <h4>⚡ Priority Actions:</h4>
                <p style='margin-bottom: 10px;'>
                    <a href='{{admin_panel_url}}' style='background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;'>REVIEW NOW</a>
                    <a href='{{approval_url}}' style='background-color: #28a745; color: white; padding: 8px 16px; text-decoration: none; border-radius: 3px; margin-right: 10px;'>Approve</a>
                    <a href='{{rejection_url}}' style='background-color: #6c757d; color: white; padding: 8px 16px; text-decoration: none; border-radius: 3px;'>Reject</a>
                </p>
            </div>
            
            <p><strong style='color: #dc3545;'>SLA:</strong> This escalated case must be resolved within 4 hours to maintain customer satisfaction.</p>
            
            <p>Your prompt attention is critical to maintaining our service standards.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} System</p>
        ";
    }

    private function getOriginalAssigneeDefaultContent(): string
    {
        return "
            <p>Hello {{original_assignee}},</p>
            
            <p>The refund case that was assigned to you has been escalated to {{escalated_to}} for senior review.</p>
            
            <div style='background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;'>
                <h3>📈 Case Escalation Notification</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Customer:</strong> {{customer_name}}</li>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Escalated To:</strong> {{escalated_to}}</li>
                    <li><strong>Escalated Date:</strong> {{escalated_date}}</li>
                    <li><strong>Reason:</strong> {{escalation_reason}}</li>
                </ul>
            </div>
            
            <p><strong>Why This Was Escalated:</strong></p>
            <p>{{escalation_reason}}</p>
            
            <p><strong>What This Means:</strong></p>
            <ul>
                <li>You are no longer responsible for this case</li>
                <li>{{escalated_to}} will make the final decision</li>
                <li>This is a normal part of our approval process</li>
                <li>No negative reflection on your performance</li>
            </ul>
            
            <p><strong>Learning Opportunity:</strong></p>
            <ul>
                <li>Review the final decision when it's made</li>
                <li>Understand the reasoning for future similar cases</li>
                <li>Discuss with {{escalated_to}} if you have questions</li>
                <li>Use this experience for professional development</li>
            </ul>
            
            <p><strong>Next Steps for You:</strong></p>
            <ol>
                <li>No further action required on this case</li>
                <li>Continue with other assigned tasks</li>
                <li>Be available if {{escalated_to}} needs clarification</li>
                <li>Review the outcome for learning purposes</li>
            </ol>
            
            <p><a href='{{admin_panel_url}}' style='background-color: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Monitor Resolution</a></p>
            
            <p>Thank you for your work on this case. Escalation is a normal part of our quality assurance process.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} System</p>
        ";
    }

    private function getAdminDefaultContent(): string
    {
        return "
            <p>Hello Admin,</p>
            
            <p><strong style='color: #dc3545;'>ESCALATION ALERT:</strong> A refund approval has been escalated in your tenant account.</p>
            
            <div style='background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;'>
                <h3>📊 Escalation Summary</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Customer:</strong> {{customer_name}}</li>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>From:</strong> {{original_assignee}}</li>
                    <li><strong>To:</strong> {{escalated_to}}</li>
                    <li><strong>Escalation Reason:</strong> {{escalation_reason}}</li>
                    <li><strong>Date:</strong> {{escalated_date}}</li>
                </ul>
            </div>
            
            <p><strong>Escalation Analysis:</strong></p>
            <ul>
                <li><strong>Process Health:</strong> Escalations indicate proper workflow governance</li>
                <li><strong>Team Performance:</strong> Monitor for training opportunities</li>
                <li><strong>Customer Impact:</strong> High-priority case requiring senior attention</li>
                <li><strong>Business Risk:</strong> Potential reputation or financial impact</li>
            </ul>
            
            <p><strong>Management Oversight:</strong></p>
            <ol>
                <li>Monitor resolution time and quality</li>
                <li>Review team performance patterns</li>
                <li>Assess need for policy clarification</li>
                <li>Consider customer relationship impact</li>
            </ol>
            
            <p><strong>Key Metrics to Watch:</strong></p>
            <ul>
                <li>Time to resolution from escalation</li>
                <li>Customer satisfaction with outcome</li>
                <li>Team learning and development</li>
                <li>Process improvement opportunities</li>
            </ul>
            
            <p><a href='{{admin_panel_url}}' style='background-color: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Monitor Case Progress</a></p>
            
            <p>This escalation is being handled by your senior team. Consider reviewing the outcome for process improvement opportunities.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} System</p>
        ";
    }
}