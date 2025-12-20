<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use Illuminate\Support\Facades\DB;

class CheckInvalidStockCommand extends Command
{
    protected $signature = 'db:check:invalid-stock 
                            {--tenant-id= : Check specific tenant only}
                            {--detailed : Show detailed product information}';

    protected $description = 'Check for products with invalid stock quantity (negative or exceeding maximum)';

    public function handle()
    {
        $this->info('🔍 Checking for products with invalid stock quantity...');
        $this->newLine();

        $tenantId = $this->option('tenant-id');
        $verbose = $this->option('detailed');

        $query = Product::query()
            ->where(function ($q) {
                $q->where('stock_quantity', '<', 0)
                  ->orWhere('stock_quantity', '>', 999999);
            });

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
            $this->line("Filtering by tenant_id: {$tenantId}");
        }

        $invalidProducts = $query->get();
        $totalInvalid = $invalidProducts->count();

        if ($totalInvalid === 0) {
            $this->info('✅ No products with invalid stock quantity found!');
            $this->info('All products have valid stock values (0 to 999999).');
            return Command::SUCCESS;
        }

        $this->warn("⚠️  Found {$totalInvalid} product(s) with invalid stock quantity:");
        $this->newLine();

        $negativeStock = $invalidProducts->filter(fn($p) => $p->stock_quantity < 0);
        $excessiveStock = $invalidProducts->filter(fn($p) => $p->stock_quantity > 999999);

        if ($negativeStock->count() > 0) {
            $this->error("❌ Negative Stock ({$negativeStock->count()} products):");
            $this->displayProductTable($negativeStock, $verbose);
            $this->newLine();
        }

        if ($excessiveStock->count() > 0) {
            $this->error("❌ Excessive Stock ({$excessiveStock->count()} products):");
            $this->displayProductTable($excessiveStock, $verbose);
            $this->newLine();
        }

        $this->info('📊 Summary:');
        $this->table(
            ['Category', 'Count', 'Action Needed'],
            [
                ['Negative Stock', $negativeStock->count(), 'Set to 0 (out of stock)'],
                ['Excessive Stock (>999999)', $excessiveStock->count(), 'Set to 999999 (maximum)'],
                ['Total Invalid', $totalInvalid, 'Run fix command'],
            ]
        );

        $this->newLine();
        $this->info('💡 To fix these issues, run:');
        $this->line('   php artisan db:fix:invalid-stock --dry-run');
        $this->line('   php artisan db:fix:invalid-stock (to apply changes)');

        return Command::FAILURE;
    }

    private function displayProductTable($products, $verbose = false)
    {
        if ($verbose) {
            $headers = ['ID', 'UUID', 'Tenant ID', 'Name', 'SKU', 'Stock Qty', 'Status'];
            $rows = $products->map(function ($product) {
                return [
                    $product->id,
                    substr($product->uuid, 0, 8) . '...',
                    $product->tenant_id,
                    substr($product->name, 0, 30),
                    $product->sku ?? 'N/A',
                    $product->stock_quantity,
                    $product->status,
                ];
            })->toArray();
        } else {
            $headers = ['ID', 'Name', 'Stock Qty', 'Tenant ID'];
            $rows = $products->map(function ($product) {
                return [
                    $product->id,
                    substr($product->name, 0, 40),
                    $product->stock_quantity,
                    $product->tenant_id,
                ];
            })->toArray();
        }

        $this->table($headers, $rows);
    }

    private function getStatistics()
    {
        return [
            'total_products' => Product::count(),
            'valid_stock' => Product::whereBetween('stock_quantity', [0, 999999])->count(),
            'negative_stock' => Product::where('stock_quantity', '<', 0)->count(),
            'excessive_stock' => Product::where('stock_quantity', '>', 999999)->count(),
            'null_stock' => Product::whereNull('stock_quantity')->count(),
        ];
    }
}
