<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Add vendor portal fields to existing quote_messages table.
     * Requirements: 13.3, 13.10
     */
    public function up(): void
    {
        Schema::table('quote_messages', function (Blueprint $table) {
            // Add sender_type to distinguish between admin and vendor messages
            $table->string('sender_type', 20)->default('admin')->after('sender_id');
            
            // Add is_read flag for better read tracking
            $table->boolean('is_read')->default(false)->after('read_at');
            
            // Add soft deletes
            $table->softDeletes()->after('updated_at');
        });
        
        // Add check constraint for sender_type
        DB::statement("ALTER TABLE quote_messages ADD CONSTRAINT quote_messages_sender_type_check CHECK (sender_type IN ('admin', 'vendor'))");
        
        // Add index for unread messages
        DB::statement('CREATE INDEX idx_quote_messages_unread ON quote_messages(quote_id, is_read) WHERE is_read = false');
        
        // Add comments
        DB::statement("COMMENT ON COLUMN quote_messages.sender_type IS 'Type of sender: admin or vendor'");
        DB::statement("COMMENT ON COLUMN quote_messages.is_read IS 'Whether the message has been read by the recipient'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quote_messages', function (Blueprint $table) {
            // Drop index first
            DB::statement('DROP INDEX IF EXISTS idx_quote_messages_unread');
            
            // Drop check constraint
            DB::statement('ALTER TABLE quote_messages DROP CONSTRAINT IF EXISTS quote_messages_sender_type_check');
            
            // Drop columns
            $table->dropColumn(['sender_type', 'is_read', 'deleted_at']);
        });
    }
};
