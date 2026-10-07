<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user()?->only('id', 'name', 'email', 'role', 'email_verified_at'),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'notifications' => function () use ($request): array {
                $user = $request->user();

                if (! $user) {
                    return ['unreadCount' => 0, 'items' => []];
                }

                $notifications = $user->notifications()
                    ->select('notifications.*')
                    ->selectRaw('count(*) filter (where read_at is null) over () as unread_count')
                    ->latest()
                    ->limit(8)
                    ->get();

                return [
                    'unreadCount' => (int) ($notifications->first()?->unread_count ?? 0),
                    'items' => $notifications->map(fn ($item) => [
                        'id' => $item->id,
                        'message' => $item->data['message'] ?? 'Notification',
                        'url' => $item->data['url'] ?? '/dashboard',
                        'read' => $item->read_at !== null,
                        'created_at' => $item->created_at?->diffForHumans(),
                    ]),
                ];
            },
        ];
    }
}
