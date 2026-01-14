<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canplug_pagen_comments', function (Blueprint $table) {
            $table->id();
            
            $table->uuid('uuid')->unique();
            
            $table->uuid('content_id');
            
            $table->uuid('parent_id')->nullable();
            
            $table->uuid('user_id')->nullable();
            
            $table->string('author_name', 255)->nullable();
            $table->string('author_email', 255)->nullable();
            $table->string('author_url', 500)->nullable();
            
            $table->text('comment_text');
            
            $table->enum('status', ['pending', 'approved', 'spam', 'trash'])
                  ->default('pending');
            
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            
            $table->integer('spam_score')->default(0);
            
            $table->jsonb('metadata')->default('{}');
            
            $table->timestamps();
            $table->softDeletes();
        });
        
        Schema::table('canplug_pagen_comments', function (Blueprint $table) {
            $table->index('uuid');
            $table->index('content_id');
            $table->index('parent_id');
            $table->index('user_id');
            $table->index('author_email');
            $table->index('status');
            $table->index('created_at');
            $table->index(['content_id', 'status']);
            $table->index(['content_id', 'parent_id']);
        });
        
        DB::statement('
            CREATE OR REPLACE FUNCTION canplug_pagen_comments_set_uuid()
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
            CREATE TRIGGER canplug_pagen_comments_uuid_trigger
            BEFORE INSERT ON canplug_pagen_comments
            FOR EACH ROW
            EXECUTE FUNCTION canplug_pagen_comments_set_uuid();
        ');
        
        DB::statement("
            CREATE OR REPLACE FUNCTION canplug_pagen_comments_update_count()
            RETURNS TRIGGER AS $$
            BEGIN
                IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
                    UPDATE canplug_pagen_contents
                    SET comment_count = comment_count + 1
                    WHERE uuid = NEW.content_id;
                ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
                    UPDATE canplug_pagen_contents
                    SET comment_count = GREATEST(comment_count - 1, 0)
                    WHERE uuid = OLD.content_id;
                ELSIF TG_OP = 'UPDATE' THEN
                    IF OLD.status = 'approved' AND NEW.status != 'approved' THEN
                        UPDATE canplug_pagen_contents
                        SET comment_count = GREATEST(comment_count - 1, 0)
                        WHERE uuid = NEW.content_id;
                    ELSIF OLD.status != 'approved' AND NEW.status = 'approved' THEN
                        UPDATE canplug_pagen_contents
                        SET comment_count = comment_count + 1
                        WHERE uuid = NEW.content_id;
                    END IF;
                END IF;
                
                IF TG_OP = 'DELETE' THEN
                    RETURN OLD;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        ");
        
        DB::statement('
            CREATE TRIGGER canplug_pagen_comments_count_trigger
            AFTER INSERT OR UPDATE OF status OR DELETE ON canplug_pagen_comments
            FOR EACH ROW
            EXECUTE FUNCTION canplug_pagen_comments_update_count();
        ');
    }
    
    public function down(): void
    {
        DB::statement('DROP TRIGGER IF EXISTS canplug_pagen_comments_count_trigger ON canplug_pagen_comments');
        DB::statement('DROP TRIGGER IF EXISTS canplug_pagen_comments_uuid_trigger ON canplug_pagen_comments');
        DB::statement('DROP FUNCTION IF EXISTS canplug_pagen_comments_update_count()');
        DB::statement('DROP FUNCTION IF EXISTS canplug_pagen_comments_set_uuid()');
        Schema::dropIfExists('canplug_pagen_comments');
    }
};
