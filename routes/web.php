<?php

use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\CalendarEventController;
use App\Http\Controllers\CommunityUpdateController;
use App\Http\Controllers\CropController;
use App\Http\Controllers\CropCycleForecastController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GardenPlotController;
use App\Http\Controllers\HelpController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PlantingController;
use App\Http\Controllers\PlotRequestController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\ResourceController;
use App\Http\Controllers\ResourceLoanController;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Route;

Route::get('/', function (): RedirectResponse {
    return redirect()->route(auth()->check() ? 'dashboard' : 'login');
})->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store'])->middleware('throttle:10,1');
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
    Route::get('/forgot-password', [PasswordResetController::class, 'request'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetController::class, 'send'])->middleware('throttle:5,1')->name('password.email');
    Route::get('/reset-password/{token}', [PasswordResetController::class, 'edit'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetController::class, 'update'])->middleware('throttle:10,1')->name('password.update');
});

Route::middleware(['auth', 'active'])->group(function () {
    Route::get('/verify-email', [EmailVerificationController::class, 'notice'])->name('verification.notice');
    Route::get('/verify-email/{id}/{hash}', [EmailVerificationController::class, 'verify'])->middleware(['signed', 'throttle:6,1'])->name('verification.verify');
    Route::post('/email/verification-notification', [EmailVerificationController::class, 'send'])->middleware('throttle:6,1')->name('verification.send');
    Route::get('/settings', [SettingsController::class, 'show'])->name('settings');
    Route::put('/settings/profile', [SettingsController::class, 'profile'])->name('settings.profile');
    Route::put('/settings/password', [SettingsController::class, 'password'])->name('settings.password');
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::middleware('verified')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('/api/garden-plots', [GardenPlotController::class, 'apiIndex'])->middleware('role:member,staff');
        Route::get('/api/garden-calendar/forecasts', [CropCycleForecastController::class, 'index'])->middleware('role:member,staff');
        Route::post('/api/plot-requests', [PlotRequestController::class, 'storeApi'])->middleware('role:member');
        
        // Resource Sharing API Routes
        Route::get('/api/resources', [ResourceController::class, 'index'])->middleware('role:admin,staff,member');
        Route::get('/api/resource-loans', [ResourceLoanController::class, 'index'])->middleware('role:staff');
        Route::get('/api/my-loans', [ResourceLoanController::class, 'myLoans'])->middleware('role:member,staff');
        Route::post('/api/resource-loans', [ResourceLoanController::class, 'store'])->middleware('role:staff,member');
        Route::post('/api/resource-loans/{resourceLoan}/approve', [ResourceLoanController::class, 'approve'])->middleware('role:staff');
        Route::post('/api/resource-loans/{resourceLoan}/checkout', [ResourceLoanController::class, 'checkout'])->middleware('role:staff');
        Route::post('/api/resource-loans/{resourceLoan}/return', [ResourceLoanController::class, 'checkin'])->middleware('role:staff');
        Route::get('/api/admin/resources/analytics', [ResourceController::class, 'analytics'])->middleware('role:admin');
        
        // Tool Shed Frontend Route
        Route::get('/tools', function () {
            return inertia('tools/index');
        })->middleware('role:admin,staff,member')->name('tools.index');
        Route::get('/garden-plots', [GardenPlotController::class, 'index'])->middleware('role:member,staff')->name('plots.index');
        Route::post('/garden-plots', [GardenPlotController::class, 'store'])->middleware('role:staff')->name('plots.store');
        Route::put('/garden-plots/{gardenPlot}', [GardenPlotController::class, 'update'])->middleware('role:staff')->name('plots.update');
        Route::post('/garden-plots/{gardenPlot}/archive', [GardenPlotController::class, 'archive'])->middleware('role:staff')->name('plots.archive');
        Route::get('/plot-requests', [PlotRequestController::class, 'index'])->middleware('role:member,staff')->name('requests.index');
        Route::post('/plot-requests', [PlotRequestController::class, 'store'])->name('requests.store');
        Route::post('/plot-requests/{plotRequest}/cancel', [PlotRequestController::class, 'cancel'])->name('requests.cancel');
        Route::post('/plot-requests/{plotRequest}/approve', [PlotRequestController::class, 'approve'])->middleware('role:staff')->name('requests.approve');
        Route::post('/plot-requests/{plotRequest}/reject', [PlotRequestController::class, 'reject'])->middleware('role:staff')->name('requests.reject');
        Route::get('/assignments', [AssignmentController::class, 'index'])->middleware('role:member,staff')->name('assignments.index');
        Route::post('/assignments', [AssignmentController::class, 'store'])->middleware('role:staff')->name('assignments.store');
        Route::put('/assignments/{assignment}', [AssignmentController::class, 'update'])->middleware('role:staff')->name('assignments.update');
        Route::post('/assignments/{assignment}/close', [AssignmentController::class, 'close'])->middleware('role:staff')->name('assignments.close');
        Route::post('/assignments/{assignment}/plantings', [PlantingController::class, 'store'])->middleware('role:member')->name('plantings.store');
        Route::get('/crops', [CropController::class, 'index'])->middleware('role:staff')->name('crops.index');
        Route::post('/crops', [CropController::class, 'store'])->middleware('role:staff')->name('crops.store');
        Route::put('/crops/{crop}', [CropController::class, 'update'])->middleware('role:staff')->name('crops.update');
        Route::get('/garden-calendar', [CalendarEventController::class, 'index'])->middleware('role:member,staff')->name('events.index');
        Route::post('/garden-calendar', [CalendarEventController::class, 'store'])->middleware('role:staff')->name('events.store');
        Route::put('/garden-calendar/{event}', [CalendarEventController::class, 'update'])->middleware('role:staff')->name('events.update');
        Route::post('/garden-calendar/{event}/publish', [CalendarEventController::class, 'publish'])->middleware('role:staff')->name('events.publish');
        Route::post('/garden-calendar/{event}/archive', [CalendarEventController::class, 'archive'])->middleware('role:staff')->name('events.archive');
        Route::get('/community-updates', [CommunityUpdateController::class, 'index'])->name('updates.index');
        Route::post('/community-updates', [CommunityUpdateController::class, 'store'])->name('updates.store');
        Route::put('/community-updates/{communityUpdate}', [CommunityUpdateController::class, 'update'])->name('updates.update');
        Route::post('/community-updates/{communityUpdate}/publish', [CommunityUpdateController::class, 'publish'])->name('updates.publish');
        Route::post('/community-updates/{communityUpdate}/archive', [CommunityUpdateController::class, 'archive'])->name('updates.archive');
        Route::get('/reports', [ReportController::class, 'index'])->middleware('role:admin')->name('reports.index');
        Route::get('/reports/export', [ReportController::class, 'export'])->middleware('role:admin')->name('reports.export');
        Route::get('/members', [MemberController::class, 'index'])->name('members.index');
        Route::put('/members/{user}', [MemberController::class, 'update'])->name('members.update');
        Route::get('/help', [HelpController::class, 'index'])->name('help');
        Route::post('/notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
        Route::post('/notifications/{notification}/read', [NotificationController::class, 'read'])->name('notifications.read');

        Route::prefix('member')->name('member.')->middleware('role:member')->group(function () {
            Route::get('/dashboard', [DashboardController::class, 'member'])->name('dashboard');
        });

        Route::prefix('staff')->name('staff.')->middleware('role:staff')->group(function () {
            Route::get('/dashboard', [DashboardController::class, 'staff'])->name('dashboard');
        });

        Route::prefix('admin')->name('admin.')->middleware('role:admin')->group(function () {
            Route::get('/dashboard', [DashboardController::class, 'admin'])->name('dashboard');
        });
    });
});
