-- Fix tenant_id column type in product_form_configurations

-- Step 1: Create temporary column
ALTER TABLE product_form_configurations ADD COLUMN tenant_id_temp bigint;

-- Step 2: Migrate data from UUID to integer ID
UPDATE product_form_configurations pfc
SET tenant_id_temp = (
    SELECT t.id 
    FROM tenants t 
    WHERE t.uuid::text = pfc.tenant_id::text
);

-- Step 3: Drop old column
ALTER TABLE product_form_configurations DROP COLUMN tenant_id CASCADE;

-- Step 4: Rename new column
ALTER TABLE product_form_configurations RENAME COLUMN tenant_id_temp TO tenant_id;

-- Step 5: Add constraints
ALTER TABLE product_form_configurations 
    ADD CONSTRAINT product_form_configurations_tenant_id_foreign 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

CREATE INDEX product_form_configurations_tenant_id_index ON product_form_configurations(tenant_id);

-- Step 6: Update unique constraint if needed
ALTER TABLE product_form_configurations 
    DROP CONSTRAINT IF EXISTS unique_active_form_per_product;

CREATE UNIQUE INDEX unique_active_form_per_product 
    ON product_form_configurations (product_id, tenant_id, is_active) 
    WHERE is_active = true;
