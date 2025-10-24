'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { User, Product } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserFormDialog } from '@/components/users/UserFormDialog';
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog';
import { Plus, Users as UsersIcon, Pencil, Trash2, Mail, Briefcase, Shield, UserCircle2, Loader2, Building2, Calendar, User as UserIcon, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [dataLoaded, setDataLoaded] = useState(false); // Track if data has been loaded
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize] = useState(20); // Users per page

  const fetchUsers = async (page: number = currentPage) => {
    try {
      setLoading(true);
      const response = await apiClient.getUsers(undefined, page, pageSize);
      setUsers(response.data);
      setCurrentPage(response.pagination.page);
      setTotalUsers(response.pagination.total);
      setTotalPages(Math.ceil(response.pagination.total / response.pagination.limit));
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
    // Only fetch data once when component mounts and user is admin
    if (isAdmin() && !dataLoaded) {
      fetchUsers();
      fetchProducts();
      setDataLoaded(true);
    } else if (!isAdmin()) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    fetchUsers(currentPage);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchUsers(newPage);
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Employee Directory</h1>
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
              Only administrators can access the Employee Directory
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
          <h1 className="text-3xl font-bold tracking-tight">Employee Directory</h1>
          <p className="text-muted-foreground mt-0.5">
            {totalUsers > 0 ? `${totalUsers} ${totalUsers === 1 ? 'employee' : 'employees'} in directory` : 'No employees in directory'}
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
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="w-[250px]">Name</TableHead>
                    <TableHead className="w-[200px]">Email</TableHead>
                    <TableHead className="w-[150px]">Department</TableHead>
                    <TableHead className="w-[150px]">Position</TableHead>
                    <TableHead className="w-[120px]">Hire Date</TableHead>
                    <TableHead className="w-[200px]">Products</TableHead>
                    <TableHead className="text-right w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const hasAdminRole = user.roles?.includes('Admin');
                    const userProducts = getUserProducts(user);
                    
                    return (
                      <TableRow 
                        key={user.id}
                        className="group hover:bg-accent/30 transition-colors"
                      >
                        {/* Name */}
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950 group-hover:bg-purple-100 dark:group-hover:bg-purple-900 transition-colors">
                              <UserCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{user.name}</span>
                              {hasAdminRole && (
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0 px-2 py-0.5 gap-1">
                                  <Shield className="h-3 w-3" />
                                  <span className="text-xs font-medium">Admin</span>
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        </TableCell>

                        {/* Department */}
                        <TableCell>
                          {user.department ? (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{user.department}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Position */}
                        <TableCell>
                          {user.position ? (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{user.position}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Hire Date */}
                        <TableCell>
                          {user.hire_date ? (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                              <span>
                                {new Date(user.hire_date).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Products */}
                        <TableCell>
                          {userProducts.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {userProducts.slice(0, 2).map((product) => (
                                <Badge
                                  key={product.id}
                                  variant="outline"
                                  className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 border-green-200"
                                >
                                  {product.name}
                                </Badge>
                              ))}
                              {userProducts.length > 2 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-muted"
                                >
                                  +{userProducts.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No products</span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="gap-1.5 hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all"
                              onClick={() => handleEditUser(user)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="gap-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls */}
      {!loading && users.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} employees
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="min-w-[40px]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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

