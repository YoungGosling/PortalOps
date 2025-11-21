'use client';

import { useState, useEffect } from 'react';
import { fetchListUserAction } from '@/api/users/list_user/action';
import { queryProductsAction } from '@/api/products/query_products/action';
import type { User, Product } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { ImportAssignmentsDialog } from '@/components/users/ImportAssignmentsDialog';
import { Plus, Users as UsersIcon, Pencil, Trash2, Mail, Briefcase, Shield, UserCircle2, Loader2, Building2, Calendar, User as UserIcon, ChevronLeft, ChevronRight, Search, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';
import { Input } from '@/components/ui/input';

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); // Track if data has been loaded
  const [searchQuery, setSearchQuery] = useState('');
  const [productsDialogOpen, setProductsDialogOpen] = useState(false);
  const [selectedUserProducts, setSelectedUserProducts] = useState<{
    userName: string;
    products: Product[];
  } | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize] = useState(20); // Users per page
  const [pageInput, setPageInput] = useState('');

  const fetchUsers = async (page: number = currentPage, search?: string) => {
    try {
      setLoading(true);
      const response = await fetchListUserAction(search, undefined, page, pageSize);
      // Convert null values to undefined to match User type
      const users: User[] = response.data.map(user => ({
        ...user,
        department: user.department ?? undefined,
        department_id: user.department_id ?? undefined,
        position: user.position ?? undefined,
        hire_date: user.hire_date ?? undefined,
        resignation_date: user.resignation_date ?? undefined,
        roles: user.roles as ('Admin' | 'ServiceAdmin')[],
        sap_ids: user.sap_ids ?? undefined,
      }));
      setUsers(users);
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
      const response = await queryProductsAction(undefined, 1, 100);
      // Convert null to undefined for Product type compatibility
      // Filter out products with null service_id as Product type requires service_id to be a string
      const products: Product[] = response.products
        .filter(p => p.service_id !== null)
        .map(p => ({
          ...p,
          service_id: p.service_id!, // Type assertion safe after filter
          description: p.description ?? undefined,
          service_name: p.service_name ?? undefined,
          status: p.status ?? undefined,
          latest_payment_date: p.latest_payment_date ?? undefined,
          latest_usage_start_date: p.latest_usage_start_date ?? undefined,
          latest_usage_end_date: p.latest_usage_end_date ?? undefined,
        }));
      setProducts(products);
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
    fetchUsers(currentPage, searchQuery || undefined);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setPageInput('');
      fetchUsers(newPage, searchQuery || undefined);
    }
  };

  const handlePageInputChange = (value: string) => {
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setPageInput(value);
    }
  };

  const handlePageJump = () => {
    const page = parseInt(pageInput, 10);
    if (page >= 1 && page <= totalPages) {
      handlePageChange(page);
    } else {
      toast.error(`Please enter a page number between 1 and ${totalPages}`);
      setPageInput('');
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageJump();
    }
  };

  // Get user's assigned products
  const getUserProducts = (user: User) => {
    if (!user.assignedProductIds || user.assignedProductIds.length === 0) {
      return [];
    }
    return products.filter(product => user.assignedProductIds.includes(product.id));
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to page 1 when searching
    fetchUsers(1, query || undefined);
  };

  // Handle showing all products for a user
  const handleShowAllProducts = (user: User, userProducts: Product[]) => {
    setSelectedUserProducts({
      userName: user.name,
      products: userProducts,
    });
    setProductsDialogOpen(true);
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
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button 
            onClick={() => setImportDialogOpen(true)} 
            size="default" 
            variant="outline"
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button onClick={handleAddUser} size="default" className="gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>
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
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No matching employees found' : 'No users found'}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              {searchQuery
                ? `No employees match "${searchQuery}". Try a different search term.`
                : 'Get started by creating your first user account. Users can be assigned roles and access to specific services.'
              }
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
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{user.name}</span>
                                {hasAdminRole && (
                                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0 px-2 py-0.5 gap-1">
                                    <Shield className="h-3 w-3" />
                                    <span className="text-xs font-medium">Admin</span>
                                  </Badge>
                                )}
                              </div>
                              {user.resignation_date && (
                                <div className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 font-medium">
                                  <Calendar className="h-3 w-3" />
                                  <span>Resigned: {user.resignation_date}</span>
                                </div>
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs bg-muted hover:bg-muted/80"
                                  onClick={() => handleShowAllProducts(user, userProducts)}
                                >
                                  +{userProducts.length - 2} more
                                </Button>
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
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} employees
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap mr-1">
              totalPages: {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
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
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 ml-2 pl-2 border-l">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Go to page
              </span>
              <Input
                type="text"
                value={pageInput}
                onChange={(e) => handlePageInputChange(e.target.value)}
                onKeyDown={handlePageInputKeyDown}
                placeholder="Page"
                className="w-16 h-8 text-center text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handlePageJump}
                className="h-8 px-3"
              >
                Go
              </Button>
            </div>
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

      {/* Import Assignments Dialog */}
      <ImportAssignmentsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      {/* Products Dialog */}
      <Dialog open={productsDialogOpen} onOpenChange={setProductsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              {selectedUserProducts?.userName}'s Products
            </DialogTitle>
            <DialogDescription>
              All products assigned to this employee
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {selectedUserProducts && selectedUserProducts.products.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto">
                {selectedUserProducts.products.map((product) => (
                  <Badge
                    key={product.id}
                    variant="outline"
                    className="text-sm bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 border-green-200 px-3 py-1.5"
                  >
                    {product.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No products assigned
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

