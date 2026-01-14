<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canplug_pagen_contents', function (Blueprint $table) {
            $table->id();
            
            $table->uuid('uuid')->unique();
            
            $table->uuid('tenant_id');
            $table->foreign('tenant_id')
                  ->references('uuid')
                  ->on('public.tenants')
                  ->onDelete('cascade');
            
            $table->uuid('content_type_id');
            $table->uuid('author_id');
            
            $table->string('title', 500);
            $table->string('slug', 500);
            $table->text('excerpt')->nullable();
            $table->jsonb('content');
            $table->enum('content_format', ['wysiwyg', 'markdown', 'html', 'plaintext'])
                  ->default('wysiwyg');
            
            $table->uuid('featured_image_id')->nullable();
            
            $table->enum('status', ['draft', 'published', 'scheduled', 'archived'])
                  ->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamp('scheduled_publish_at')->nullable();
            
            $table->string('custom_url', 500)->nullable();
            
            $table->string('seo_title', 255)->nullable();
            $table->text('seo_description')->nullable();
            $table->jsonb('seo_keywords')->nullable();
            $table->string('canonical_url', 500)->nullable();
            
            $table->unsignedBigInteger('view_count')->default(0);
            $table->integer('comment_count')->default(0);
            
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_commentable')->default(true);
            
            $table->integer('sort_order')->default(0);
            
            $table->jsonb('metadata')->default('{}');
            
            $table->timestamps();
            $table->softDeletes();
        });
        
        Schema::table('canplug_pagen_contents', function (Blueprint $table) {
            $table->index('tenant_id');
            $table->index('uuid');
            $table->index('content_type_id');
            $table->index('author_id');
            $table->index('slug');
            $table->index('status');
            $table->index('published_at');
            $table->index('scheduled_publish_at');
            $table->index('deleted_at');
            $table->index('is_featured');
            $table->index('custom_url');
            $table->index(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'content_type_id']);
        });
        
        DB::statement("
            CREATE INDEX canplug_pagen_contents_fulltext_idx 
            ON canplug_pagen_contents 
            USING GIN (to_tsvector('indonesian', title || ' ' || COALESCE(excerpt, '')))
        ");
        
        DB::statement('
            CREATE UNIQUE INDEX canplug_pagen_contents_unique_tenant_slug 
            ON canplug_pagen_contents(tenant_id, slug) 
            WHERE deleted_at IS NULL
        ');
        
        DB::statement('
            CREATE UNIQUE INDEX canplug_pagen_contents_unique_tenant_custom_url 
            ON canplug_pagen_contents(tenant_id, custom_url) 
            WHERE custom_url IS NOT NULL AND deleted_at IS NULL
        ');
        
        DB::statement('
            CREATE OR REPLACE FUNCTION canplug_pagen_contents_set_uuid()
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
            CREATE TRIGGER canplug_pagen_contents_uuid_trigger
            BEFORE INSERT ON canplug_pagen_contents
            FOR EACH ROW
            EXECUTE FUNCTION canplug_pagen_contents_set_uuid();
        ');
        
        DB::statement('
            CREATE OR REPLACE FUNCTION canplug_pagen_contents_update_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        ');
        
        DB::statement('
            CREATE TRIGGER canplug_pagen_contents_update_trigger
            BEFORE UPDATE ON canplug_pagen_contents
            FOR EACH ROW
            EXECUTE FUNCTION canplug_pagen_contents_update_timestamp();
        ');
    }
    
    public function down(): void
    {
        DB::statement('DROP TRIGGER IF EXISTS canplug_pagen_contents_update_trigger ON canplug_pagen_contents');
        DB::statement('DROP TRIGGER IF EXISTS canplug_pagen_contents_uuid_trigger ON canplug_pagen_contents');
        DB::statement('DROP FUNCTION IF EXISTS canplug_pagen_contents_update_timestamp()');
        DB::statement('DROP FUNCTION IF EXISTS canplug_pagen_contents_set_uuid()');
        Schema::dropIfExists('canplug_pagen_contents');
    }
};
