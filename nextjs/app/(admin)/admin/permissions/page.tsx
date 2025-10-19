'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

export default function PermissionsPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin()) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-sm text-muted-foreground">
            Only administrators can access this page
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Administration</h1>
        <p className="text-muted-foreground">
          Manage user permissions and role assignments
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Advanced user administration features will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

