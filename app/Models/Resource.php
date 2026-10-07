<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Resource extends Model
{
    protected $fillable = [
        'name',
        'category',
        'asset_tag',
        'description',
        'condition',
        'total_quantity',
        'available_quantity',
        'max_borrow_days',
        'requires_deposit',
        'deposit_amount',
        'status',
        'created_by',
    ];

    protected $casts = [
        'requires_deposit' => 'boolean',
        'deposit_amount' => 'decimal:2',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function loans()
    {
        return $this->hasMany(ResourceLoan::class);
    }
}
