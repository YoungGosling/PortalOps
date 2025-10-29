'use client';

import { useAuth } from '@/providers/auth-provider';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Menu,
  Shield,
  Search,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout, isAdmin } = useAuth();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    // If user is authenticated via Azure AD (NextAuth session exists)
    if (session) {
      await signOut({ callbackUrl: '/signin' });
    } else {
      // Use regular logout for email/password authentication
      logout();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="h-9 w-9 hover:bg-primary/10 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-gradient-to-r from-primary/10 to-info/10">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:inline text-foreground">
              PortalOps
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="ml-auto flex items-center gap-2">
          {/* User Profile Dropdown */}
          {!mounted ? (
            // Render a placeholder during SSR to avoid hydration mismatch
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 hover:bg-primary/10 transition-colors"
              disabled
            >
              <Avatar className="h-7 w-7 ring-2 ring-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-info text-primary-foreground text-xs font-bold">
                  {user ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start text-xs">
                <span className="font-semibold">{user?.name || 'User'}</span>
                {user?.roles && user.roles.length > 0 && (
                  <span className="text-muted-foreground text-[10px]">
                    {user.roles[0]}
                  </span>
                )}
              </div>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-9 px-2 hover:bg-primary/10 transition-colors"
                >
                  <Avatar className="h-7 w-7 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-info text-primary-foreground text-xs font-bold">
                      {user ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start text-xs">
                    <span className="font-semibold">{user?.name || 'User'}</span>
                    {user?.roles && user.roles.length > 0 && (
                      <span className="text-muted-foreground text-[10px]">
                        {user.roles[0]}
                      </span>
                    )}
                  </div>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 bg-white dark:bg-slate-900 border-2 shadow-2xl" align="end" sideOffset={8}>
              <div className="p-4 bg-gradient-to-br bg-gradient-to-r from-white to-white dark:from-slate-800 dark:to-slate-800 border-b-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 ring-2 ring-primary/40 shadow-lg">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-info text-primary-foreground font-bold text-lg">
                      {user ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-base truncate text-gray-900 dark:text-white">{user?.name || 'User'}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {user?.email || ''}
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {user?.roles?.map((role) => (
                        <Badge 
                          key={role} 
                          variant={role === 'Admin' ? 'default' : 'secondary'} 
                          className="text-[10px] px-2 py-0.5 shadow-sm font-semibold"
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900">
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-md h-11 px-3 font-medium transition-colors hover:bg-destructive/5"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

