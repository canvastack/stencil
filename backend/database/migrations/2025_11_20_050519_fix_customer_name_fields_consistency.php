<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Fix customer name fields consistency - make first_name and last_name nullable
     * since the new Customer model only uses the 'name' field.
     */
    public function up(): void
    {
        // First, ensure all existing records have proper name field populated
        // If name is empty but first_name/last_name exist, combine them
        DB::statement("
            UPDATE customers 
            SET name = COALESCE(
                NULLIF(TRIM(name), ''),
                TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
            )
            WHERE name IS NULL OR TRIM(name) = ''
        ");
        
        // Handle edge case where both name and first_name/last_name are null
        DB::statement("
            UPDATE customers 
            SET name = 'Customer' 
            WHERE name IS NULL OR TRIM(name) = ''
        ");
        
        // Now modify the table structure
        Schema::table('customers', function (Blueprint $table) {
            // Make first_name and last_name nullable since we're transitioning to 'name' field
            $table->string('first_name')->nullable()->change();
            $table->string('last_name')->nullable()->change();
            
            // Make name field required (it should already exist from phase3 enhancement)
            $table->string('name')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // Restore first_name and last_name as required fields
            $table->string('first_name')->nullable(false)->change();
            $table->string('last_name')->nullable(false)->change();
            
            // Make name nullable again  
            $table->string('name')->nullable()->change();
        });
    }
};
