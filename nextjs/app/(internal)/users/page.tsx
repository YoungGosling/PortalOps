'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { User } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserFormDialog } from '@/components/users/UserFormDialog';
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog';
import { Plus, Users as UsersIcon, Pencil, Trash2, Mail, Briefcase, Shield, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  // Handle add user
  const handleAddUser = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  // Handle delete user
  const handleDeleteUser = (user: User) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  // Handle dialog success
  const handleDialogSuccess = () => {
    fetchUsers();
  };

  if (!isAdmin()) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Directory</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-purple-50 dark:bg-purple-950 mb-4">
              <UsersIcon className="h-12 w-12 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
            <p className="text-sm text-muted-foreground">
              Only administrators can access the user directory
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Directory</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button onClick={handleAddUser} size="lg" className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {loading ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="animate-pulse p-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-muted/30 rounded-lg mb-3" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-purple-50 dark:bg-purple-950 mb-4">
              <UsersIcon className="h-16 w-16 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No users found</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Get started by adding your first user to the directory
            </p>
            <Button onClick={handleAddUser} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y">
              {users.map((user) => {
                const hasAdminRole = user.roles?.includes('admin');
                
                return (
                  <div
                    key={user.id}
                    className="flex items-start gap-4 p-5 hover:bg-accent/10 transition-colors"
                  >
                    {/* User Avatar */}
                    <div className="flex-shrink-0 mt-1">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                        <UserCircle2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{user.name}</h3>
                        {hasAdminRole && (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-900">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{user.email}</span>
                        </div>
                        
                        {user.department && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Briefcase className="h-3.5 w-3.5" />
                            <span>{user.department}</span>
                          </div>
                        )}
                        
                        {user.roles && user.roles.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            {user.roles.map((role) => (
                              <Badge 
                                key={role} 
                                variant="outline"
                                className="capitalize text-xs"
                              >
                                {role}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {user.assignedServiceIds && user.assignedServiceIds.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-2">
                            {user.assignedServiceIds.length} {user.assignedServiceIds.length === 1 ? 'service' : 'services'} assigned
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-shrink-0 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                        className="hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Form Dialog */}
      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete User Dialog */}
      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={deletingUser}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}

