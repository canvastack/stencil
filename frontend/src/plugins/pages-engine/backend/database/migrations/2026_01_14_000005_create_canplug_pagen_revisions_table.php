<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canplug_pagen_revisions', function (Blueprint $table) {
            $table->id();
            
            $table->uuid('uuid')->unique();
            
            $table->uuid('content_id');
            
            $table->string('title', 500);
            $table->text('excerpt')->nullable();
            $table->jsonb('content');
            $table->enum('content_format', ['wysiwyg', 'markdown', 'html', 'plaintext']);
            
            $table->uuid('created_by');
            $table->string('change_summary', 500)->nullable();
            
            $table->jsonb('metadata')->default('{}');
            
            $table->timestamp('created_at');
        });
        
        Schema::table('canplug_pagen_revisions', function (Blueprint $table) {
            $table->index('uuid');
            $table->index('content_id');
            $table->index('created_by');
            $table->index('created_at');
            $table->index(['content_id', 'created_at']);
        });
        
        DB::statement('
            CREATE OR REPLACE FUNCTION canplug_pagen_revisions_set_uuid()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.uuid IS NULL THEN
                    NEW.uuid = gen_random_uuid();
                END IF;
                IF NEW.created_at IS NULL THEN
                    NEW.created_at = CURRENT_TIMESTAMP;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        ');
        
        DB::statement('
            CREATE TRIGGER canplug_pagen_revisions_uuid_trigger
            BEFORE INSERT ON canplug_pagen_revisions
            FOR EACH ROW
            EXECUTE FUNCTION canplug_pagen_revisions_set_uuid();
        ');
    }
    
    public function down(): void
    {
        DB::statement('DROP TRIGGER IF EXISTS canplug_pagen_revisions_uuid_trigger ON canplug_pagen_revisions');
        DB::statement('DROP FUNCTION IF EXISTS canplug_pagen_revisions_set_uuid()');
        Schema::dropIfExists('canplug_pagen_revisions');
    }
};
