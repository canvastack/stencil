<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('refund_processing_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('refund_id');
            $table->string('action'); // retry, process, complete, fail
            $table->string('status')->nullable(); // pending, success, failed
            $table->text('request_payload')->nullable();
            $table->text('response_payload')->nullable();
            $table->string('error_code')->nullable();
            $table->text('error_message')->nullable();
            $table->integer('attempt_number')->default(1);
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->foreign('refund_id')->references('id')->on('payment_refunds')->onDelete('cascade');
            $table->index(['refund_id', 'action']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('refund_processing_logs');
    }
};
