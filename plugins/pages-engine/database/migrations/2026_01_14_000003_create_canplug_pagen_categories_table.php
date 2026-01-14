<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canplug_pagen_categories', function (Blueprint $table) {
            $table->id();
            
            $table->uuid('uuid')->unique();
            
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')
                  ->references('uuid')
                  ->on('public.tenants')
                  ->onDelete('cascade');
            
            $table->uuid('content_type_id');
            
            $table->uuid('parent_id')->nullable();
            
            $table->string('name', 255);
            $table->string('slug', 255);
            $table->text('description')->nullable();
            
            $table->string('path', 1000)->nullable();
            $table->integer('level')->default(0);
            
            $table->string('featured_image_id', 255)->nullable();
            
            $table->string('seo_title', 255)->nullable();
            $table->text('seo_description')->nullable();
            
            $table->integer('sort_order')->default(0);
            $table->integer('content_count')->default(0);
            
            $table->boolean('is_active')->default(true);
            $table->jsonb('metadata')->default('{}');
            
            $table->timestamps();
        });
        
        Schema::table('canplug_pagen_categories', function (Blueprint $table) {
            $table->index('tenant_id');
            $table->index('uuid');
            $table->index('content_type_id');
            $table->index('parent_id');
            $table->index('slug');
            $table->index('path');
            $table->index('level');
            $table->index('sort_order');
            $table->index(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'content_type_id']);
        });
        
        DB::statement('
            CREATE UNIQUE INDEX canplug_pagen_categories_unique_slug 
            ON canplug_pagen_categories(tenant_id, content_type_id, parent_id, slug) 
            WHERE parent_id IS NOT NULL
        ');
        
        DB::statement('
            CREATE UNIQUE INDEX canplug_pagen_categories_unique_root_slug 
            ON canplug_pagen_categories(tenant_id, content_type_id, slug) 
            WHERE parent_id IS NULL
        ');
        
        DB::statement('
            CREATE OR REPLACE FUNCTION canplug_pagen_categories_set_uuid()
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
            CREATE TRIGGER canplug_pagen_categories_uuid_trigger
            BEFORE INSERT ON canplug_pagen_categories
            FOR EACH ROW
            EXECUTE FUNCTION canplug_pagen_categories_set_uuid();
        ');
        
        DB::statement("
            CREATE OR REPLACE FUNCTION canplug_pagen_categories_calculate_path()
            RETURNS TRIGGER AS $$
            DECLARE
                parent_path TEXT;
                parent_level INT;
            BEGIN
                IF NEW.parent_id IS NULL THEN
                    NEW.path = '/' || NEW.uuid;
                    NEW.level = 0;
                ELSE
                    SELECT path, level INTO parent_path, parent_level
                    FROM canplug_pagen_categories
                    WHERE uuid = NEW.parent_id;
                    
                    IF parent_path IS NULL THEN
                        RAISE EXCEPTION 'Parent category not found: %', NEW.parent_id;
                    END IF;
                    
                    NEW.path = parent_path || '/' || NEW.uuid;
                    NEW.level = parent_level + 1;
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        ");
        
        DB::statement('
            CREATE TRIGGER canplug_pagen_categories_path_trigger
            BEFORE INSERT OR UPDATE OF parent_id ON canplug_pagen_categories
            FOR EACH ROW
            EXECUTE FUNCTION canplug_pagen_categories_calculate_path();
        ');
        
        DB::statement("
            CREATE OR REPLACE FUNCTION canplug_pagen_categories_update_children_path()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD.path IS DISTINCT FROM NEW.path THEN
                    UPDATE canplug_pagen_categories
                    SET path = REPLACE(path, OLD.path, NEW.path)
                    WHERE path LIKE OLD.path || '/%';
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        ");
        
        DB::statement('
            CREATE TRIGGER canplug_pagen_categories_update_children_trigger
            AFTER UPDATE OF path ON canplug_pagen_categories
            FOR EACH ROW
            EXECUTE FUNCTION canplug_pagen_categories_update_children_path();
        ');
    }
    
    public function down(): void
    {
        DB::statement('DROP TRIGGER IF EXISTS canplug_pagen_categories_update_children_trigger ON canplug_pagen_categories');
        DB::statement('DROP TRIGGER IF EXISTS canplug_pagen_categories_path_trigger ON canplug_pagen_categories');
        DB::statement('DROP TRIGGER IF EXISTS canplug_pagen_categories_uuid_trigger ON canplug_pagen_categories');
        DB::statement('DROP FUNCTION IF EXISTS canplug_pagen_categories_update_children_path()');
        DB::statement('DROP FUNCTION IF EXISTS canplug_pagen_categories_calculate_path()');
        DB::statement('DROP FUNCTION IF EXISTS canplug_pagen_categories_set_uuid()');
        Schema::dropIfExists('canplug_pagen_categories');
    }
};
