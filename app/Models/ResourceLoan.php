<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResourceLoan extends Model
{
    protected $fillable = [
        'resource_id',
        'borrower_id',
        'quantity',
        'status',
        'borrow_start',
        'borrow_end',
        'checked_out_at',
        'checked_out_by',
        'returned_at',
        'received_by',
        'initial_condition',
        'return_condition',
        'notes',
        'staff_notes',
    ];

    protected $casts = [
        'borrow_start' => 'date',
        'borrow_end' => 'date',
        'checked_out_at' => 'datetime',
        'returned_at' => 'datetime',
    ];

    public function resource()
    {
        return $this->belongsTo(Resource::class);
    }

    public function borrower()
    {
        return $this->belongsTo(User::class, 'borrower_id');
    }

    public function checkedOutBy()
    {
        return $this->belongsTo(User::class, 'checked_out_by');
    }

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by');
    }
}
