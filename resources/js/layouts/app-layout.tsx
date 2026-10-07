import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    CalendarDays,
    ChevronDown,
    CircleHelp,
    ClipboardList,
    FileChartColumn,
    LayoutDashboard,
    LogOut,
    Map,
    Megaphone,
    Menu,
    Settings,
    Sprout,
    UsersRound,
    Wrench,
} from 'lucide-react';
import { useEffect, useRef, useState, type PropsWithChildren, type ReactNode } from 'react';
import { SettingsModal } from '@/components/settings-modal';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { SharedPageProps, UserRole } from '@/types';

const navigationItems: Array<{
    label: string;
    memberLabel?: string;
    href: string;
    icon: typeof LayoutDashboard;
    roles: UserRole[];
}> = [
    { label: 'Garden plots', href: '/garden-plots', icon: Map, roles: ['member', 'staff'] },
    { label: 'Crops', href: '/crops', icon: Sprout, roles: ['staff'] },
    { label: 'Plot requests', memberLabel: 'My plot requests', href: '/plot-requests', icon: ClipboardList, roles: ['member', 'staff'] },
    { label: 'Assignments', memberLabel: 'My assignments', href: '/assignments', icon: Sprout, roles: ['member', 'staff'] },
    { label: 'Tool shed', href: '/tools', icon: Wrench, roles: ['member', 'staff', 'admin'] },
    { label: 'Garden calendar', href: '/garden-calendar', icon: CalendarDays, roles: ['member', 'staff'] },
    { label: 'Community updates', href: '/community-updates', icon: Megaphone, roles: ['member', 'staff', 'admin'] },
    { label: 'Reports', href: '/reports', icon: FileChartColumn, roles: ['admin'] },
    { label: 'Members', href: '/members', icon: UsersRound, roles: ['admin'] },
];

const utilityItems = [
    { label: 'Help center', href: '/help', icon: CircleHelp },
    { label: 'Settings', href: '/settings', icon: Settings },
];

const navItemClass = (active: boolean) => cn(
    'flex h-8 items-center gap-2 rounded-[10px] px-2 text-sm font-medium transition-[background-color,color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
    active
        ? 'bg-primary/[0.075] font-[650] text-foreground'
        : 'text-muted-foreground hover:bg-primary/[0.07] hover:text-foreground active:translate-x-px',
);

