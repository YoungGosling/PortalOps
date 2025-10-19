import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { PaymentSummaryProvider } from './contexts/PaymentSummaryContext'
// Import API test in development
import './utils/testApi'
import { AuthPage } from './components/auth/AuthPage'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './components/dashboard/Dashboard'
import { ServiceInventory } from './components/services/ServiceInventory'
import { Inbox } from './components/inbox/Inbox'
import { UserDirectory } from './components/users/UserDirectory'
import { PermissionManager } from './components/permissions/PermissionManager'
import { PaymentRegister } from './components/payment/PaymentRegister'
import { ProductInventory } from './components/products/ProductInventory'

// Placeholder components for other pages

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Dashboard</h1>
      <p>Administrative overview and system metrics.</p>
    </div>
  )
}

function SecurityPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Security & Compliance</h1>
      <p>Manage security settings and compliance monitoring.</p>
    </div>
  )
}

// function UserAdminPage() {
//   return (
//     <div className="space-y-6">
//       <h1 className="text-3xl font-bold">User Administration</h1>
//       <p>Advanced user management and role assignments.</p>
//     </div>
//   )
// }

function MasterFilesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Master Files</h1>
      <p>Manage system master data and configurations.</p>
    </div>
  )
}

function ConfigPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Configuration</h1>
      <p>Configure system settings and integrations.</p>
    </div>
  )
}

function AppContent() {
  const { user, isLoading } = useAuth()
  const [currentPath, setCurrentPath] = useState('/dashboard')
  const [showAuthPage, setShowAuthPage] = useState(false)

  // Automatically hide auth page when user logs in
  useEffect(() => {
    if (user) {
      setShowAuthPage(false)
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show auth page only if explicitly requested
  if (showAuthPage && !user) {
    return <AuthPage onBack={() => setShowAuthPage(false)} />
  }

  const renderPage = () => {
    switch (currentPath) {
      case '/dashboard':
        return <Dashboard />
      case '/inbox':
        return <Inbox />
      case '/services':
        return <ServiceInventory />
      case '/products':
        return <ProductInventory />
      case '/users':
        return <UserDirectory />
      case '/payment-register':
        return <PaymentRegister />
      case '/admin/dashboard':
        return <AdminDashboard />
      case '/admin/security':
        return <SecurityPage />
      case '/admin/permissions':
        return <PermissionManager />
      case '/admin/files':
        return <MasterFilesPage />
      case '/admin/config':
        return <ConfigPage />
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout 
      currentPath={currentPath} 
      onNavigate={setCurrentPath}
      onShowAuth={() => setShowAuthPage(true)}
    >
      {renderPage()}
    </Layout>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PaymentSummaryProvider>
          <AppContent />
        </PaymentSummaryProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App