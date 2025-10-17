import { Shield } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { SignInForm } from '@/components/auth/SignInForm'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { AzureSignInButton } from '@/components/auth/AzureSignInButton'

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold">
            PortalOps
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Secure access to your enterprise services
          </p>
        </div>

        <Card>
          <CardHeader>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-0">
                <CardContent className="pt-6 space-y-4">
                  {/* Azure Sign-In */}
                  <AzureSignInButton baseUrl={process.env.NEXTAUTH_URL || ""} />
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with email
                      </span>
                    </div>
                  </div>

                  {/* Email/Password Sign-In */}
                  <SignInForm />
                </CardContent>
              </TabsContent>
              <TabsContent value="signup" className="mt-0">
                <CardContent className="pt-6">
                  <SignUpForm />
                </CardContent>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Demo credentials: admin@portalops.com / password
          </p>
        </div>
      </div>
    </div>
  )
}

