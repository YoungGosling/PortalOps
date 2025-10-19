'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BarChart3, 
  Inbox, 
  Building, 
  Users, 
  CreditCard,
  Shield,
  UserCheck,
  Archive,
  Settings,
  ChevronDown,
  ChevronRight,
  Package
} from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { usePaymentSummary } from '@/hooks/usePaymentSummary'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isCollapsed: boolean
}

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  roles?: string[]
}

interface MenuSection {
  id: string
  label: string
  items: MenuItem[]
  roles?: string[]
  collapsible?: boolean
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const pathname = usePathname()
  const { hasAnyRole } = useAuth()
  const { incompleteCount } = usePaymentSummary()
  const [expandedSections, setExpandedSections] = useState<string[]>(['administration', 'system-setup'])

  const menuSections: MenuSection[] = [
    {
      id: 'navigation',
      label: 'Navigation',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
        { id: 'inbox', label: 'Inbox', icon: Inbox, path: '/inbox', roles: ['Admin'] },
        { id: 'services', label: 'Service Inventory', icon: Building, path: '/services', roles: ['Admin'] },
        { id: 'products', label: 'Product Inventory', icon: Package, path: '/products', roles: ['Admin', 'ServiceAdmin'] },
        { id: 'payment-register', label: 'Payment Register', icon: CreditCard, path: '/payment-register', roles: ['Admin'] },
        { id: 'users', label: 'User Directory', icon: Users, path: '/users', roles: ['Admin'] },
      ]
    },
    {
      id: 'administration',
      label: 'Administration',
      collapsible: true,
      roles: ['Admin'],
      items: [
        { id: 'master-files', label: 'Master Files', icon: Archive, path: '/admin/files' },
      ]
    }
  ]

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const renderMenuItem = (item: MenuItem) => {
    // Check if user has required role
    if (item.roles && !hasAnyRole(item.roles as any)) {
      return null
    }

    const isActive = pathname === item.path
    const Icon = item.icon

    return (
      <Link
        key={item.id}
        href={item.path}
        className={cn(
          'w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative',
          isActive 
            ? 'bg-accent text-foreground' 
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
          isCollapsed && 'justify-center px-2'
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!isCollapsed && (
          <div className="flex items-center justify-between w-full">
            <span>{item.label}</span>
            {item.id === 'payment-register' && incompleteCount > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                {incompleteCount}
              </span>
            )}
          </div>
        )}
        {isCollapsed && item.id === 'payment-register' && incompleteCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {incompleteCount > 9 ? '9+' : incompleteCount}
          </span>
        )}
      </Link>
    )
  }

  const renderSection = (section: MenuSection) => {
    // Check if user has required role for the section
    if (section.roles && !hasAnyRole(section.roles as any)) {
      return null
    }

    const isExpanded = expandedSections.includes(section.id)
    const hasVisibleItems = section.items.some(item => 
      !item.roles || hasAnyRole(item.roles as any)
    )

    if (!hasVisibleItems) {
      return null
    }

    return (
      <div key={section.id} className="space-y-1">
        {section.collapsible && !isCollapsed ? (
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground"
          >
            <span>{section.label}</span>
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          !isCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.label}
            </div>
          )
        )}
        
        {(!section.collapsible || isExpanded || isCollapsed) && (
          <div className="space-y-1">
            {section.items.map(renderMenuItem)}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside 
      className={cn(
        'fixed left-0 top-14 bottom-0 z-40 bg-white dark:bg-background border-r transition-all duration-300',
        isCollapsed ? 'w-14' : 'w-64'
      )}
    >
      <div className="h-full overflow-y-auto p-4 space-y-6">
        {menuSections.map(renderSection)}
      </div>
    </aside>
  )
}

