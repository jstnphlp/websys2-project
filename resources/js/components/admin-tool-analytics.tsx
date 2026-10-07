import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function AdminToolAnalytics() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await axios.get('/api/admin/resources/analytics');
            setAnalytics(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load analytics", error);
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>;
    if (!analytics) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold tracking-tight">Resource Utilization & Loss Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border/50 bg-card shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Fleet</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{analytics.total_tools}</div>
                    </CardContent>
                </Card>
                
                <Card className="border-border/50 bg-card shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Loans</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">{analytics.active_loans_count}</div>
                        <p className="text-xs text-muted-foreground mt-1">{analytics.utilization_rate_pct}% utilization rate</p>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Overdue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${analytics.overdue_loans_count > 0 ? 'text-destructive' : 'text-foreground'}`}>
                            {analytics.overdue_loans_count}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 bg-card shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Maintenance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-500">{analytics.maintenance_tools_count}</div>
                        <p className="text-xs text-muted-foreground mt-1">Tools needing repair</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle>Most Borrowed Categories</CardTitle>
                        <CardDescription>Top tool categories based on loan volume.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics.most_borrowed_categories.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No loan data available.</p>
                        ) : (
                            <div className="space-y-4">
                                {analytics.most_borrowed_categories.map((cat, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="font-medium">{cat.category}</div>
                                        <div className="text-sm font-bold bg-primary/10 text-primary px-2 py-1 rounded">
                                            {cat.loan_count} loans
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle>Loss & Damage Summary</CardTitle>
                        <CardDescription>Audit of damaged and retired equipment.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-muted/10">
                                <div>
                                    <div className="font-medium text-amber-500">Repairs Needed</div>
                                    <div className="text-xs text-muted-foreground">Items flagged as damaged during check-in</div>
                                </div>
                                <div className="text-xl font-bold">{analytics.loss_and_damage_summary.repair_needed_count}</div>
                            </div>
                            <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-muted/10">
                                <div>
                                    <div className="font-medium text-destructive">Retired / Lost</div>
                                    <div className="text-xs text-muted-foreground">Items permanently retired from circulation</div>
                                </div>
                                <div className="text-xl font-bold">{analytics.loss_and_damage_summary.retired_this_quarter}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
