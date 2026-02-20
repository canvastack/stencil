<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CustomerNotification;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use Illuminate\Support\Str;

class CustomerNotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get test customer (customer@demo.com)
        $customer = Customer::where('email', 'customer@demo.com')->first();
        
        if (!$customer) {
            $this->command->warn('Test customer not found. Please run CustomerSeeder first.');
            return;
        }

        // Get some customer quotes for reference (through orders)
        $quotes = CustomerQuote::whereHas('order', function($query) use ($customer) {
            $query->where('customer_id', $customer->id);
        })->limit(5)->get();

        $notifications = [
            // Quote-related notifications
            [
                'uuid' => Str::uuid()->toString(),
                'tenant_id' => $customer->tenant_id,
                'customer_id' => $customer->id,
                'type' => 'quote_received',
                'title' => 'New Quote Received',
                'message' => 'You have received a new quote for your order. Please review and respond.',
                'priority' => 'high',
                'action_url' => $quotes->isNotEmpty() ? "/customer/quotes/{$quotes->first()->uuid}" : null,
                'action_text' => 'View Quote',
                'customer_quote_id' => $quotes->isNotEmpty() ? $quotes->first()->id : null,
                'is_read' => false,
                'created_at' => now()->subHours(2),
                'updated_at' => now()->subHours(2),
            ],
            [
                'uuid' => Str::uuid()->toString(),
                'tenant_id' => $customer->tenant_id,
                'customer_id' => $customer->id,
                'type' => 'quote_accepted',
                'title' => 'Quote Accepted',
                'message' => 'Your quote has been accepted and is being processed. You will receive payment instructions shortly.',
                'priority' => 'normal',
                'action_url' => $quotes->count() > 1 ? "/customer/quotes/{$quotes->get(1)->uuid}" : null,
                'action_text' => 'View Details',
                'customer_quote_id' => $quotes->count() > 1 ? $quotes->get(1)->id : null,
                'is_read' => true,
                'read_at' => now()->subHours(1),
                'created_at' => now()->subHours(3),
                'updated_at' => now()->subHours(1),
            ],
            [
                'uuid' => Str::uuid()->toString(),
                'tenant_id' => $customer->tenant_id,
                'customer_id' => $customer->id,
                'type' => 'quote_expiring_soon',
                'title' => 'Quote Expiring Soon',
                'message' => 'Your quote will expire in 24 hours. Please review and respond before it expires.',
                'priority' => 'urgent',
                'action_url' => $quotes->count() > 2 ? "/customer/quotes/{$quotes->get(2)->uuid}" : null,
                'action_text' => 'Review Quote',
                'customer_quote_id' => $quotes->count() > 2 ? $quotes->get(2)->id : null,
                'is_read' => false,
                'created_at' => now()->subHours(5),
                'updated_at' => now()->subHours(5),
            ],
            
            // Order-related notifications
            [
                'uuid' => Str::uuid()->toString(),
                'tenant_id' => $customer->tenant_id,
                'customer_id' => $customer->id,
                'type' => 'order_confirmed',
                'title' => 'Order Confirmed',
                'message' => 'Your order has been confirmed and is now in production. You can track the progress in your dashboard.',
                'priority' => 'normal',
                'action_url' => '/customer/orders',
                'action_text' => 'View Orders',
                'is_read' => true,
                'read_at' => now()->subDays(1),
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(1),
            ],
            [
                'uuid' => Str::uuid()->toString(),
                'tenant_id' => $customer->tenant_id,
                'customer_id' => $customer->id,
                'type' => 'order_shipped',
                'title' => 'Order Shipped',
                'message' => 'Great news! Your order has been shipped and is on its way to you.',
                'priority' => 'high',
                'action_url' => '/customer/orders',
                'action_text' => 'Track Shipment',
                'is_read' => false,
                'created_at' => now()->subHours(8),
                'updated_at' => now()->subHours(8),
            ],
            
            // Payment notifications
            [
                'uuid' => Str::uuid()->toString(),
                'tenant_id' => $customer->tenant_id,
                'customer_id' => $customer->id,
                'type' => 'payment_received',
                'title' => 'Payment Received',
                'message' => 'We have received your payment. Thank you for your business!',
                'priority' => 'normal',
                'action_url' => '/customer/invoices',
                'action_text' => 'View Invoice',
                'is_read' => true,
                'read_at' => now()->subDays(3),
                'created_at' => now()->subDays(4),
                'updated_at' => now()->subDays(3),
            ],
            [
                'uuid' => Str::uuid()->toString(),
                'tenant_id' => $customer->tenant_id,
                'customer_id' => $customer->id,
                'type' => 'payment_reminder',
                'title' => 'Payment Reminder',
                'message' => 'This is a friendly reminder that your payment is due in 3 days.',
                'priority' => 'high',
                'action_url' => '/customer/invoices',
                'action_text' => 'Pay Now',
                'is_read' => false,
                'created_at' => now()->subHours(12),
                'updated_at' => now()->subHours(12),
            ],
            
            // General notifications
            [
                'uuid' => Str::uuid()->toString(),
                'tenant_id' => $customer->tenant_id,
                'customer_id' => $customer->id,
                'type' => 'account_update',
                'title' => 'Profile Updated',
                'message' => 'Your profile information has been successfully updated.',
                'priority' => 'low',
                'action_url' => '/customer/profile',
                'action_text' => 'View Profile',
                'is_read' => true,
                'read_at' => now()->subDays(5),
                'created_at' => now()->subDays(6),
                'updated_at' => now()->subDays(5),
            ],
            [
                'uuid' => Str::uuid()->toString(),
                'tenant_id' => $customer->tenant_id,
                'customer_id' => $customer->id,
                'type' => 'welcome',
                'title' => 'Welcome to Our Platform!',
                'message' => 'Thank you for joining us. We\'re excited to have you on board!',
                'priority' => 'normal',
                'action_url' => '/customer/dashboard',
                'action_text' => 'Get Started',
                'is_read' => true,
                'read_at' => now()->subDays(7),
                'created_at' => now()->subDays(8),
                'updated_at' => now()->subDays(7),
            ],
            [
                'uuid' => Str::uuid()->toString(),
                'tenant_id' => $customer->tenant_id,
                'customer_id' => $customer->id,
                'type' => 'system_announcement',
                'title' => 'System Maintenance Scheduled',
                'message' => 'We will be performing system maintenance on Sunday from 2 AM to 4 AM. The platform may be temporarily unavailable.',
                'priority' => 'normal',
                'action_url' => null,
                'action_text' => null,
                'is_read' => false,
                'created_at' => now()->subHours(6),
                'updated_at' => now()->subHours(6),
            ],
        ];

        foreach ($notifications as $notification) {
            CustomerNotification::create($notification);
        }

        $this->command->info('Customer notifications seeded successfully!');
        $this->command->info('Created ' . count($notifications) . ' notifications for customer: ' . $customer->email);
    }
}
