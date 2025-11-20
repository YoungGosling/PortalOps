'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Shield, DollarSign, Loader2, Calendar } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { fetchCurrencyStatsAction } from '@/api/dashboard/currency-stats/action';
import type { CurrencyStats } from '@/api/dashboard/currency-stats/model';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hkdStats, setHkdStats] = useState<CurrencyStats>({ totalAmount: 0, currencyCode: 'HKD', currencySymbol: 'HK$' });
  const [usdStats, setUsdStats] = useState<CurrencyStats>({ totalAmount: 0, currencyCode: 'USD', currencySymbol: '$' });
  const [eurStats, setEurStats] = useState<CurrencyStats>({ totalAmount: 0, currencyCode: 'EUR', currencySymbol: '€' });

  const fetchAllCurrencyStats = async (start?: string, end?: string) => {
    try {
      setLoading(true);
      const [hkd, usd, eur] = await Promise.all([
        fetchCurrencyStatsAction('HKD', start, end),
        fetchCurrencyStatsAction('USD', start, end),
        fetchCurrencyStatsAction('EUR', start, end),
      ]);
      setHkdStats(hkd);
      setUsdStats(usd);
      setEurStats(eur);
    } catch (error) {
      toast.error('Failed to load currency statistics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchAllCurrencyStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    // Validate date range
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      toast.error('End date must be greater than or equal to start date');
      return;
    }
    fetchAllCurrencyStats(startDate || undefined, endDate || undefined);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    fetchAllCurrencyStats();
  };

  if (!isAdmin()) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-sm text-muted-foreground">
            Only administrators can access this page
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
        <p className="text-muted-foreground">
          Payment statistics by currency with date filtering
        </p>
      </div>

      {/* Date Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleApplyFilters} 
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Apply Filters'
                )}
              </Button>
              <Button 
                onClick={handleClearFilters} 
                variant="outline"
                disabled={loading}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* HKD Card */}
        <Card className="relative overflow-hidden">
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
            <div className="text-2xl font-bold">
              {hkdStats.currencySymbol || 'HK$'} {hkdStats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {hkdStats.currencyCode} Total
            </p>
          </CardContent>
        </Card>

        {/* USD Card */}
        <Card className="relative overflow-hidden">
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
            <div className="text-2xl font-bold">
              {usdStats.currencySymbol || '$'} {usdStats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {usdStats.currencyCode} Total
            </p>
          </CardContent>
        </Card>

        {/* EUR Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Euro
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950">
              <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {eurStats.currencySymbol || '€'} {eurStats.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {eurStats.currencyCode} Total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This dashboard displays the total payment amounts grouped by currency. 
            Use the date filters above to view statistics for specific time periods.
            Date filtering is applied based on the payment date field.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