function AccountMenu({ onOpenSettings }: { onOpenSettings: () => void }) {
    const { auth } = usePage<SharedPageProps>().props;
    const user = auth.user!;
    const openingSettings = useRef(false);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex h-9 min-w-0 max-w-[188px] items-center gap-2 rounded-[9px] px-2 text-left transition-colors hover:bg-primary/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/[0.14] text-[9px] font-bold text-foreground">
                    {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                    <span className="truncate text-sm font-semibold tracking-[0.01em] text-muted-foreground">{user.name}</span>
                    <ChevronDown className="size-4 shrink-0 stroke-[1.8] text-muted-foreground" />
                </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={7} className="w-60 rounded-xl p-1.5" onCloseAutoFocus={event => {
                if (openingSettings.current) event.preventDefault();
                openingSettings.current = false;
            }}>
                <DropdownMenuLabel className="px-2 py-2">
                    <span className="block truncate">{user.name}</span>
                    <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => { openingSettings.current = true; onOpenSettings(); }} className="rounded-lg">
                    <Settings />Account settings
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg">
                    <Link href="/logout" method="post" as="button" className="w-full"><LogOut />Log out</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function Navigation({ onNavigate, onOpenSettings }: { onNavigate?: () => void; onOpenSettings: () => void }) {
    const { auth } = usePage<SharedPageProps>().props;
    const role = auth.user!.role;
    const currentUrl = usePage().url.split('?')[0];
    const dashboardHref = `/${role}/dashboard`;
    const isActive = (href: string) => currentUrl === href;

    return (
        <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2" aria-label="Primary navigation">
            <div className="space-y-0.5 px-1 py-2">
                <Link href={dashboardHref} onClick={onNavigate} className={navItemClass(isActive(dashboardHref))} aria-current={isActive(dashboardHref) ? 'page' : undefined}>
                    <LayoutDashboard className="size-4 shrink-0 stroke-[1.9]" />
                    <span className="truncate">Dashboard</span>
                </Link>
                {navigationItems.filter((item) => item.roles.includes(role)).map(({ label, memberLabel, href, icon: Icon }) => (
                    <Link key={href} href={href} onClick={onNavigate} className={navItemClass(isActive(href))} aria-current={isActive(href) ? 'page' : undefined}>
                        <Icon className="size-4 shrink-0 stroke-[1.9]" />
                        <span className="truncate">{role === 'member' && memberLabel ? memberLabel : label}</span>
                    </Link>
                ))}
            </div>

            <div className="min-h-2 flex-1" />

            <div className="space-y-0.5 px-1 py-2">
                {utilityItems.map(({ label, href, icon: Icon }) => href === '/settings' ? (
                    <button key={href} type="button" onClick={onOpenSettings} className={cn(navItemClass(currentUrl === href), 'w-full')} aria-haspopup="dialog">
                        <Icon className="size-4 shrink-0 stroke-[1.9]" />
                        <span>{label}</span>
                    </button>
                ) : (
                    <Link key={href} href={href} onClick={onNavigate} className={navItemClass(currentUrl === href)} aria-current={currentUrl === href ? 'page' : undefined}>
                        <Icon className="size-4 shrink-0 stroke-[1.9]" />
                        <span>{label}</span>
                    </Link>
                ))}
                <Link href="/logout" method="post" as="button" className={cn(navItemClass(false), 'w-full')}>
                    <LogOut className="size-4 shrink-0 stroke-[1.9]" />
                    <span>Log out</span>
                </Link>
            </div>

            <p className="shrink-0 px-6 pb-6 pt-1 text-[8px] leading-3 text-muted-foreground/60">© 2026 Community Garden</p>
        </nav>
    );
}

function SidebarContent({ onNavigate, onOpenSettings }: { onNavigate?: () => void; onOpenSettings: () => void }) {
    const { notifications } = usePage<SharedPageProps>().props;
    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex h-[52px] shrink-0 items-center justify-between gap-1 px-3 py-2">
                <AccountMenu onOpenSettings={onOpenSettings} />
                <DropdownMenu>
                    <DropdownMenuTrigger className="relative grid size-9 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-primary/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" aria-label={`${notifications.unreadCount} unread notifications`}>
                        <Bell className="size-5 stroke-[1.8]" />
                        {notifications.unreadCount > 0 && <span className="absolute right-0 top-0 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] text-white">{notifications.unreadCount}</span>}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 rounded-xl p-2">
                        <div className="flex items-center justify-between px-2 py-1"><strong className="text-sm">Notifications</strong>{notifications.unreadCount > 0 && <button className="text-xs text-primary underline" onClick={() => router.post('/notifications/read-all')}>Mark all read</button>}</div>
                        <DropdownMenuSeparator />
                        {notifications.items.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">You're all caught up.</p>}
                        {notifications.items.map((item) => <DropdownMenuItem key={item.id} onSelect={() => router.post(`/notifications/${item.id}/read`)} className="block rounded-lg p-2">
                            <span className={cn('block text-sm', !item.read && 'font-semibold')}>{item.message}</span><span className="text-xs text-muted-foreground">{item.created_at}</span>
                        </DropdownMenuItem>)}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Navigation onNavigate={onNavigate} onOpenSettings={onOpenSettings} />
        </div>
    );
}

export function AppLayout({ title, description, actions, children }: PropsWithChildren<{ title: string; description: string; actions?: ReactNode }>) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { url, props: { auth, flash } } = usePage<SharedPageProps>();
    const isSettingsPage = url.split('?')[0] === '/settings';
    const [settingsOpen, setSettingsOpen] = useState(isSettingsPage);
    const settingsOpener = useRef<HTMLElement | null>(null);
    const [visibleFlash, setVisibleFlash] = useState(flash);

    function openSettings() {
        settingsOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setMobileOpen(false);
        setSettingsOpen(true);
    }

    function closeSettings() {
        setSettingsOpen(false);
        if (isSettingsPage) router.get(`/${auth.user!.role}/dashboard`);
    }

    useEffect(() => {
        setVisibleFlash(flash);

        if (!flash.success && !flash.error) return;

        const timer = window.setTimeout(() => setVisibleFlash({}), 5000);
        return () => window.clearTimeout(timer);
    }, [flash]);

    return (
        <div className="h-dvh min-h-[480px] overflow-hidden bg-primary">
            <header className="fixed inset-x-0 top-0 z-40 flex h-12 items-center justify-between bg-primary px-5 text-primary-foreground">
                <img
                    src="/images/community-garden-logo.png"
                    alt="Community Garden"
                    className="size-7 object-contain"
                />
                <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
                    <DialogTrigger asChild>
                        <button type="button" className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 lg:hidden" aria-label="Open navigation">
                            <Menu className="size-5" />
                        </button>
                    </DialogTrigger>
                    <DialogContent className="left-0 top-[52px] h-[calc(100dvh-52px)] w-[min(88vw,256px)] max-w-none translate-x-0 translate-y-0 rounded-none rounded-tr-3xl border-y-0 border-l-0 bg-background p-0 shadow-2xl" showCloseButton={false} onCloseAutoFocus={event => { if (settingsOpen) event.preventDefault(); }}>
                        <DialogTitle className="sr-only">Navigation</DialogTitle>
                        <SidebarContent onNavigate={() => setMobileOpen(false)} onOpenSettings={openSettings} />
                    </DialogContent>
                </Dialog>
            </header>

            <div className="fixed inset-x-0 bottom-0 top-[52px] overflow-hidden rounded-t-3xl bg-background shadow-[0_-1px_0_rgba(255,255,255,0.04)]">
                <aside className="absolute inset-y-0 left-0 z-30 hidden w-64 border-r border-border/60 bg-background lg:block">
                    <SidebarContent onOpenSettings={openSettings} />
                </aside>

                <main className="app-scrollbar h-full overflow-y-auto overscroll-contain bg-background px-4 sm:px-6 lg:px-10 lg:pl-[296px]">
                    <div className="mx-auto flex min-h-[89px] w-full max-w-[1151px] flex-col justify-center gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
                        <div className="min-w-0 flex-1 sm:pr-4">
                            <h1 className="text-2xl font-[750] leading-[30px] tracking-[-0.01875em] text-foreground">{title}</h1>
                            <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
                        </div>
                        {actions && <div className="w-full shrink-0 sm:w-auto">{actions}</div>}
                    </div>
                    {(visibleFlash.success || visibleFlash.error) && <div role="status" className={cn('mx-auto mb-4 w-full max-w-[1151px] rounded-xl border px-4 py-3 text-sm', visibleFlash.error ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-primary/20 bg-primary/5')}>{visibleFlash.error ?? visibleFlash.success}</div>}
                    <div className="mx-auto w-full max-w-[1151px] animate-rise-in">{children}</div>
                </main>
            </div>
            {settingsOpen && <SettingsModal onClose={closeSettings} onRestoreFocus={() => {
                if (settingsOpener.current?.isConnected) settingsOpener.current.focus();
                else document.querySelector<HTMLButtonElement>('button[aria-label="Open navigation"]')?.focus();
            }} />}
        </div>
    );
}
