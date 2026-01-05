<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Add temporary column
        DB::statement("ALTER TABLE product_form_configurations ADD COLUMN tenant_id_temp bigint");

        // Step 2: Migrate data from UUID to integer ID
        DB::statement("
            UPDATE product_form_configurations pfc
            SET tenant_id_temp = (
                SELECT t.id 
                FROM tenants t 
                WHERE t.uuid::text = pfc.tenant_id::text
            )
        ");

        // Step 3: Drop old column and constraints
        DB::statement("ALTER TABLE product_form_configurations DROP COLUMN tenant_id CASCADE");

        // Step 4: Rename new column
        DB::statement("ALTER TABLE product_form_configurations RENAME COLUMN tenant_id_temp TO tenant_id");

        // Step 5: Add constraints
        DB::statement("
            ALTER TABLE product_form_configurations 
            ADD CONSTRAINT product_form_configurations_tenant_id_foreign 
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
        ");

        DB::statement("CREATE INDEX product_form_configurations_tenant_id_index ON product_form_configurations(tenant_id)");

        // Step 6: Recreate unique constraint
        DB::statement("ALTER TABLE product_form_configurations DROP CONSTRAINT IF EXISTS unique_active_form_per_product");
        DB::statement("
            CREATE UNIQUE INDEX unique_active_form_per_product 
            ON product_form_configurations (product_id, tenant_id, is_active) 
            WHERE is_active = true
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Step 1: Add temporary UUID column
        DB::statement("ALTER TABLE product_form_configurations ADD COLUMN tenant_id_temp uuid");

        // Step 2: Convert back to UUID by looking up tenant UUID from ID
        DB::statement("
            UPDATE product_form_configurations pfc
            SET tenant_id_temp = (
                SELECT t.uuid 
                FROM tenants t 
                WHERE t.id = pfc.tenant_id
            )
        ");

        // Step 3: Drop old column
        DB::statement("ALTER TABLE product_form_configurations DROP COLUMN tenant_id CASCADE");

        // Step 4: Rename column back
        DB::statement("ALTER TABLE product_form_configurations RENAME COLUMN tenant_id_temp TO tenant_id");

        // Step 5: Re-add constraints
        DB::statement("
            ALTER TABLE product_form_configurations 
            ADD CONSTRAINT product_form_configurations_tenant_id_foreign 
            FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE
        ");

        DB::statement("CREATE INDEX product_form_configurations_tenant_id_index ON product_form_configurations(tenant_id)");
        
        // Step 6: Recreate unique constraint
        DB::statement("ALTER TABLE product_form_configurations DROP CONSTRAINT IF EXISTS unique_active_form_per_product");
        DB::statement("
            CREATE UNIQUE INDEX unique_active_form_per_product 
            ON product_form_configurations (product_id, tenant_id, is_active) 
            WHERE is_active = true
        ");
    }
};
