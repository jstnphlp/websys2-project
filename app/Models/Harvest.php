<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Harvest extends Model
{
    protected $fillable = ['planting_id', 'recorded_by', 'harvested_at', 'quantity_kg', 'notes'];

    public function planting(): BelongsTo
    {
        return $this->belongsTo(Planting::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    protected function casts(): array
    {
        return ['harvested_at' => 'date', 'quantity_kg' => 'decimal:2'];
    }
}
