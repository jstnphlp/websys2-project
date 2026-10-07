import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, ClipboardList, FileChartColumn, Map, Megaphone, Sprout, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminToolAnalytics } from '@/components/admin-tool-analytics';
import { AppLayout } from '@/layouts/app-layout';
import type { SharedPageProps } from '@/types';

const gardenMetrics = [
    { key: 'plots', label: 'Garden plots', icon: Map },
    { key: 'available', label: 'Available plots', icon: Sprout },
    { key: 'pending', label: 'Pending requests', icon: ClipboardList },
    { key: 'assignments', label: 'Active assignments', icon: Sprout },
] as const;

const accountMetrics = [
    { key: 'members', label: 'Members' },
    { key: 'staff', label: 'Staff' },
    { key: 'suspended', label: 'Suspended' },
] as const;

export default function AdminDashboard({ metrics }: { metrics: Record<string, number> }) {
    const { auth } = usePage<SharedPageProps>().props;
    const firstName = auth.user?.name.trim().split(/\s+/)[0] || 'there';

    return (
        <>
            <Head title="Admin dashboard" />
            <AppLayout
                title={`Welcome, ${firstName}.`}
                description="Manage accounts and review garden activity."
                actions={(
                    <Button asChild className="w-full rounded-xl sm:w-auto">
                        <Link href="/reports"><FileChartColumn aria-hidden="true" />View reports</Link>
                    </Button>
                )}
            >
                <div className="space-y-8 pb-9">
                    <section aria-labelledby="garden-overview-title">
                        <h2 id="garden-overview-title" className="sr-only">Garden overview</h2>
                        <dl className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-[0_1px_3px_rgba(64,79,29,0.05)] sm:grid-cols-2 xl:grid-cols-4">
                            {gardenMetrics.map(({ key, label, icon: Icon }) => (
                                <div key={key} className="bg-card p-5 sm:p-6">
                                    <dt className="flex items-center gap-3 text-sm font-semibold">
                                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-primary"><Icon className="size-5" aria-hidden="true" /></span>
                                        {label}
                                    </dt>
                                    <dd className="mt-4 text-3xl font-[750] tracking-[-0.025em] tabular-nums">{metrics[key]}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <div className="grid items-start gap-8 lg:grid-cols-2">
                        <section aria-labelledby="members-title">
                            <h2 id="members-title" className="sr-only">Members and roles</h2>
                            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(64,79,29,0.05)]">
                                <div className="flex items-start gap-3 p-5 sm:p-6">
                                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-primary"><UsersRound className="size-5" aria-hidden="true" /></span>
                                    <div>
                                        <h3 className="text-sm font-bold">Account access</h3>
                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">Manage account access and staff roles.</p>
                                    </div>
                                </div>
                                <dl className="grid grid-cols-3 divide-x divide-border border-y border-border">
                                    {accountMetrics.map(({ key, label }) => (
                                        <div key={key} className="min-w-0 px-2 py-4 text-center sm:px-4">
                                            <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
                                            <dd className="mt-1 text-2xl font-bold tracking-[-0.025em] tabular-nums">{metrics[key]}</dd>
                                        </div>
                                    ))}
                                </dl>
                                <div className="p-5 sm:p-6">
                                    <Button asChild variant="outline" className="w-full rounded-xl sm:w-auto">
                                        <Link href="/members">Manage members<ArrowRight aria-hidden="true" /></Link>
                                    </Button>
                                </div>
                            </div>
                        </section>

                        <section aria-labelledby="updates-title">
                            <h2 id="updates-title" className="sr-only">Community updates</h2>
                            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(64,79,29,0.05)]">
                                <div className="flex items-start gap-3 p-5 sm:p-6">
                                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-primary"><Megaphone className="size-5" aria-hidden="true" /></span>
                                    <div>
                                        <h3 className="text-sm font-bold">Garden announcements</h3>
                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">Share important news with the garden community.</p>
                                    </div>
                                </div>
                                <Link href="/community-updates" className="group flex items-center justify-between gap-3 border-t border-border p-5 transition-colors hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 sm:p-6">
                                    <span className="text-sm font-semibold">View updates</span>
                                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
                                </Link>
                            </div>
                        </section>
                    </div>

                    <section className="pt-6 mt-8 border-t border-border" aria-labelledby="analytics-title">
                        <h2 id="analytics-title" className="sr-only">Resource analytics</h2>
                        <AdminToolAnalytics />
                    </section>
                </div>
            </AppLayout>
        </>
    );
}
