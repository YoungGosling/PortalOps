import React, { useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { cn } from '../../lib/utils'

interface LayoutProps {
  children: React.ReactNode
  currentPath: string
  onNavigate: (path: string) => void
  onShowAuth: () => void
}

export function Layout({ children, currentPath, onNavigate, onShowAuth }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={toggleSidebar} onShowAuth={onShowAuth} />
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />
      <main 
        className={cn(
          'pt-14 transition-all duration-300',
          sidebarCollapsed ? 'ml-14' : 'ml-64'
        )}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
