<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // Add total_spent field if it doesn't exist
            if (!Schema::hasColumn('customers', 'total_spent')) {
                $table->bigInteger('total_spent')->default(0)->after('status');
            }
            
            // Add total_orders field if it doesn't exist
            if (!Schema::hasColumn('customers', 'total_orders')) {
                $table->integer('total_orders')->default(0)->after('total_spent');
            }
            
            // Add index for performance
            if (!Schema::hasIndex('customers', ['tenant_id', 'total_spent'])) {
                $table->index(['tenant_id', 'total_spent']);
            }
            
            if (!Schema::hasIndex('customers', ['tenant_id', 'total_orders'])) {
                $table->index(['tenant_id', 'total_orders']);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'total_spent']);
            $table->dropIndex(['tenant_id', 'total_orders']);
            $table->dropColumn(['total_spent', 'total_orders']);
        });
    }
};