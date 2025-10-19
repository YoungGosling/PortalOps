'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { cn } from '@/lib/utils'

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <main 
        className={cn(
          'pt-14 transition-all duration-300 min-h-screen',
          isSidebarCollapsed ? 'pl-14' : 'pl-64'
        )}
      >
        <div className="container mx-auto p-6 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  )
}

