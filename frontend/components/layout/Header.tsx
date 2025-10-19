'use client'

import React, { useState } from 'react'
import { useTheme } from 'next-themes'
import { signOut, useSession } from 'next-auth/react'
import { 
  Menu, 
  Search, 
  Bell, 
  HelpCircle, 
  Settings,
  Shield,
  ChevronDown,
  User,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Key
} from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface HeaderProps {
  onToggleSidebar: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout, hasRole } = useAuth()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [showNotifications, setShowNotifications] = useState(false)

  const handleLogout = async () => {
    console.log('[Header] Logging out...')
    
    // Clear API client token
    apiClient.clearToken()
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('portalops_user')
      localStorage.removeItem('portalops_token')
      
      // Clear auth cookie
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }

    // If using Azure/NextAuth, sign out from NextAuth
    if (session) {
      console.log('[Header] Signing out from Azure/NextAuth')
      await signOut({ callbackUrl: '/signin' })
    } else {
      // Otherwise use legacy logout
      console.log('[Header] Using legacy logout')
      logout()
    }
  }

  const getUserInitials = () => {
    const nameParts = user?.name?.split(' ') || []
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`
    }
    return user?.name?.[0] || 'U'
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/95 dark:bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex h-14 items-center px-4">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline-block font-semibold text-lg">
              PortalOps
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 ml-auto">
          {/* Search */}
          <Button
            variant="ghost"
            size="icon"
            title="Search (Ctrl+K)"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Admin Settings */}
          {hasRole('Admin') && (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              title="Admin Settings"
            >
              <Settings className="h-4 w-4" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full" />
            </Button>
          )}

          <Separator orientation="vertical" className="h-6" />

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-background border rounded-lg shadow-lg p-4">
                <h3 className="font-semibold mb-2">Notifications</h3>
                <p className="text-sm text-muted-foreground">No new notifications</p>
              </div>
            )}
          </div>

          {/* Help */}
          <Button
            variant="ghost"
            size="icon"
            title="Help (F1)"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium">{user?.name?.split(' ')[0] || user?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {user?.role === 'Admin' && 'Admin'}
                      {user?.role === 'ServiceAdmin' && 'Service Admin'}
                      {!user?.role && 'User'}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72" align="end">
              {/* User Info */}
              <div className="p-4 border-b">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{user?.name}</div>
                    <div className="text-sm text-muted-foreground">{user?.email}</div>
                    <div className="flex flex-wrap items-center mt-1 gap-1">
                      {user?.role === 'Admin' && (
                        <Badge variant="destructive" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {user?.role === 'ServiceAdmin' && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Service Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  Profile Settings
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="h-4 w-4 mr-2" />
                  Notification Preferences
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* Theme Selection */}
              <DropdownMenuLabel>Appearance</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                  {theme === 'light' && (
                    <div className="ml-auto h-2 w-2 bg-primary rounded-full" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                  {theme === 'dark' && (
                    <div className="ml-auto h-2 w-2 bg-primary rounded-full" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Monitor className="h-4 w-4 mr-2" />
                  System
                  {theme === 'system' && (
                    <div className="ml-auto h-2 w-2 bg-primary rounded-full" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuGroup>

              {/* Admin Section */}
              {hasRole('Admin') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Administration</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      System Setup
                      <DropdownMenuShortcut>⇧⌘A</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Key className="h-4 w-4 mr-2" />
                      Security Settings
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              )}

              <DropdownMenuSeparator />

              {/* Sign Out */}
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

