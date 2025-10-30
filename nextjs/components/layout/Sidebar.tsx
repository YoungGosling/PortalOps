'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
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
  Settings,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Building2,
  Tag,
  Wallet,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SidebarProps {
  collapsed: boolean;
}

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  show: boolean;
  badge?: number;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  
  // Initialize adminOpen from localStorage or check if current path is admin
  const [adminOpen, setAdminOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebar-admin-open');
      if (stored !== null) {
        return stored === 'true';
      }
      // Auto-open if current path is an admin route
      return pathname.startsWith('/admin');
    }
    return false;
  });
  
  const [setupOpen, setSetupOpen] = useState(false);

  // Persist adminOpen state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-admin-open', String(adminOpen));
    }
  }, [adminOpen]);

  // Auto-open administration section if navigating to an admin route
  useEffect(() => {
    if (pathname.startsWith('/admin') && !adminOpen) {
      setAdminOpen(true);
    }
  }, [pathname, adminOpen]);

  const isActive = (path: string) => pathname === path;

  const navItems: NavItem[] = [
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
      label: 'Service Provider',
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
    },
    {
      label: 'Employee Directory',
      icon: Users,
      path: '/users',
      show: isAdmin(),
    },
  ];

  const adminItems = [
    {
      label: 'Deparment Master',
      icon: Building2,
      path: '/admin/departments',
    },
    {
      label: 'Product Master',
      icon: Tag,
      path: '/admin/product-statuses',
    },
    {
      label: 'Payment Master',
      icon: Wallet,
      path: '/admin/payment-methods',
    },
    // {
    //   label: 'User Administration',
    //   icon: UserCheck,
    //   path: '/admin/permissions',
    // },
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
                'Service Provider': 'text-success',
                'Product Inventory': 'text-warning',
                'Payment Register': 'text-chart-5',
                'Employee Directory': 'text-chart-4',
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
                'Service Provider': 'text-success',
                'Product Inventory': 'text-warning',
                'Payment Register': 'text-chart-5',
                'Employee Directory': 'text-chart-4',
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
                    'Dept Master File': 'dark:text-blue-400',
                    'Prod Master File': 'dark:text-blue-400',
                    'Payt Master File': 'dark:text-blue-400',
                    'User Administration': 'text-success',
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

