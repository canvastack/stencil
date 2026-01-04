<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Update all products with 'both' to 'vendor'
        DB::statement("UPDATE products SET production_type = 'vendor' WHERE production_type = 'both'");
        
        // Step 2: Drop the default value temporarily
        DB::statement("ALTER TABLE products ALTER COLUMN production_type DROP DEFAULT");
        
        // Step 3: For PostgreSQL, we need to alter the enum type
        // First, create a new enum type without 'both'
        DB::statement("CREATE TYPE production_type_new AS ENUM ('internal', 'vendor')");
        
        // Alter the column to use the new type
        DB::statement("ALTER TABLE products ALTER COLUMN production_type TYPE production_type_new USING production_type::text::production_type_new");
        
        // Drop the old type
        DB::statement("DROP TYPE IF EXISTS production_type_enum");
        
        // Rename the new type to the original name (optional, for consistency)
        DB::statement("ALTER TYPE production_type_new RENAME TO production_type_enum");
        
        // Step 4: Restore the default value
        DB::statement("ALTER TABLE products ALTER COLUMN production_type SET DEFAULT 'vendor'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate the enum type with 'both'
        DB::statement("CREATE TYPE production_type_with_both AS ENUM ('internal', 'vendor', 'both')");
        
        // Alter the column to use the type with 'both'
        DB::statement("ALTER TABLE products ALTER COLUMN production_type TYPE production_type_with_both USING production_type::text::production_type_with_both");
        
        // Drop the old type
        DB::statement("DROP TYPE IF EXISTS production_type_enum");
        
        // Rename back
        DB::statement("ALTER TYPE production_type_with_both RENAME TO production_type_enum");
    }
};
