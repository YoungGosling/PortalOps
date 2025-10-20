'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { usePaymentSummary } from '@/providers/payment-summary-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Inbox,
  Building,
  Users,
  CreditCard,
  FileText,
  UserCheck,
  Archive,
  Settings,
  ChevronDown,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const { incompleteCount } = usePaymentSummary();
  const [adminOpen, setAdminOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const navItems = [
    {
      label: 'Dashboard',
      icon: BarChart3,
      path: '/',
      show: true,
    },
    {
      label: 'Inbox',
      icon: Inbox,
      path: '/inbox',
      show: isAdmin(),
    },
    {
      label: 'Service Inventory',
      icon: Building,
      path: '/services',
      show: true,
    },
    {
      label: 'Product Inventory',
      icon: FileText,
      path: '/products',
      show: true,
    },
    {
      label: 'Payment Register',
      icon: CreditCard,
      path: '/payments',
      show: true,
      badge: incompleteCount > 0 ? incompleteCount : undefined,
    },
    {
      label: 'User Directory',
      icon: Users,
      path: '/users',
      show: isAdmin(),
    },
  ];

  const adminItems = [
    {
      label: 'User Administration',
      icon: UserCheck,
      path: '/admin/permissions',
    },
    {
      label: 'Master Files',
      icon: Archive,
      path: '/admin/files',
    },
  ];

  const setupItems = [
    {
      label: 'System Configuration',
      icon: Settings,
      path: '/admin/config',
    },
  ];

  if (collapsed) {
    return (
      <aside className="w-14 border-r bg-gradient-to-b from-background to-muted/20 flex flex-col shadow-sm">
        <nav className="flex-1 p-2 space-y-1">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              const iconColors: Record<string, string> = {
                'Dashboard': 'text-primary',
                'Inbox': 'text-info',
                'Service Inventory': 'text-success',
                'Product Inventory': 'text-warning',
                'Payment Register': 'text-chart-5',
                'User Directory': 'text-chart-4',
              };
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive(item.path) ? 'secondary' : 'ghost'}
                    size="icon"
                    className={cn(
                      'w-10 h-10 relative transition-all duration-200',
                      isActive(item.path) && 'bg-gradient-to-br from-primary/20 to-info/20 shadow-sm',
                      !isActive(item.path) && 'hover:bg-primary/10'
                    )}
                    title={item.label}
                  >
                    <Icon className={cn('h-5 w-5', isActive(item.path) ? 'text-primary' : iconColors[item.label])} />
                    {item.badge && (
                      <Badge
                        variant="warning"
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] animate-pulse"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r bg-gradient-to-b from-background to-muted/20 flex flex-col shadow-sm">
      <nav className="flex-1 p-4 space-y-6">
        {/* Navigation Section */}
        <div className="space-y-1">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
            Navigation
          </h2>
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              const iconColors: Record<string, string> = {
                'Dashboard': 'text-primary',
                'Inbox': 'text-info',
                'Service Inventory': 'text-success',
                'Product Inventory': 'text-warning',
                'Payment Register': 'text-chart-5',
                'User Directory': 'text-chart-4',
              };
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive(item.path) ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3 transition-all duration-200',
                      isActive(item.path) && 'bg-gradient-to-r from-primary/20 to-info/20 shadow-sm border-l-2 border-primary',
                      !isActive(item.path) && 'hover:bg-primary/5 hover:border-l-2 hover:border-primary/50'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive(item.path) ? 'text-primary' : iconColors[item.label])} />
                    <span className={cn(isActive(item.path) && 'font-semibold')}>{item.label}</span>
                    {item.badge && (
                      <Badge variant="warning" className="ml-auto animate-pulse">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
        </div>

        {/* Administration Section (Admin Only) */}
        {isAdmin() && (
          <div className="space-y-1">
            <Collapsible open={adminOpen} onOpenChange={setAdminOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between gap-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-primary transition-colors px-2"
                >
                  <span>Administration</span>
                  {adminOpen ? (
                    <ChevronDown className="h-3 w-3 text-primary" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-2">
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  const adminIconColors: Record<string, string> = {
                    'User Administration': 'text-success',
                    'Master Files': 'text-warning',
                  };
                  return (
                    <Link key={item.path} href={item.path}>
                      <Button
                        variant={isActive(item.path) ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full justify-start gap-3 transition-all duration-200',
                          isActive(item.path) && 'bg-gradient-to-r from-primary/20 to-info/20 shadow-sm border-l-2 border-primary',
                          !isActive(item.path) && 'hover:bg-primary/5 hover:border-l-2 hover:border-primary/50'
                        )}
                      >
                        <Icon className={cn('h-4 w-4', isActive(item.path) ? 'text-primary' : adminIconColors[item.label])} />
                        <span className={cn('text-sm', isActive(item.path) && 'font-semibold')}>{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* System Setup Section (Admin Only) */}
        {/* {isAdmin() && (
          <div className="space-y-1">
            <Collapsible open={setupOpen} onOpenChange={setSetupOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between gap-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-primary transition-colors px-2"
                >
                  <span>System Setup</span>
                  {setupOpen ? (
                    <ChevronDown className="h-3 w-3 text-primary" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-2">
                {setupItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} href={item.path}>
                      <Button
                        variant={isActive(item.path) ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full justify-start gap-3 transition-all duration-200',
                          isActive(item.path) && 'bg-gradient-to-r from-primary/20 to-info/20 shadow-sm border-l-2 border-primary',
                          !isActive(item.path) && 'hover:bg-primary/5 hover:border-l-2 hover:border-primary/50'
                        )}
                      >
                        <Icon className={cn('h-4 w-4', isActive(item.path) ? 'text-primary' : 'text-info')} />
                        <span className={cn('text-sm', isActive(item.path) && 'font-semibold')}>{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )} */}
      </nav>
    </aside>
  );
}

