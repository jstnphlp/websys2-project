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
        Schema::create('resource_loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resource_id')->constrained('resources')->cascadeOnDelete();
            $table->foreignId('borrower_id')->constrained('users')->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            $table->string('status', 50)->default('requested');
            $table->date('borrow_start');
            $table->date('borrow_end');
            $table->timestamp('checked_out_at')->nullable();
            $table->foreignId('checked_out_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('returned_at')->nullable();
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('initial_condition', 50)->nullable();
            $table->string('return_condition', 50)->nullable();
            $table->text('notes')->nullable();
            $table->text('staff_notes')->nullable();
            $table->timestamps();

            $table->index('borrower_id');
            $table->index('resource_id');
            $table->index('status');
            $table->index(['borrow_start', 'borrow_end']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resource_loans');
    }
};
