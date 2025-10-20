'use client';

import { useAuth } from '@/providers/auth-provider';
import { usePaymentSummary } from '@/providers/payment-summary-provider';
import { useTheme } from 'next-themes';
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
  User,
  Sun,
  Moon,
  Monitor,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
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
          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-info/10 hover:text-info transition-colors">
            <Search className="h-4 w-4" />
          </Button>

          {isAdmin() && (
            <Button variant="ghost" size="icon" className="h-9 w-9 relative hover:bg-warning/10 hover:text-warning transition-colors">
              <Settings className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-warning rounded-full animate-pulse shadow-sm shadow-warning" />
            </Button>
          )}

          <Separator orientation="vertical" className="h-6" />

          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-info/10 hover:text-info transition-colors">
            <Bell className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-success/10 hover:text-success transition-colors">
            <HelpCircle className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* User Profile Dropdown */}
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
            <DropdownMenuContent className="w-72 animate-scale-in" align="end">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3 py-2">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/30">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-info text-primary-foreground font-bold">
                      {user ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold">{user?.name || 'User'}</span>
                    <span className="text-xs text-muted-foreground">
                      {user?.email || ''}
                    </span>
                    <div className="flex gap-1 mt-1">
                      {user?.roles?.map((role) => (
                        <Badge key={role} variant={role === 'Admin' ? 'default' : 'secondary'} className="text-[10px]">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                <span>Notification Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Appearance
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4 text-warning" />
                <span>Light Theme</span>
                {theme === 'light' && (
                  <span className="ml-auto h-2 w-2 bg-success rounded-full animate-pulse" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4 text-info" />
                <span>Dark Theme</span>
                {theme === 'dark' && (
                  <span className="ml-auto h-2 w-2 bg-success rounded-full animate-pulse" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4 text-primary" />
                <span>System Theme</span>
                {theme === 'system' && (
                  <span className="ml-auto h-2 w-2 bg-success rounded-full animate-pulse" />
                )}
              </DropdownMenuItem>
              {isAdmin() && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Administration
                  </DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>System Setup</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

