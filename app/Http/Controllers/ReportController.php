<?php

namespace App\Http\Controllers;

use App\Models\GardenPlot;
use App\Models\Harvest;
use App\Models\PlotAssignment;
use App\Models\PlotRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        [$from, $to] = $this->range($request);

        return Inertia::render('reports', [
            'filters' => ['from' => $from, 'to' => $to],
            'metrics' => [
                'totalPlots' => GardenPlot::whereNull('archived_at')->count(), 'occupiedPlots' => GardenPlot::whereNull('archived_at')->where('status', 'occupied')->count(),
                'pendingRequests' => PlotRequest::where('status', 'pending')->count(), 'activeAssignments' => PlotAssignment::where('status', 'active')->count(),
                'activeMembers' => User::where('role', 'member')->where('is_active', true)->count(),
            ],
            'requestBreakdown' => PlotRequest::whereBetween('created_at', [$from, $to.' 23:59:59'])->selectRaw('status, count(*) as total')->groupBy('status')->get(),
            'assignmentBreakdown' => PlotAssignment::whereBetween('created_at', [$from, $to.' 23:59:59'])->selectRaw('status, count(*) as total')->groupBy('status')->get(),
            'harvestBreakdown' => Harvest::join('plantings', 'plantings.id', '=', 'harvests.planting_id')->join('crops', 'crops.id', '=', 'plantings.crop_id')
                ->whereBetween('harvests.harvested_at', [$from, $to])->selectRaw('crops.name as crop, count(*) as harvests, sum(harvests.quantity_kg) as total_kg')
                ->groupBy('crops.name')->orderByDesc('total_kg')->get()
                ->map(fn ($row) => ['crop' => $row->crop, 'harvests' => (int) $row->harvests, 'total_kg' => round((float) $row->total_kg, 2)]),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $this->requireAdmin($request);
        [$from, $to] = $this->range($request);

        return response()->streamDownload(function () use ($from, $to) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Request ID', 'Member', 'Plot', 'Status', 'Submitted']);
            PlotRequest::with(['user', 'gardenPlot'])->whereBetween('created_at', [$from, $to.' 23:59:59'])->orderBy('id')->each(fn ($item) => fputcsv($out, [$item->id, $this->csvText($item->user->name), $this->csvText($item->gardenPlot?->plot_code), $item->status->value, $item->created_at->toDateString()]));
            fputcsv($out, []);
            fputcsv($out, ['Assignment ID', 'Member', 'Plot', 'Status', 'Start date', 'End date']);
            PlotAssignment::with(['user', 'gardenPlot'])->whereBetween('created_at', [$from, $to.' 23:59:59'])->orderBy('id')->each(fn ($item) => fputcsv($out, [$item->id, $this->csvText($item->user->name), $this->csvText($item->gardenPlot->plot_code), $item->status->value, $item->start_date->toDateString(), $item->end_date?->toDateString()]));
            fputcsv($out, []);
            fputcsv($out, ['Harvest ID', 'Member', 'Plot', 'Crop', 'Harvested', 'Quantity (kg)']);
            Harvest::with(['planting.crop', 'planting.assignment.user', 'planting.assignment.gardenPlot'])->whereBetween('harvested_at', [$from, $to])->orderBy('harvested_at')->orderBy('id')->each(fn ($item) => fputcsv($out, [$item->id, $this->csvText($item->planting->assignment->user->name), $this->csvText($item->planting->assignment->gardenPlot->plot_code), $this->csvText($item->planting->crop->name), $item->harvested_at->toDateString(), $item->quantity_kg]));
            fclose($out);
        }, "garden-report-{$from}-{$to}.csv", ['Content-Type' => 'text/csv']);
    }

    private function range(Request $request): array
    {
        $request->merge(['from' => $request->input('from') ?: now()->subDays(29)->toDateString(), 'to' => $request->input('to') ?: now()->toDateString()]);
        $data = $request->validate(['from' => ['required', 'date_format:Y-m-d'], 'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from']]);

        return [$data['from'], $data['to']];
    }

    private function csvText(?string $value): string
    {
        $value ??= '';

        return preg_match('/^[\s]*[=+\-@]|^[\t\r\n]/u', $value) ? "'".$value : $value;
    }
}
