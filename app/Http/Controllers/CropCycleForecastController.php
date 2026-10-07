<?php

namespace App\Http\Controllers;

use App\Models\Planting;
use App\Services\CropCycleForecastService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CropCycleForecastController extends Controller
{
    public function index(Request $request, CropCycleForecastService $forecasts): JsonResponse
    {
        abort_unless(in_array($request->user()->role->value, ['member', 'staff'], true), 403);

        $defaultFrom = CarbonImmutable::today(config('app.timezone'))->startOfMonth();
        $input = [
            'from' => $request->query('from', $defaultFrom->toDateString()),
            'to' => $request->query('to'),
        ];
        $dates = Validator::make($input, [
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
        ])->validate();
        $rangeStart = CarbonImmutable::parse($dates['from'], config('garden.timezone'));
        $rangeEnd = isset($dates['to'])
            ? CarbonImmutable::parse($dates['to'], config('garden.timezone'))
            : $rangeStart->addDays(90);
        $rangeValidation = Validator::make([
            'from' => $dates['from'],
            'to' => $rangeEnd->toDateString(),
        ], [
            'to' => ['after_or_equal:from'],
        ]);
        $rangeValidation->after(function ($validator) use ($rangeStart, $rangeEnd): void {
            if ($rangeStart->diffInDays($rangeEnd) > 366) {
                $validator->errors()->add('to', 'The requested date range may not exceed 366 days.');
            }
        });
        $rangeValidation->validate();

        $query = Planting::query()
            ->with(['crop', 'assignment.gardenPlot', 'harvests'])
            ->whereHas('crop', fn ($crop) => $crop->whereNotNull('maturity_days_min')->whereNotNull('maturity_days_max'))
            // Validation caps maturity and harvest duration at 3650 days each.
            ->where('planted_at', '>=', $rangeStart->subDays(7300)->toDateString())
            ->where('planted_at', '<=', $rangeEnd->toDateString());

        if ($request->user()->role->value === 'member') {
            $query->whereHas('assignment', fn ($assignment) => $assignment->where('user_id', $request->user()->id));
        } else {
            $query->whereHas('assignment', fn ($assignment) => $assignment->where('status', 'active')
                ->whereHas('gardenPlot', fn ($plot) => $plot->whereNull('archived_at')));
        }

        $data = $forecasts->forPlantings($query->get(), $rangeStart, $rangeEnd);

        return response()->json([
            'data' => $data,
            'meta' => [
                'from' => $dates['from'],
                'to' => $rangeEnd->toDateString(),
                'generated_at' => now(config('garden.timezone'))->toIso8601String(),
                'timezone' => config('garden.timezone'),
            ],
        ]);
    }
}
