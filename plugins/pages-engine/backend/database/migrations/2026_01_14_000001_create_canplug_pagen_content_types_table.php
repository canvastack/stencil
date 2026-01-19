<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canplug_pagen_content_types', function (Blueprint $table) {
            $table->id();
            
            $table->uuid('uuid')->unique();
            
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
            
            $table->string('name', 100);
            $table->string('slug', 100);
            $table->text('description')->nullable();
            $table->string('icon', 50)->nullable();
            
            $table->string('default_url_pattern', 255)->default('/{slug}');
            
            $table->boolean('is_commentable')->default(false);
            $table->boolean('is_categorizable')->default(true);
            $table->boolean('is_taggable')->default(true);
            $table->boolean('is_revisioned')->default(true);
            
            $table->enum('scope', ['platform', 'tenant'])->default('tenant');
            
            $table->boolean('is_active')->default(true);
            $table->jsonb('metadata')->default('{}');
            
            $table->timestamps();
        });
        
        Schema::table('canplug_pagen_content_types', function (Blueprint $table) {
            $table->index('tenant_id');
            $table->index('uuid');
            $table->index('slug');
            $table->index('scope');
            $table->index('is_active');
        });
        
        DB::statement('
            CREATE UNIQUE INDEX canplug_pagen_content_types_unique_platform_slug 
            ON canplug_pagen_content_types(slug) 
            WHERE scope = \'platform\'
        ');
        
        DB::statement('
            CREATE UNIQUE INDEX canplug_pagen_content_types_unique_tenant_slug 
            ON canplug_pagen_content_types(tenant_id, slug) 
            WHERE scope = \'tenant\' AND tenant_id IS NOT NULL
        ');
        
        DB::statement('
            CREATE OR REPLACE FUNCTION canplug_pagen_content_types_set_uuid()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.uuid IS NULL THEN
                    NEW.uuid = gen_random_uuid();
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        ');
        
        DB::statement('
            CREATE TRIGGER canplug_pagen_content_types_uuid_trigger
            BEFORE INSERT ON canplug_pagen_content_types
            FOR EACH ROW
            EXECUTE FUNCTION canplug_pagen_content_types_set_uuid();
        ');
    }
    
    public function down(): void
    {
        DB::statement('DROP TRIGGER IF EXISTS canplug_pagen_content_types_uuid_trigger ON canplug_pagen_content_types');
        DB::statement('DROP FUNCTION IF EXISTS canplug_pagen_content_types_set_uuid()');
        Schema::dropIfExists('canplug_pagen_content_types');
    }
};
