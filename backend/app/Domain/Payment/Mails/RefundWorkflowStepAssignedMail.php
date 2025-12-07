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

class RefundWorkflowStepAssignedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public PaymentRefund $refund,
        public RefundApprovalWorkflow $workflow,
        public User $assignedUser,
        public array $stepDetails = [],
        public ?NotificationTemplate $template = null,
        public string $recipientType = 'assignee' // assignee, supervisor
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->template?->subject ?? 'Refund Approval Required - ' . $this->refund->refund_reference;
        
        return new Envelope(
            subject: $this->processTemplateVariables($subject),
        );
    }

    public function content(): Content
    {
        $view = match ($this->recipientType) {
            'assignee' => 'mails.refund.workflow-assigned-assignee',
            'supervisor' => 'mails.refund.workflow-assigned-supervisor',
            default => 'mails.refund.workflow-assigned-assignee'
        };

        return new Content(
            view: $view,
            with: [
                'refund' => $this->refund,
                'workflow' => $this->workflow,
                'order' => $this->refund->order,
                'customer' => $this->refund->customer,
                'assignedUser' => $this->assignedUser,
                'stepDetails' => $this->stepDetails,
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
            '{{assigned_user}}' => $this->assignedUser->name,
            '{{assigned_date}}' => now()->format('d M Y, H:i'),
            '{{step_name}}' => $this->stepDetails['step_name'] ?? 'Review',
            '{{step_description}}' => $this->stepDetails['step_description'] ?? 'Review refund request',
            '{{deadline}}' => $this->stepDetails['deadline'] ?? '2 business days',
            '{{priority}}' => $this->stepDetails['priority'] ?? 'Normal',
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
            'assignee' => $this->getAssigneeDefaultContent(),
            'supervisor' => $this->getSupervisorDefaultContent(),
            default => $this->getAssigneeDefaultContent()
        };
    }

    private function getAssigneeDefaultContent(): string
    {
        return "
            <p>Hello {{assigned_user}},</p>
            
            <p>A refund request has been assigned to you for review and approval.</p>
            
            <div style='background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;'>
                <h3>📋 Task Assignment: {{step_name}}</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Customer:</strong> {{customer_name}}</li>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Order:</strong> {{order_number}}</li>
                    <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Task:</strong> {{step_description}}</li>
                    <li><strong>Priority:</strong> {{priority}}</li>
                    <li><strong>Deadline:</strong> {{deadline}}</li>
                    <li><strong>Assigned Date:</strong> {{assigned_date}}</li>
                </ul>
            </div>
            
            <p><strong>What you need to do:</strong></p>
            <ol>
                <li><strong>Review the refund request details</strong> in the admin panel</li>
                <li><strong>Verify order information</strong> and customer payment history</li>
                <li><strong>Assess the refund reason</strong> and determine validity</li>
                <li><strong>Check company policy</strong> for similar cases</li>
                <li><strong>Make a decision:</strong> Approve, Reject, or Request More Information</li>
                <li><strong>Document your reasoning</strong> in the approval notes</li>
            </ol>
            
            <div style='background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <h4>🔍 Review Criteria:</h4>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li>Is the refund reason valid according to policy?</li>
                    <li>Are there any quality issues documented?</li>
                    <li>What is the customer's history with returns/refunds?</li>
                    <li>Is the refund amount correct?</li>
                    <li>Are all required documents/evidence provided?</li>
                </ul>
            </div>
            
            <div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <h4>⚡ Quick Actions:</h4>
                <p style='margin-bottom: 10px;'>
                    <a href='{{approval_url}}' style='background-color: #28a745; color: white; padding: 8px 16px; text-decoration: none; border-radius: 3px; margin-right: 10px;'>Approve Refund</a>
                    <a href='{{rejection_url}}' style='background-color: #dc3545; color: white; padding: 8px 16px; text-decoration: none; border-radius: 3px; margin-right: 10px;'>Reject Refund</a>
                    <a href='{{admin_panel_url}}' style='background-color: #007bff; color: white; padding: 8px 16px; text-decoration: none; border-radius: 3px;'>Review Details</a>
                </p>
            </div>
            
            <p><strong>Important Notes:</strong></p>
            <ul>
                <li>Please complete this review within the deadline to maintain customer satisfaction</li>
                <li>Contact your supervisor if you need guidance on complex cases</li>
                <li>Document all reasoning thoroughly for audit purposes</li>
                <li>Escalate immediately if you suspect fraudulent activity</li>
            </ul>
            
            <p>Thank you for your prompt attention to this matter.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} System</p>
        ";
    }

    private function getSupervisorDefaultContent(): string
    {
        return "
            <p>Hello Supervisor,</p>
            
            <p>A refund approval task has been assigned to your team member: <strong>{{assigned_user}}</strong>.</p>
            
            <div style='background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8;'>
                <h3>👥 Team Assignment Notification</h3>
                <ul style='margin: 0; padding-left: 20px;'>
                    <li><strong>Assigned To:</strong> {{assigned_user}}</li>
                    <li><strong>Task:</strong> {{step_name}}</li>
                    <li><strong>Customer:</strong> {{customer_name}}</li>
                    <li><strong>Refund Reference:</strong> {{refund_reference}}</li>
                    <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                    <li><strong>Priority:</strong> {{priority}}</li>
                    <li><strong>Deadline:</strong> {{deadline}}</li>
                    <li><strong>Assigned Date:</strong> {{assigned_date}}</li>
                </ul>
            </div>
            
            <p><strong>Supervisory Oversight:</strong></p>
            <ul>
                <li>Monitor progress to ensure completion within deadline</li>
                <li>Be available for guidance if team member has questions</li>
                <li>Review decision if this is a high-value refund</li>
                <li>Escalate to you if case becomes complex</li>
            </ul>
            
            <p><strong>When to Intervene:</strong></p>
            <ol>
                <li>If deadline is approaching without action</li>
                <li>If team member requests guidance</li>
                <li>If refund amount exceeds normal thresholds</li>
                <li>If customer escalates during review period</li>
            </ol>
            
            <p><a href='{{admin_panel_url}}' style='background-color: #17a2b8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Monitor Progress</a></p>
            
            <p>This is for your awareness and oversight. No immediate action required unless escalated.</p>
            
            <p>Best regards,<br>
            {{tenant_name}} System</p>
        ";
    }
}