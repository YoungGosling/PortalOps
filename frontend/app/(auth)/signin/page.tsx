import { Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { SignInForm } from '@/components/auth/SignInForm'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { AzureSignInButton } from '@/components/auth/AzureSignInButton'

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[448px] space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="rounded-2xl bg-primary/10 p-4">
              <Shield className="h-10 w-10 text-primary" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            PortalOps
          </h1>
          <p className="text-sm text-muted-foreground">
            Secure access to your enterprise services
          </p>
        </div>

        {/* Card with Tabs */}
        <Card className="border-border/50 shadow-lg">
          <Tabs defaultValue="signin" className="w-full">
            {/* Tabs Header */}
            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/30">
              <TabsTrigger 
                value="signin" 
                className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Sign In Tab Content */}
            <TabsContent value="signin" className="mt-0">
              <CardContent className="pt-6 pb-6 px-6 space-y-4">
                {/* Azure Sign-In */}
                <AzureSignInButton baseUrl={process.env.NEXTAUTH_URL || ""} />
                
                {/* Separator */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      OR CONTINUE WITH EMAIL
                    </span>
                  </div>
                </div>

                {/* Email/Password Sign-In */}
                <SignInForm />
              </CardContent>
            </TabsContent>

            {/* Sign Up Tab Content */}
            <TabsContent value="signup" className="mt-0">
              <CardContent className="pt-6 pb-6 px-6">
                <SignUpForm />
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Demo Credentials */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Demo credentials: admin@portalops.com / password
          </p>
        </div>
      </div>
    </div>
  )
}

