<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use Illuminate\Support\Facades\DB;

class FixInvalidStockCommand extends Command
{
    protected $signature = 'db:fix:invalid-stock 
                            {--dry-run : Preview changes without applying them}
                            {--tenant-id= : Fix specific tenant only}
                            {--backup : Create backup table before fixing}
                            {--force : Skip confirmation prompt}';

    protected $description = 'Fix products with invalid stock quantity (set negative to 0, excessive to 999999)';

    private $fixedCount = 0;
    private $affectedProducts = [];

    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $tenantId = $this->option('tenant-id');
        $createBackup = $this->option('backup');
        $force = $this->option('force');

        $mode = $dryRun ? '🔍 DRY RUN MODE' : '⚠️  LIVE FIX MODE';
        $this->warn($mode);
        $this->info('Fixing products with invalid stock quantity...');
        $this->newLine();

        if ($tenantId) {
            $this->line("Filtering by tenant_id: {$tenantId}");
        }

        $query = Product::query()
            ->where(function ($q) {
                $q->where('stock_quantity', '<', 0)
                  ->orWhere('stock_quantity', '>', 999999);
            });

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $invalidProducts = $query->get();
        $totalInvalid = $invalidProducts->count();

        if ($totalInvalid === 0) {
            $this->info('✅ No products with invalid stock quantity found!');
            $this->info('Nothing to fix.');
            return Command::SUCCESS;
        }

        $this->warn("Found {$totalInvalid} product(s) with invalid stock quantity.");
        $this->newLine();

        $negativeStock = $invalidProducts->filter(fn($p) => $p->stock_quantity < 0);
        $excessiveStock = $invalidProducts->filter(fn($p) => $p->stock_quantity > 999999);

        $this->displayFixPlan($negativeStock, $excessiveStock);
        $this->newLine();

        if (!$dryRun && !$force) {
            if (!$this->confirm('Do you want to proceed with these changes?')) {
                $this->info('Operation cancelled.');
                return Command::FAILURE;
            }
        }

        if (!$dryRun && $createBackup) {
            $this->info('📦 Creating backup table...');
            $this->createBackupTable();
            $this->info('✅ Backup created: products_backup');
            $this->newLine();
        }

        DB::beginTransaction();

        try {
            $this->fixNegativeStock($negativeStock, $dryRun);
            $this->fixExcessiveStock($excessiveStock, $dryRun);

            if (!$dryRun) {
                DB::commit();
                $this->newLine();
                $this->info("✅ Successfully fixed {$this->fixedCount} product(s)!");
                $this->displayAffectedProducts();
            } else {
                DB::rollBack();
                $this->newLine();
                $this->info("✅ Dry run complete. {$this->fixedCount} product(s) would be fixed.");
                $this->warn('No changes were made to the database.');
                $this->newLine();
                $this->info('To apply these changes, run without --dry-run:');
                $this->line('   php artisan db:fix:invalid-stock');
            }

            return Command::SUCCESS;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('❌ Error fixing invalid stock: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }

    private function displayFixPlan($negativeStock, $excessiveStock)
    {
        $this->info('📋 Fix Plan:');
        
        if ($negativeStock->count() > 0) {
            $this->table(
                ['Product ID', 'Name', 'Current Stock', 'New Stock'],
                $negativeStock->map(fn($p) => [
                    $p->id,
                    substr($p->name, 0, 40),
                    $p->stock_quantity,
                    '0 (out of stock)',
                ])->toArray()
            );
        }

        if ($excessiveStock->count() > 0) {
            $this->table(
                ['Product ID', 'Name', 'Current Stock', 'New Stock'],
                $excessiveStock->map(fn($p) => [
                    $p->id,
                    substr($p->name, 0, 40),
                    $p->stock_quantity,
                    '999999 (maximum)',
                ])->toArray()
            );
        }
    }

    private function fixNegativeStock($products, $dryRun)
    {
        if ($products->isEmpty()) {
            return;
        }

        $this->info("Fixing {$products->count()} product(s) with negative stock...");

        foreach ($products as $product) {
            $oldStock = $product->stock_quantity;
            
            if (!$dryRun) {
                $product->stock_quantity = 0;
                $product->save();
            }

            $this->affectedProducts[] = [
                'id' => $product->id,
                'name' => $product->name,
                'old_stock' => $oldStock,
                'new_stock' => 0,
            ];

            $this->fixedCount++;
            
            if ($dryRun) {
                $this->line("  [DRY RUN] Product #{$product->id}: {$oldStock} → 0");
            } else {
                $this->line("  ✓ Product #{$product->id}: {$oldStock} → 0");
            }
        }
    }

    private function fixExcessiveStock($products, $dryRun)
    {
        if ($products->isEmpty()) {
            return;
        }

        $this->newLine();
        $this->info("Fixing {$products->count()} product(s) with excessive stock...");

        foreach ($products as $product) {
            $oldStock = $product->stock_quantity;
            
            if (!$dryRun) {
                $product->stock_quantity = 999999;
                $product->save();
            }

            $this->affectedProducts[] = [
                'id' => $product->id,
                'name' => $product->name,
                'old_stock' => $oldStock,
                'new_stock' => 999999,
            ];

            $this->fixedCount++;
            
            if ($dryRun) {
                $this->line("  [DRY RUN] Product #{$product->id}: {$oldStock} → 999999");
            } else {
                $this->line("  ✓ Product #{$product->id}: {$oldStock} → 999999");
            }
        }
    }

    private function createBackupTable()
    {
        DB::statement('DROP TABLE IF EXISTS products_backup');
        
        DB::statement('CREATE TABLE products_backup AS SELECT * FROM products');
        
        $backupCount = DB::table('products_backup')->count();
        $this->line("  Backed up {$backupCount} products");
    }

    private function displayAffectedProducts()
    {
        $this->newLine();
        $this->info('📊 Fixed Products Summary:');
        
        $this->table(
            ['Product ID', 'Name', 'Old Stock', 'New Stock'],
            collect($this->affectedProducts)->map(fn($p) => [
                $p['id'],
                substr($p['name'], 0, 40),
                $p['old_stock'],
                $p['new_stock'],
            ])->toArray()
        );

        $this->newLine();
        $this->info('💡 Verification:');
        $this->line('   To verify all fixes, run:');
        $this->line('   php artisan db:check:invalid-stock');
    }
}
