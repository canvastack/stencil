<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\Models\NotificationTemplate;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;

class RefundNotificationTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = TenantEloquentModel::all();

        foreach ($tenants as $tenant) {
            $this->createRefundTemplates($tenant->id);
        }
    }

    private function createRefundTemplates(int $tenantId): void
    {
        $templates = [
            [
                'name' => 'Refund Request Submitted',
                'slug' => 'refund-requested',
                'type' => 'email',
                'event' => 'refund.requested',
                'subject' => 'Refund Request Submitted - {{refund_reference}}',
                'content' => $this->getRefundRequestedTemplate(),
                'variables' => [
                    'refund_reference', 'refund_amount', 'order_number', 
                    'customer_name', 'requested_date', 'status', 'tenant_name', 
                    'support_email', 'admin_panel_url'
                ],
                'is_system' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Refund Approved',
                'slug' => 'refund-approved',
                'type' => 'email',
                'event' => 'refund.approved',
                'subject' => 'Good News! Your Refund Has Been Approved - {{refund_reference}}',
                'content' => $this->getRefundApprovedTemplate(),
                'variables' => [
                    'refund_reference', 'refund_amount', 'refund_method',
                    'order_number', 'customer_name', 'approved_date', 
                    'approver_name', 'processing_time', 'tenant_name',
                    'support_email', 'admin_panel_url'
                ],
                'is_system' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Refund Rejected',
                'slug' => 'refund-rejected',
                'type' => 'email',
                'event' => 'refund.rejected',
                'subject' => 'Refund Request Update - {{refund_reference}}',
                'content' => $this->getRefundRejectedTemplate(),
                'variables' => [
                    'refund_reference', 'refund_amount', 'order_number',
                    'customer_name', 'rejected_date', 'rejector_name',
                    'rejection_reason', 'tenant_name', 'support_email',
                    'appeal_form_url'
                ],
                'is_system' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Refund Completed',
                'slug' => 'refund-completed',
                'type' => 'email',
                'event' => 'refund.completed',
                'subject' => 'Refund Completed Successfully - {{refund_reference}}',
                'content' => $this->getRefundCompletedTemplate(),
                'variables' => [
                    'refund_reference', 'refund_amount', 'refund_method',
                    'order_number', 'customer_name', 'completed_date',
                    'transaction_id', 'processing_time', 'tenant_name',
                    'support_email'
                ],
                'is_system' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Refund Workflow Assignment',
                'slug' => 'refund-workflow-assigned',
                'type' => 'email',
                'event' => 'refund.workflow.assigned',
                'subject' => 'Refund Approval Required - {{refund_reference}}',
                'content' => $this->getWorkflowAssignedTemplate(),
                'variables' => [
                    'refund_reference', 'refund_amount', 'order_number',
                    'customer_name', 'assigned_user', 'assigned_date',
                    'step_name', 'deadline', 'priority', 'tenant_name',
                    'admin_panel_url', 'approval_url', 'rejection_url'
                ],
                'is_system' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Refund Workflow Escalation',
                'slug' => 'refund-workflow-escalated',
                'type' => 'email',
                'event' => 'refund.workflow.escalated',
                'subject' => 'ESCALATED: Refund Approval Required - {{refund_reference}}',
                'content' => $this->getWorkflowEscalatedTemplate(),
                'variables' => [
                    'refund_reference', 'refund_amount', 'order_number',
                    'customer_name', 'escalated_to', 'original_assignee',
                    'escalation_reason', 'escalated_date', 'new_deadline',
                    'tenant_name', 'admin_panel_url'
                ],
                'is_system' => true,
                'is_active' => true,
            ],
        ];

        foreach ($templates as $templateData) {
            NotificationTemplate::updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'slug' => $templateData['slug']
                ],
                array_merge($templateData, ['tenant_id' => $tenantId])
            );
        }
    }

    private function getRefundRequestedTemplate(): string
    {
        return "
        <h2>Refund Request Confirmation</h2>
        
        <p>Dear {{customer_name}},</p>
        
        <p>We have successfully received your refund request. Our team will review it and get back to you soon.</p>
        
        <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;'>
            <h3>Refund Details:</h3>
            <ul style='list-style: none; padding: 0;'>
                <li><strong>Reference:</strong> {{refund_reference}}</li>
                <li><strong>Order:</strong> {{order_number}}</li>
                <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                <li><strong>Status:</strong> {{status}}</li>
                <li><strong>Date Requested:</strong> {{requested_date}}</li>
            </ul>
        </div>
        
        <p>We will review your request and notify you of our decision within 2 business days.</p>
        
        <p>If you have any questions, please contact us at {{support_email}}.</p>
        
        <p>Best regards,<br>{{tenant_name}} Team</p>
        ";
    }

    private function getRefundApprovedTemplate(): string
    {
        return "
        <h2>Refund Approved ✅</h2>
        
        <p>Dear {{customer_name}},</p>
        
        <p>Great news! Your refund request has been approved.</p>
        
        <div style='background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;'>
            <h3>Approved Refund Details:</h3>
            <ul style='list-style: none; padding: 0;'>
                <li><strong>Reference:</strong> {{refund_reference}}</li>
                <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                <li><strong>Refund Method:</strong> {{refund_method}}</li>
                <li><strong>Processing Time:</strong> {{processing_time}}</li>
                <li><strong>Approved by:</strong> {{approver_name}}</li>
            </ul>
        </div>
        
        <p>Your refund will be processed shortly. You will receive another confirmation once it's completed.</p>
        
        <p>Thank you for your patience.</p>
        
        <p>Best regards,<br>{{tenant_name}} Team</p>
        ";
    }

    private function getRefundRejectedTemplate(): string
    {
        return "
        <h2>Refund Request Update</h2>
        
        <p>Dear {{customer_name}},</p>
        
        <p>Thank you for your refund request. After careful review, we regret to inform you that we cannot approve your refund request at this time.</p>
        
        <div style='background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;'>
            <h3>Decision Details:</h3>
            <ul style='list-style: none; padding: 0;'>
                <li><strong>Reference:</strong> {{refund_reference}}</li>
                <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                <li><strong>Decision Date:</strong> {{rejected_date}}</li>
                <li><strong>Reason:</strong> {{rejection_reason}}</li>
            </ul>
        </div>
        
        <p>If you believe this decision was made in error, you can appeal by contacting our support team at {{support_email}}.</p>
        
        <p>We appreciate your understanding.</p>
        
        <p>Best regards,<br>{{tenant_name}} Team</p>
        ";
    }

    private function getRefundCompletedTemplate(): string
    {
        return "
        <h2>Refund Completed Successfully! 🎉</h2>
        
        <p>Dear {{customer_name}},</p>
        
        <p>Your refund has been successfully processed and completed.</p>
        
        <div style='background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;'>
            <h3>Refund Completion Details:</h3>
            <ul style='list-style: none; padding: 0;'>
                <li><strong>Reference:</strong> {{refund_reference}}</li>
                <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                <li><strong>Method:</strong> {{refund_method}}</li>
                <li><strong>Completed:</strong> {{completed_date}}</li>
                <li><strong>Transaction ID:</strong> {{transaction_id}}</li>
                <li><strong>Processing Time:</strong> {{processing_time}}</li>
            </ul>
        </div>
        
        <p>Please allow 3-5 business days for the refund to appear in your account, depending on your payment method.</p>
        
        <p>Thank you for choosing {{tenant_name}}.</p>
        
        <p>Best regards,<br>{{tenant_name}} Team</p>
        ";
    }

    private function getWorkflowAssignedTemplate(): string
    {
        return "
        <h2>Refund Approval Assignment</h2>
        
        <p>Hello {{assigned_user}},</p>
        
        <p>A refund request has been assigned to you for review.</p>
        
        <div style='background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;'>
            <h3>Assignment Details:</h3>
            <ul style='list-style: none; padding: 0;'>
                <li><strong>Customer:</strong> {{customer_name}}</li>
                <li><strong>Reference:</strong> {{refund_reference}}</li>
                <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                <li><strong>Task:</strong> {{step_name}}</li>
                <li><strong>Priority:</strong> {{priority}}</li>
                <li><strong>Deadline:</strong> {{deadline}}</li>
            </ul>
        </div>
        
        <p>Please review and process this request promptly.</p>
        
        <p><a href='{{admin_panel_url}}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Review Request</a></p>
        
        <p>Best regards,<br>{{tenant_name}} System</p>
        ";
    }

    private function getWorkflowEscalatedTemplate(): string
    {
        return "
        <h2>🚨 ESCALATED: Refund Approval Required</h2>
        
        <p>Hello {{escalated_to}},</p>
        
        <p><strong>URGENT:</strong> A refund approval has been escalated to you.</p>
        
        <div style='background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;'>
            <h3>Escalation Details:</h3>
            <ul style='list-style: none; padding: 0;'>
                <li><strong>Customer:</strong> {{customer_name}}</li>
                <li><strong>Reference:</strong> {{refund_reference}}</li>
                <li><strong>Amount:</strong> Rp {{refund_amount}}</li>
                <li><strong>From:</strong> {{original_assignee}}</li>
                <li><strong>Reason:</strong> {{escalation_reason}}</li>
                <li><strong>New Deadline:</strong> {{new_deadline}}</li>
            </ul>
        </div>
        
        <p>This case requires senior approval. Please review and process immediately.</p>
        
        <p><a href='{{admin_panel_url}}' style='background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>REVIEW NOW</a></p>
        
        <p>Best regards,<br>{{tenant_name}} System</p>
        ";
    }
}