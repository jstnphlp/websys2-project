import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    CircleCheck,
    Clock3,
    Sprout,
} from 'lucide-react';
import { RequestBadge, type RequestStatus } from '@/components/plot-request-status';
import { ToolCatalog } from '@/components/tool-catalog';
import { AppLayout } from '@/layouts/app-layout';
import type { SharedPageProps } from '@/types';

type Assignment = { id: number; start_date: string; garden_plot: { plot_code: string; location: string } };
type PlotRequest = { id: number; status: RequestStatus; created_at: string; garden_plot: { plot_code: string } | null };
type GardenEvent = { id: number; title: string; location: string | null; starts_at: string; ends_at: string };
type CommunityUpdate = { id: number; title: string; body: string; published_at: string | null };

function dateLabel(value: string) {
    return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeLabel(value: string) {
    return new Date(value).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}

export default function MemberDashboard({ assignment, requests, events, updates }: {
    assignment: Assignment | null;
    requests: PlotRequest[];
    events: GardenEvent[];
    updates: CommunityUpdate[];
}) {
    const { auth } = usePage<SharedPageProps>().props;
    const firstName = auth.user?.name.trim().split(/\s+/)[0] || 'there';
    const nextEvent = events[0];

    return (
        <>
            <Head title="Member dashboard" />
            <AppLayout
                title={`Welcome, ${firstName}.`}
                description="Here’s what’s happening with your plot and the community."
            >
                <div className="pb-9">
                    <section aria-labelledby="garden-overview-title">
                        <h2 id="garden-overview-title" className="sr-only">Your garden</h2>

                        <div className="grid gap-6 lg:h-[282px] lg:grid-cols-[330px_minmax(0,1fr)]">
                            <article className="relative flex min-h-[282px] flex-col overflow-hidden rounded-3xl border border-white/45 bg-[#e9ebdf]">
                                <div className="relative flex min-h-0 flex-1 items-center justify-center">
                                    <span className="absolute left-[18px] top-[18px] inline-flex h-7 items-center gap-1.5 rounded-full border border-primary/[0.08] bg-white/60 px-[11px] text-xs font-bold text-primary">
                                        <CircleCheck className="size-3.5" aria-hidden="true" />
                                        {assignment ? 'Active assignment' : 'Find a growing space'}
                                    </span>
                                    <span className="grid size-[138px] place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_28px_rgba(64,79,29,0.14)]">
                                        <Sprout className="size-12 stroke-[1.7]" aria-hidden="true" />
                                    </span>
                                </div>

                                <div className="flex h-[88px] items-end gap-2.5 p-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xl font-[760] leading-7 tracking-[-0.01em] text-foreground">{assignment ? `Plot ${assignment.garden_plot.plot_code}` : 'Your next plot'}</p>
                                        <p className="mt-0.5 truncate text-[13px] leading-5 text-muted-foreground">{assignment?.garden_plot.location ?? 'Explore available garden plots'}</p>
                                    </div>
                                    <Link href="/garden-calendar" aria-label="Open plot calendar" className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/[0.12] bg-white/60 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
                                        <CalendarDays className="size-[18px]" aria-hidden="true" />
                                    </Link>
                                    <Link href={assignment ? '/assignments' : '/garden-plots'} className="inline-flex h-10 items-center justify-center rounded-full border border-primary/[0.12] bg-white/60 px-[13px] text-sm font-semibold transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60">View</Link>
                                </div>
                            </article>

                            <article className="overflow-hidden rounded-3xl border border-primary/10 bg-white shadow-[0_8px_28px_rgba(64,79,29,0.055)]">
                                <div className="flex h-full min-h-[282px] flex-col px-6 py-[30px] sm:px-8">
                                    <div className="flex h-[26px] flex-wrap items-center gap-2.5">
                                        <span className="inline-flex h-[26px] items-center gap-1.5 rounded-full bg-primary/[0.08] px-[11px] text-xs font-bold text-primary">
                                            <CircleCheck className="size-3.5" aria-hidden="true" />
                                            {assignment ? 'Your plot is active' : 'Your garden journey'}
                                        </span>
                                        <span className="text-xs font-medium text-muted-foreground">{new Date().getFullYear()} growing season</span>
                                    </div>
                                    <h3 className="mt-[23px] max-w-[520px] text-[30px] font-[760] leading-9 tracking-[-0.026em] text-foreground">{assignment ? 'Your plot is ready for the week.' : 'Find a plot to call your own.'}</h3>
                                    <p className="mt-2.5 max-w-[530px] text-sm leading-[22px] text-muted-foreground">{assignment ? `Plot ${assignment.garden_plot.plot_code} in ${assignment.garden_plot.location} is assigned to you.${nextEvent ? ` Your next garden event is ${nextEvent.title} on ${dateLabel(nextEvent.starts_at)}.` : ''}` : 'Browse available plots and submit a request to the garden team.'}</p>
                                    <div className="mt-auto flex flex-col gap-2 pt-[22px] sm:flex-row">
                                        <Link href={assignment ? `/assignments?status=active&plant=${assignment.id}` : '/garden-plots'} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-[15px] text-sm font-semibold text-primary-foreground shadow-[0_2px_6px_rgba(64,79,29,0.16)] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[#354318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
                                            {assignment ? 'Add planting' : 'Browse garden plots'}<ArrowRight className="size-4" aria-hidden="true" />
                                        </Link>
                                        <Link href={assignment ? '/assignments' : '/garden-calendar'} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-[15px] text-sm font-semibold text-primary transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
                                            {assignment ? <Sprout className="size-4" aria-hidden="true" /> : <CalendarDays className="size-4" aria-hidden="true" />}{assignment ? 'View plot details' : 'Open calendar'}
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </section>

                    <section className="mt-[34px]" aria-labelledby="week-title">
                        <h2 id="week-title" className="sr-only">This week</h2>

                        <div className="grid gap-6 lg:h-[300px] lg:grid-cols-2">
                            <article className="overflow-hidden rounded-3xl border border-primary/10 bg-white p-[22px] shadow-[0_4px_16px_rgba(64,79,29,0.03)]">
                                <div className="flex h-7 items-center justify-between">
                                    <h3 className="text-base font-[750] leading-6 tracking-[0.003em] text-foreground">Upcoming schedule</h3>
                                    <Link href="/garden-calendar" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">View all</Link>
                                </div>
                                <div className="mt-3">
                                    {events.length ? events.map((item) => (
                                        <Link key={item.id} href="/garden-calendar" className="group grid min-h-[73px] grid-cols-[52px_minmax(0,1fr)] items-center gap-3.5 border-t border-primary/[0.08] first:border-t-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50">
                                            <span className="flex h-[50px] w-[52px] flex-col items-center justify-center rounded-[13px] bg-[#f3f1ea]" aria-hidden="true">
                                                <span className="text-[10px] font-extrabold tracking-[0.08em] text-muted-foreground">{new Date(item.starts_at).toLocaleDateString('en-PH', { month: 'short' }).toUpperCase()}</span>
                                                <span className="text-lg font-[760] leading-5 text-foreground">{new Date(item.starts_at).getDate()}</span>
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-bold text-foreground">{item.title}</span>
                                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{timeLabel(item.starts_at)}–{timeLabel(item.ends_at)} · {item.location ?? 'Location to be announced'}</span>
                                            </span>
                                        </Link>
                                    )) : <p className="border-t border-primary/[0.08] py-5 text-sm text-muted-foreground">No upcoming events yet.</p>}
                                </div>
                            </article>

                            <article className="overflow-hidden rounded-3xl border border-primary/10 bg-white p-[22px] shadow-[0_4px_16px_rgba(64,79,29,0.03)]">
                                <div className="flex h-7 items-center justify-between">
                                    <h3 className="text-base font-[750] leading-6 tracking-[0.003em] text-foreground">Garden updates</h3>
                                    <Link href="/community-updates" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">See all</Link>
                                </div>
                                <div className="mt-3">
                                    {updates.length ? updates.map((item) => (
                                        <article key={item.id} className="border-t border-primary/[0.08] py-4 first:border-t-0">
                                            <p className="text-sm font-bold text-foreground">{item.title}</p>
                                            <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-muted-foreground">{item.body}</p>
                                            {item.published_at && <p className="mt-[7px] flex items-center gap-1.5 text-[11px] text-muted-foreground/75"><Clock3 className="size-3" aria-hidden="true" />{dateLabel(item.published_at)}</p>}
                                        </article>
                                    )) : <p className="border-t border-primary/[0.08] py-5 text-sm text-muted-foreground">No published updates yet.</p>}
                                </div>
                            </article>
                        </div>
                    </section>

                    <section className="mt-[34px]" aria-labelledby="activity-title">
                        <h2 id="activity-title" className="sr-only">Recent activity</h2>
                        <div className="overflow-hidden rounded-3xl border border-primary/10 bg-white px-[22px] py-1 shadow-[0_4px_16px_rgba(64,79,29,0.03)]">
                            {requests.length ? requests.map((item) => (
                                    <Link key={item.id} href="/plot-requests" className="grid min-h-[72px] grid-cols-[minmax(0,1fr)_auto] items-center gap-6 border-t border-primary/[0.08] py-3.5 first:border-t-0">
                                        <div className="flex min-w-0 items-center gap-3.5">
                                            <span className="grid size-[38px] shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-primary"><CircleCheck className="size-4" aria-hidden="true" /></span>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold leading-5 text-foreground">Request for {item.garden_plot?.plot_code ?? 'a garden plot'}</p>
                                                <p className="mt-0.5 text-xs leading-[18px] text-muted-foreground">Submitted {dateLabel(item.created_at)}</p>
                                            </div>
                                        </div>
                                        <RequestBadge status={item.status} />
                                    </Link>
                            )) : <p className="py-5 text-sm text-muted-foreground">Your plot requests will appear here.</p>}
                        </div>
                    </section>

                    <section className="mt-[34px]" aria-labelledby="tools-title">
                        <h2 id="tools-title" className="sr-only">Community tools</h2>
                        <div className="overflow-hidden rounded-3xl border border-primary/10 bg-white p-[22px] shadow-[0_4px_16px_rgba(64,79,29,0.03)]">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-base font-[750] leading-6 tracking-[0.003em] text-foreground">Community Tool Shed</h3>
                            </div>
                            <ToolCatalog />
                        </div>
                    </section>
                </div>
            </AppLayout>
        </>
    );
}
