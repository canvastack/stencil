<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('name')->after('tenant_id')->nullable();
            $table->string('company')->after('company_name')->nullable();
            $table->string('city')->after('address')->nullable();
            $table->string('province')->after('city')->nullable();
            $table->string('postal_code')->after('province')->nullable();
            $table->json('location')->after('postal_code')->nullable();
            $table->text('notes')->after('metadata')->nullable();
            $table->string('tax_id')->after('notes')->nullable();
            $table->string('business_license')->after('tax_id')->nullable();
            $table->integer('total_orders')->default(0)->after('business_license');
            $table->bigInteger('total_spent')->default(0)->after('total_orders');
            $table->timestamp('last_order_date')->nullable()->after('total_spent');
            
            $table->renameColumn('type', 'customer_type');
            
            $table->index('city');
            $table->index('province');
            $table->index('customer_type');
        });
        
        DB::statement("UPDATE customers SET name = CONCAT(first_name, ' ', last_name) WHERE name IS NULL");
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->renameColumn('customer_type', 'type');
            
            $table->dropIndex(['city']);
            $table->dropIndex(['province']);
            $table->dropIndex(['customer_type']);
            
            $table->dropColumn([
                'name',
                'company',
                'city',
                'province',
                'postal_code',
                'location',
                'notes',
                'tax_id',
                'business_license',
                'total_orders',
                'total_spent',
                'last_order_date',
            ]);
        });
    }
};
