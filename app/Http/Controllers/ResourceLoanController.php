<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\ResourceLoan;
use App\Models\Resource;

class ResourceLoanController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'data' => ResourceLoan::with(['resource', 'borrower'])->orderBy('created_at', 'desc')->get()
        ]);
    }

    public function myLoans(Request $request)
    {
        return response()->json([
            'data' => ResourceLoan::with('resource')->where('borrower_id', auth()->id())->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'resource_id' => 'required|exists:resources,id',
            'quantity' => 'required|integer|min:1',
            'borrow_start' => 'required|date|after_or_equal:today',
            'borrow_end' => 'required|date|after_or_equal:borrow_start',
            'notes' => 'nullable|string',
        ]);
        
        $resource = Resource::findOrFail($request->resource_id);
        
        if ($resource->status !== 'available') {
            return response()->json(['message' => 'Resource is not available'], 422);
        }
        
        if ($request->quantity > $resource->available_quantity) {
            return response()->json(['message' => 'Requested quantity exceeds available'], 422);
        }
        
        $borrowDays = \Carbon\Carbon::parse($request->borrow_start)->diffInDays(\Carbon\Carbon::parse($request->borrow_end));
        if ($borrowDays > $resource->max_borrow_days) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => ['borrow_end' => ['Borrow duration exceeds maximum allowed days.']]
            ], 422);
        }
        
        $loan = ResourceLoan::create([
            'resource_id' => $resource->id,
            'borrower_id' => auth()->id(),
            'quantity' => $request->quantity,
            'status' => 'requested',
            'borrow_start' => $request->borrow_start,
            'borrow_end' => $request->borrow_end,
            'notes' => $request->notes,
        ]);
        
        return response()->json($loan, 201);
    }
    
    public function approve(Request $request, ResourceLoan $resourceLoan)
    {
        $resourceLoan->update([
            'status' => 'approved',
            'staff_notes' => $request->staff_notes
        ]);
        
        return response()->json($resourceLoan);
    }
    
    public function checkout(Request $request, ResourceLoan $resourceLoan)
    {
        $resource = $resourceLoan->resource;
        
        if ($resource->available_quantity < $resourceLoan->quantity) {
            return response()->json(['message' => 'Not enough inventory to checkout'], 422);
        }
        
        $resource->decrement('available_quantity', $resourceLoan->quantity);
        
        $resourceLoan->update([
            'status' => 'active',
            'checked_out_at' => now(),
            'checked_out_by' => auth()->id(),
        ]);
        
        return response()->json($resourceLoan);
    }
    
    public function checkin(Request $request, ResourceLoan $resourceLoan)
    {
        $request->validate([
            'return_condition' => 'required|string',
        ]);
        
        $resource = $resourceLoan->resource;
        $resource->increment('available_quantity', $resourceLoan->quantity);
        
        if ($request->return_condition === 'needs_repair') {
            $resource->update(['status' => 'maintenance', 'condition' => 'needs_repair']);
        }
        
        $resourceLoan->update([
            'status' => 'returned',
            'returned_at' => now(),
            'received_by' => auth()->id(),
            'return_condition' => $request->return_condition,
            'staff_notes' => $request->staff_notes,
        ]);
        
        return response()->json($resourceLoan);
    }
}
