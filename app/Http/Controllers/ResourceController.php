<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Resource;
use App\Models\ResourceLoan;

class ResourceController extends Controller
{
    public function index(Request $request)
    {
        $query = Resource::query();
        
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        } elseif (auth()->user()->role->value === 'member') {
            $query->where('status', 'available');
        }
        
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        
        return response()->json([
            'data' => $query->get()
        ]);
    }

    public function analytics()
    {
        $totalTools = Resource::sum('total_quantity');
        
        $activeLoansCount = ResourceLoan::where('status', 'active')->count();
        
        $utilizationRate = $totalTools > 0 ? round(($activeLoansCount / $totalTools) * 100, 1) : 0;
        
        $overdueLoansCount = ResourceLoan::where('status', 'overdue')
            ->orWhere(function ($q) {
                $q->where('status', 'active')
                  ->where('borrow_end', '<', now()->toDateString());
            })->count();
            
        $maintenanceToolsCount = Resource::where('status', 'maintenance')->sum('total_quantity');
        
        $mostBorrowedCategories = ResourceLoan::join('resources', 'resource_loans.resource_id', '=', 'resources.id')
            ->selectRaw('resources.category, count(*) as loan_count')
            ->groupBy('resources.category')
            ->orderByDesc('loan_count')
            ->limit(5)
            ->get();
            
        $lossAndDamage = [
            'repair_needed_count' => Resource::where('condition', 'needs_repair')->sum('total_quantity'),
            'retired_this_quarter' => Resource::where('status', 'retired')->sum('total_quantity'),
        ];
        
        return response()->json([
            'total_tools' => (int) $totalTools,
            'active_loans_count' => $activeLoansCount,
            'utilization_rate_pct' => $utilizationRate,
            'overdue_loans_count' => $overdueLoansCount,
            'maintenance_tools_count' => (int) $maintenanceToolsCount,
            'most_borrowed_categories' => $mostBorrowedCategories,
            'loss_and_damage_summary' => $lossAndDamage,
        ]);
    }
}
