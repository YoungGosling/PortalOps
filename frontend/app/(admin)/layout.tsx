'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { cn } from '@/lib/utils'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen">
      <Header onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <main 
        className={cn(
          'pt-14 transition-all duration-300',
          isSidebarCollapsed ? 'pl-14' : 'pl-64'
        )}
      >
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

