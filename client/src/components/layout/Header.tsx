import React, { useState } from 'react'
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
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { Button } from '../ui/Button'

interface HeaderProps {
  onToggleSidebar: () => void
  onShowAuth: () => void
}

export function Header({ onToggleSidebar, onShowAuth }: HeaderProps) {
  const { user, logout, hasRole } = useAuth()
  const { theme, setTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex h-14 items-center px-4">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="h-9 w-9 p-0"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <div className="h-6 w-px bg-border" />
          
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
            size="sm"
            className="h-9 w-9 p-0"
            title="Search (Ctrl+K)"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Admin Settings */}
          {hasRole('Admin') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 relative"
              title="Admin Settings"
            >
              <Settings className="h-4 w-4" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full" />
            </Button>
          )}

          <div className="h-6 w-px bg-border" />

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
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
            size="sm"
            className="h-9 w-9 p-0"
            title="Help (F1)"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-border" />

          {/* User Menu or Sign In Button */}
          {user ? (
            <div className="relative">
              <Button
                variant="ghost"
                className="h-9 px-2"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="flex items-center space-x-2">
                  <div className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium">{user?.firstName}</div>
                    <div className="text-xs text-muted-foreground">
                      {user?.roles.includes('Admin') && (
                        <span className="inline-flex items-center">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </span>
                      )}
                      {user?.roles.includes('ServiceAdministrator') && (
                        <span className="inline-flex items-center">
                          <Shield className="h-3 w-3 mr-1" />
                          Service Admin
                        </span>
                      )}
                      {user?.roles.includes('ProductAdministrator') && (
                        <span className="inline-flex items-center">
                          <Shield className="h-3 w-3 mr-1" />
                          Product Admin
                        </span>
                      )}
                      {user?.roles.includes('User') && !user?.roles.includes('Admin') && 
                       !user?.roles.includes('ServiceAdministrator') && !user?.roles.includes('ProductAdministrator') && 'User'}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </Button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-background border rounded-lg shadow-lg backdrop-blur-sm">
                {/* User Info */}
                <div className="p-4 border-b">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div>
                      <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                      <div className="text-sm text-muted-foreground">{user?.email}</div>
                      <div className="flex flex-wrap items-center mt-1 gap-1">
                        {user?.roles.includes('Admin') && (
                          <span className="inline-flex items-center text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 px-2 py-1 rounded">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </span>
                        )}
                        {user?.roles.includes('ServiceAdministrator') && (
                          <span className="inline-flex items-center text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded">
                            <Shield className="h-3 w-3 mr-1" />
                            Service Admin
                          </span>
                        )}
                        {user?.roles.includes('ProductAdministrator') && (
                          <span className="inline-flex items-center text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded">
                            <Shield className="h-3 w-3 mr-1" />
                            Product Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-accent">
                    <User className="h-4 w-4" />
                    <span>Profile Settings</span>
                    <span className="ml-auto text-xs text-muted-foreground">⇧⌘P</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-accent">
                    <Bell className="h-4 w-4" />
                    <span>Notification Preferences</span>
                  </button>
                </div>

                {/* Theme Selection */}
                <div className="p-2 border-t">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                    Appearance
                  </div>
                  {themeOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value as any)}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-accent"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{option.label}</span>
                        {theme === option.value && (
                          <div className="ml-auto h-2 w-2 bg-primary rounded-full" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Admin Section */}
                {hasRole('Admin') && (
                  <div className="p-2 border-t">
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      Administration
                    </div>
                    <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-accent">
                      <Settings className="h-4 w-4" />
                      <span>System Setup</span>
                      <span className="ml-auto text-xs text-muted-foreground">⇧⌘A</span>
                    </button>
                    <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-accent">
                      <Key className="h-4 w-4" />
                      <span>Security Settings</span>
                    </button>
                  </div>
                )}

                {/* Sign Out */}
                <div className="p-2 border-t">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-accent text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                    <span className="ml-auto text-xs text-muted-foreground">⇧⌘Q</span>
                  </button>
                </div>
              </div>
            )}
            </div>
          ) : (
            <Button
              onClick={onShowAuth}
              className="h-9"
            >
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
