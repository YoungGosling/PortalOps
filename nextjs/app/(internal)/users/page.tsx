'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { User, Product } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserFormDialog } from '@/components/users/UserFormDialog';
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog';
import { Plus, Users as UsersIcon, Pencil, Trash2, Mail, Briefcase, Shield, UserCircle2, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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

  const fetchProducts = async () => {
    try {
      const data = await apiClient.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
      fetchProducts();
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

  // Get user's assigned products
  const getUserProducts = (user: User) => {
    if (!user.assignedProductIds || user.assignedProductIds.length === 0) {
      return [];
    }
    return products.filter(product => user.assignedProductIds.includes(product.id));
  };

  if (!isAdmin()) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Directory</h1>
          <p className="text-muted-foreground mt-0.5">
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
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Directory</h1>
          <p className="text-muted-foreground mt-0.5">
            Manage user accounts and permissions across the organization
          </p>
        </div>
        <Button onClick={handleAddUser} size="default" className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-purple-50 dark:bg-purple-950 mb-4">
              <UsersIcon className="h-12 w-12 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No users found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Get started by creating your first user account. Users can be assigned roles and access to specific services.
            </p>
            <Button onClick={handleAddUser} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First User
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => {
            const hasAdminRole = user.roles?.includes('Admin');
            
            return (
              <Card 
                key={user.id} 
                className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg font-semibold truncate">
                          {user.name}
                        </CardTitle>
                        {hasAdminRole && (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0 px-1.5 py-0.5">
                            <Shield className="h-3 w-3" />
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{user.email}</span>
                      </CardDescription>
                    </div>
                    <div className="flex-shrink-0 p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950 group-hover:bg-purple-100 dark:group-hover:bg-purple-900 transition-colors">
                      <UserCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* User Information */}
                  <div className="space-y-2">
                    {user.department && (
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{user.department}</span>
                      </div>
                    )}
                    
                    {/* Role Tags - moved to products position */}
                    {user.roles && user.roles.length > 0 ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span
                              key={role}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                role === 'Admin' 
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                  : role === 'ServiceAdmin' 
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                                  : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400'
                              }`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">No roles assigned yet</span>
                      </div>
                    )}
                  </div>

                  {/* Assigned Products - moved to roles position */}
                  {(() => {
                    const userProducts = getUserProducts(user);
                    return userProducts.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Products
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {userProducts.map((product) => (
                            <span
                              key={product.id}
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 transition-colors"
                            >
                              {product.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 px-3 rounded-lg bg-muted/30 border border-dashed">
                        <p className="text-xs text-muted-foreground text-center">
                          No products assigned yet
                        </p>
                      </div>
                    );
                  })()}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-1.5 hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all"
                      onClick={() => handleEditUser(user)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all"
                      onClick={() => handleDeleteUser(user)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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

