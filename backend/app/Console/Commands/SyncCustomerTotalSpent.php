<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Support\Facades\DB;

class SyncCustomerTotalSpent extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'customers:sync-total-spent {--tenant= : Specific tenant ID to sync}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync customer total_spent field with actual orders data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tenantId = $this->option('tenant');
        
        $this->info('Starting customer total_spent and total_orders synchronization...');
        
        // Build query
        $query = Customer::query();
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
            $this->info("Syncing for tenant ID: {$tenantId}");
        } else {
            $this->info("Syncing for all tenants");
        }
        
        $customers = $query->get();
        $updated = 0;
        $errors = 0;
        
        foreach ($customers as $customer) {
            try {
                // Calculate totals from orders
                $orders = Order::where('customer_id', $customer->id)
                    ->where('tenant_id', $customer->tenant_id);
                
                $totalFromOrders = $orders->sum('total_amount') ?? 0;
                $countFromOrders = $orders->count() ?? 0;
                
                // Update if different
                $needsUpdate = false;
                $changes = [];
                
                if ($customer->total_spent != $totalFromOrders) {
                    $changes[] = "total_spent: {$customer->total_spent} → {$totalFromOrders}";
                    $customer->total_spent = $totalFromOrders;
                    $needsUpdate = true;
                }
                
                if ($customer->total_orders != $countFromOrders) {
                    $changes[] = "total_orders: {$customer->total_orders} → {$countFromOrders}";
                    $customer->total_orders = $countFromOrders;
                    $needsUpdate = true;
                }
                
                if ($needsUpdate) {
                    $customer->save();
                    $this->line("Customer {$customer->name} (ID: {$customer->id}): " . implode(', ', $changes));
                    $updated++;
                }
            } catch (\Exception $e) {
                $this->error("Error updating customer {$customer->id}: " . $e->getMessage());
                $errors++;
            }
        }
        
        $this->info("Synchronization completed!");
        $this->info("Total customers processed: " . $customers->count());
        $this->info("Updated: {$updated}");
        $this->info("Errors: {$errors}");
        
        return Command::SUCCESS;
    }
}