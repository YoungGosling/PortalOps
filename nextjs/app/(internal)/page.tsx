'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Building, CreditCard, Loader2, DollarSign, Inbox, Clock, UserPlus, Activity, CalendarClock } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { DashboardStats, RecentActivity, UpcomingRenewal, PendingTasksCount } from '@/types';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [renewals, setRenewals] = useState<UpcomingRenewal[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTasksCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Prevent retry if already errored
      if (error) return;
      
      try {
        setLoading(true);
        setError(false);
        
        // Fetch all data in parallel
        const [statsData, activitiesData, renewalsData, tasksData] = await Promise.all([
          apiClient.getDashboardStats(),
          apiClient.getRecentActivities(4),
          apiClient.getUpcomingRenewals(3),
          apiClient.getPendingTasksCount(),
        ]);
        
        setStats(statsData);
        setActivities(activitiesData);
        setRenewals(renewalsData);
        setPendingTasks(tasksData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError(true);
        toast.error('Failed to load dashboard data. Please sign in again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Here's what's happening with your enterprise services today.
        </p>
      </div>

      {/* Top Section: Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Services</CardTitle>
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950">
              <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalServices ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-green-600 dark:text-green-400">↗ 8.2%</span>
              <span>from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Products</CardTitle>
            <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-950">
              <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalProducts ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAdmin() ? 'All products' : 'Products in your services'}
            </p>
          </CardContent>
        </Card>

        {isAdmin() && (
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Users</CardTitle>
              <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalUsers ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span className="text-green-600 dark:text-green-400">↗ 12.5%</span>
                <span>from last month</span>
              </p>
            </CardContent>
          </Card>
        )}

        {isAdmin() && (
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Amount</CardTitle>
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950">
                <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${(stats?.totalAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total payment amounts
              </p>
            </CardContent>
          </Card>
        )}
      </div>

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
                    (stats?.incompletePayments ?? 0) > 0 
                      ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 shadow-md' 
                      : 'border-transparent bg-muted/30 hover:bg-muted/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={`p-3 rounded-full ${
                      (stats?.incompletePayments ?? 0) > 0 
                        ? 'bg-red-100 dark:bg-red-900/50' 
                        : 'bg-amber-100 dark:bg-amber-900/50'
                    }`}>
                      <CreditCard className={`h-5 w-5 ${
                        (stats?.incompletePayments ?? 0) > 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-amber-600 dark:text-amber-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-0.5">
                        View Payment
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Update payment information
                      </p>
                    </div>
                    {(stats?.incompletePayments ?? 0) > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold shadow-lg">
                        {stats?.incompletePayments}
                      </span>
                    )}
                  </div>
                </button>

                <button 
                  onClick={() => router.push('/users')}
                  className="p-4 rounded-xl border-2 border-transparent bg-muted/30 hover:bg-muted/50 hover:shadow-md transition-all duration-200 text-left"
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/50">
                      <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-0.5">
                        Add New User
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Create a new user account
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

