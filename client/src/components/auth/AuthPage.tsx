import React, { useState } from 'react'
import { Shield, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'
import { Button } from '../ui/Button'

interface AuthPageProps {
  onBack?: () => void
}

export function AuthPage({ onBack }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {onBack && (
          <div className="text-left">
            <Button
              variant="ghost"
              onClick={onBack}
              className="inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue as Guest
            </Button>
          </div>
        )}
        <div className="text-center">
          <div className="flex justify-center">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            PortalOps
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Secure access to your enterprise services
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="grid w-full grid-cols-2">
              <button
                className={`px-4 py-2 text-sm font-medium rounded-l-md border-b-2 transition-colors ${
                  activeTab === 'signin'
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveTab('signin')}
              >
                Sign In
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium rounded-r-md border-b-2 transition-colors ${
                  activeTab === 'signup'
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveTab('signup')}
              >
                Sign Up
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === 'signin' ? <SignInForm /> : <SignUpForm />}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Demo credentials: admin@portalops.com / password
          </p>
        </div>
      </div>
    </div>
  )
}
