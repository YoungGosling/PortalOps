'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, CreditCard, Loader2, DollarSign, Inbox, Activity, Calendar, Users, Building } from 'lucide-react';
import { fetchDashboardStatsAction } from '@/api/dashboard/stats/action';
import { fetchRecentActivitiesAction } from '@/api/dashboard/recent-activities/action';
import { fetchUpcomingRenewalsAction } from '@/api/dashboard/upcoming-renewals/action';
import { fetchPendingTasksCountAction } from '@/api/dashboard/pending-tasks-count/action';
import { fetchCurrencyStatsAction } from '@/api/dashboard/currency-stats/action';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { RecentActivity, UpcomingRenewal, PendingTasksCount } from '@/types';
import type { CurrencyStats } from '@/api/dashboard/currency-stats/model';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [renewals, setRenewals] = useState<UpcomingRenewal[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTasksCount | null>(null);
  const [incompletePayments, setIncompletePayments] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const hasFetchedRef = useRef(false);
  
  // Currency stats states
  const [hkdStats, setHkdStats] = useState<CurrencyStats>({ totalAmount: 0, currencyCode: 'HKD', currencySymbol: 'HK$' });
  const [usdStats, setUsdStats] = useState<CurrencyStats>({ totalAmount: 0, currencyCode: 'USD', currencySymbol: '$' });
  const [eurStats, setEurStats] = useState<CurrencyStats>({ totalAmount: 0, currencyCode: 'EUR', currencySymbol: '€' });
  const [currencyLoading, setCurrencyLoading] = useState(false);
  
  // Date filter states
  const [datePreset, setDatePreset] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Function to calculate date range based on preset
  const getDateRange = (preset: string): { start?: string; end?: string } => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    
    switch (preset) {
      case 'year': {
        // This year: Jan 1 to Dec 31 of current year
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31);
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        };
      }
      case 'quarter': {
        // This quarter
        const quarterStartMonth = Math.floor(month / 3) * 3;
        const start = new Date(year, quarterStartMonth, 1);
        const end = new Date(year, quarterStartMonth + 3, 0); // Last day of quarter
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        };
      }
      case 'month': {
        // This month
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0); // Last day of month
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        };
      }
      case 'custom': {
        return {
          start: customStartDate || undefined,
          end: customEndDate || undefined,
        };
      }
      default:
        return {};
    }
  };

  // Function to fetch currency stats
  const fetchAllCurrencyStats = async () => {
    if (!isAdmin()) return;
    
    try {
      setCurrencyLoading(true);
      const dateRange = getDateRange(datePreset);
      
      const [hkd, usd, eur] = await Promise.all([
        fetchCurrencyStatsAction('HKD', dateRange.start, dateRange.end),
        fetchCurrencyStatsAction('USD', dateRange.start, dateRange.end),
        fetchCurrencyStatsAction('EUR', dateRange.start, dateRange.end),
      ]);
      
      setHkdStats(hkd);
      setUsdStats(usd);
      setEurStats(eur);
    } catch (error) {
      console.error('Failed to fetch currency stats:', error);
      toast.error('Failed to load currency statistics');
    } finally {
      setCurrencyLoading(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Prevent retry if already errored or already fetched
      if (error || hasFetchedRef.current) return;
      
      // Only fetch if user exists
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(false);
        
        // Fetch all data in parallel
        const [statsData, activitiesData, renewalsData, tasksData] = await Promise.all([
          fetchDashboardStatsAction(),
          fetchRecentActivitiesAction(4),
          fetchUpcomingRenewalsAction(3),
          fetchPendingTasksCountAction(),
        ]);
        
        // Only extract incomplete payments count from stats
        setIncompletePayments(statsData.incompletePayments || 0);
        
        // Extract activities array - backend already returns camelCase format
        setActivities(activitiesData.map((activity) => ({
          id: activity.id,
          action: activity.action,
          actorName: activity.actorName,
          targetId: activity.targetId ?? undefined,
          details: activity.details,
          createdAt: activity.createdAt,
        })));
        
        // Extract renewals array - backend already returns correct format
        setRenewals(renewalsData.map((renewal) => ({
          productId: renewal.productId,
          productName: renewal.productName,
          serviceName: renewal.serviceName,
          expiryDate: renewal.expiryDate,
          amount: renewal.amount ?? undefined,
          cardholderName: renewal.cardholderName ?? undefined,
          paymentMethod: renewal.paymentMethod ?? undefined,
        })));
        
        // Set pending tasks data
        setPendingTasks({
          pendingCount: tasksData.pendingCount,
        });
        hasFetchedRef.current = true; // Mark as fetched
        
        // Fetch currency stats if admin
        if (isAdmin()) {
          fetchAllCurrencyStats();
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError(true);
        toast.error('Failed to load dashboard data. Please sign in again.');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch once when user is available
    if (user && !hasFetchedRef.current) {
      fetchDashboardData();
    }
  }, [user]); // Depend on user object but with hasFetchedRef guard
  
  // Refetch currency stats when date preset changes
  useEffect(() => {
    if (hasFetchedRef.current && isAdmin()) {
      fetchAllCurrencyStats();
    }
  }, [datePreset, customStartDate, customEndDate]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome to PortalOps - Enterprise Service Management
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Here's what's happening with your enterprise services today.
          </p>
        </div>

        {/* Date Filter Section - Only for Admin */}
        {isAdmin() && (
          <div className="flex flex-wrap items-end gap-3 min-w-fit">
            <div className="min-w-[200px] space-y-2">
              <Label htmlFor="date-preset">Payment Statistics Filter</Label>
              <Select value={datePreset} onValueChange={setDatePreset}>
                <SelectTrigger id="date-preset">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {datePreset === 'custom' && (
              <>
                <div className="min-w-[150px] space-y-2">
                  <Label htmlFor="custom-start">Start Date</Label>
                  <Input
                    id="custom-start"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    disabled={currencyLoading}
                  />
                </div>
                <div className="min-w-[150px] space-y-2">
                  <Label htmlFor="custom-end">End Date</Label>
                  <Input
                    id="custom-end"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    disabled={currencyLoading}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>


      {/* Currency Cards - Only for Admin */}
      {isAdmin() && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* HKD Card */}
          <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Hong Kong Dollar
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              {currencyLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {hkdStats.currencySymbol || 'HK$'} {hkdStats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {hkdStats.currencyCode} Total
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* USD Card */}
          <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                US Dollar
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              {currencyLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {usdStats.currencySymbol || '$'} {usdStats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {usdStats.currencyCode} Total
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* EUR Card */}
          <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Euro
              </CardTitle>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950">
                <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              {currencyLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {eurStats.currencySymbol || '€'} {eurStats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {eurStats.currencyCode} Total
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Middle Section: Recent Activity and Upcoming Renewals */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <CardDescription className="text-xs">
              Latest system activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activities</p>
              ) : (
                activities.map((activity) => {
                  const timeAgo = (() => {
                    const date = new Date(activity.createdAt);
                    const now = new Date();
                    const diff = now.getTime() - date.getTime();
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const days = Math.floor(hours / 24);
                    
                    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
                    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                    return 'Just now';
                  })();

                  return (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                      <div className="mt-0.5 p-1.5 rounded-full bg-primary/10">
                        {activity.action.includes('user') ? (
                          <Users className="h-3.5 w-3.5 text-primary" />
                        ) : activity.action.includes('payment') ? (
                          <CreditCard className="h-3.5 w-3.5 text-primary" />
                        ) : activity.action.includes('service') ? (
                          <Building className="h-3.5 w-3.5 text-primary" />
                        ) : activity.action.includes('product') ? (
                          <BarChart3 className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Activity className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.action.includes('user') && activity.action.includes('create')
                            ? `New user ${activity.actorName} was added to the system`
                            : activity.action.includes('workflow') && activity.action.includes('complete')
                            ? `Onboarding task for ${activity.actorName} completed`
                            : activity.action.includes('service') && activity.action.includes('create')
                            ? `New service ${activity.targetId || ''} was added to inventory`
                            : activity.action.includes('payment')
                            ? `Payment info updated successfully`
                            : activity.action.replace(/_/g, ' ').replace('.', ' - ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {timeAgo} • by {activity.actorName}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Upcoming Renewals</CardTitle>
            <CardDescription className="text-xs">
              Services requiring payment renewal
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2.5">
              {renewals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No upcoming renewals</p>
              ) : (
                renewals.map((renewal) => {
                  const expiryDate = new Date(renewal.expiryDate);
                  const now = new Date();
                  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  const isDueSoon = daysUntilExpiry <= 30;

                  return (
                    <div key={renewal.productId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 space-y-0.5">
                        <p className="font-semibold text-sm">{renewal.productName}</p>
                        <p className="text-xs text-muted-foreground">Due: {renewal.expiryDate}</p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        {renewal.amount && (
                          <span className="text-base font-bold">${renewal.amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          isDueSoon 
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' 
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                        }`}>
                          {isDueSoon ? 'Due Soon' : 'Upcoming'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          <CardDescription className="text-xs">
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid gap-3 md:grid-cols-3">
            {isAdmin() && (
              <>
                <button 
                  onClick={() => router.push('/inbox')}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    (pendingTasks?.pendingCount ?? 0) > 0 
                      ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 shadow-md' 
                      : 'border-transparent bg-muted/30 hover:bg-muted/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={`p-3 rounded-full ${
                      (pendingTasks?.pendingCount ?? 0) > 0 
                        ? 'bg-red-100 dark:bg-red-900/50' 
                        : 'bg-blue-100 dark:bg-blue-900/50'
                    }`}>
                      <Inbox className={`h-5 w-5 ${
                        (pendingTasks?.pendingCount ?? 0) > 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-blue-600 dark:text-blue-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-0.5">
                        View Inbox
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Check pending workflow tasks
                      </p>
                    </div>
                    {(pendingTasks?.pendingCount ?? 0) > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold shadow-lg">
                        {pendingTasks?.pendingCount}
                      </span>
                    )}
                  </div>
                </button>

                <button 
                  onClick={() => router.push('/payments')}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    incompletePayments > 0 
                      ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 shadow-md' 
                      : 'border-transparent bg-muted/30 hover:bg-muted/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={`p-3 rounded-full ${
                      incompletePayments > 0 
                        ? 'bg-red-100 dark:bg-red-900/50' 
                        : 'bg-amber-100 dark:bg-amber-900/50'
                    }`}>
                      <CreditCard className={`h-5 w-5 ${
                        incompletePayments > 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-amber-600 dark:text-amber-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-0.5">
                        Renew Payment
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Complete pending renewals
                      </p>
                    </div>
                    {incompletePayments > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold shadow-lg">
                        {incompletePayments}
                      </span>
                    )}
                  </div>
                </button>

                <button 
                  onClick={() => router.push('/products')}
                  className="p-4 rounded-xl border-2 border-transparent bg-muted/30 hover:bg-muted/50 hover:shadow-md transition-all duration-200 text-left"
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/50">
                      <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-0.5">
                        View Product
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Browse product inventory
                      </p>
                    </div>
                  </div>
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

