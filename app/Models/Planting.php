<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Planting extends Model
{
    use HasFactory;

    protected $fillable = ['plot_assignment_id', 'crop_id', 'planted_at'];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(PlotAssignment::class, 'plot_assignment_id');
    }

    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }

    public function harvests(): HasMany
    {
        return $this->hasMany(Harvest::class);
    }

    protected function casts(): array
    {
        return ['planted_at' => 'date'];
    }
}
