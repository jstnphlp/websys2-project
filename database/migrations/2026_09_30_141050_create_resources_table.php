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
        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category', 100);
            $table->string('asset_tag', 50)->unique()->nullable();
            $table->text('description')->nullable();
            $table->string('condition', 50)->default('good');
            $table->integer('total_quantity')->default(1);
            $table->integer('available_quantity')->default(1);
            $table->integer('max_borrow_days')->default(3);
            $table->boolean('requires_deposit')->default(false);
            $table->decimal('deposit_amount', 8, 2)->nullable();
            $table->string('status', 50)->default('available');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index('category');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resources');
    }
};
