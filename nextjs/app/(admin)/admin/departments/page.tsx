'use client';

import { useState, useEffect, Fragment } from 'react';
import { fetchDepartmentsAction } from '@/api/departments/query_departments/action';
import { fetchDepartmentProductsAction } from '@/api/departments/query_department_products/action';
import type { Department, Product } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DepartmentFormDialog } from '@/components/departments/DepartmentFormDialog';
import { DeleteDepartmentDialog } from '@/components/departments/DeleteDepartmentDialog';
import {
  Plus,
  Building2,
  Pencil,
  Trash2,
  Loader2,
  Package,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DepartmentWithProducts extends Department {
  products?: Product[];
  productsExpanded?: boolean;
}

export default function DepartmentsPage() {
  const { isAdmin } = useAuth();
  const [departments, setDepartments] = useState<DepartmentWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(new Set());
  const [dataLoaded, setDataLoaded] = useState(false); // Track if data has been loaded

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await fetchDepartmentsAction();
      setDepartments(data.map(d => ({ ...d, productsExpanded: false })));
    } catch (error) {
      toast.error('Failed to load departments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentProducts = async (departmentId: string) => {
    try {
      setLoadingProducts(prev => new Set(prev).add(departmentId));
      const products = await fetchDepartmentProductsAction(departmentId);
      
      // Convert backend products to frontend Product type (handle nullable fields)
      // Filter out products with null service_id as Product type requires service_id to be a string
      const convertedProducts: Product[] = products
        .filter(p => p.service_id !== null)
        .map(p => ({
          ...p,
          service_id: p.service_id!, // Type assertion safe after filter
          description: p.description ?? undefined,
          url: p.url ?? undefined,
          service_name: p.service_name ?? undefined,
          status: p.status ?? undefined,
          latest_payment_date: p.latest_payment_date ?? undefined,
          latest_usage_start_date: p.latest_usage_start_date ?? undefined,
          latest_usage_end_date: p.latest_usage_end_date ?? undefined,
        }));
      
      setDepartments(prev =>
        prev.map(d =>
          d.id === departmentId
            ? { ...d, products: convertedProducts, productsExpanded: true }
            : d
        )
      );
    } catch (error) {
      toast.error('Failed to load department products');
      console.error(error);
    } finally {
      setLoadingProducts(prev => {
        const next = new Set(prev);
        next.delete(departmentId);
        return next;
      });
    }
  };

  const toggleProductsExpansion = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    
    if (!dept) return;
    
    if (!dept.productsExpanded && !dept.products) {
      // Fetch products if not already loaded
      fetchDepartmentProducts(departmentId);
    } else {
      // Just toggle expansion
      setDepartments(prev =>
        prev.map(d =>
          d.id === departmentId
            ? { ...d, productsExpanded: !d.productsExpanded }
            : d
        )
      );
    }
  };

  useEffect(() => {
    // Only fetch data once when component mounts and user is admin
    if (isAdmin() && !dataLoaded) {
      fetchDepartments();
      setDataLoaded(true);
    } else if (!isAdmin()) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setDialogOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setDialogOpen(true);
  };

  const handleDeleteDepartment = (department: Department) => {
    setDeletingDepartment(department);
    setDeleteDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    fetchDepartments();
  };

  if (!isAdmin()) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Department Master File</h1>
          <p className="text-muted-foreground mt-0.5">
            Manage departments and product assignments
          </p>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-950 mb-4">
              <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
            <p className="text-sm text-muted-foreground">
              Only administrators can access Department Master File
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
          <h1 className="text-3xl font-bold tracking-tight">Department Master File</h1>
          <p className="text-muted-foreground mt-0.5">
            Manage departments and assign default product access for each department
          </p>
        </div>
        <Button onClick={handleAddDepartment} size="default" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : departments.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-950 mb-4">
              <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No departments found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Create your first department to organize users and assign default product access.
            </p>
            <Button onClick={handleAddDepartment} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>All Departments</CardTitle>
            <CardDescription>
              {departments.length} department{departments.length === 1 ? '' : 's'} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Assigned Products</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((department) => {
                  const isExpanded = department.productsExpanded;
                  const hasProducts = department.products && department.products.length > 0;
                  const isLoadingProducts = loadingProducts.has(department.id);
                  
                  return (
                    <Fragment key={department.id}>
                      <TableRow className="group">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => toggleProductsExpansion(department.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            {department.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isLoadingProducts ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span className="text-xs text-muted-foreground">Loading...</span>
                            </div>
                          ) : hasProducts ? (
                            <span className="text-sm text-muted-foreground">
                              {department.products!.length} product{department.products!.length === 1 ? '' : 's'}
                            </span>
                          ) : department.products ? (
                            <span className="text-xs text-muted-foreground">No products assigned</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Click to view</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5"
                              onClick={() => handleEditDepartment(department)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteDepartment(department)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Products Row */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={4} className="bg-muted/30 p-0">
                            <div className="p-4 pl-16">
                              {isLoadingProducts ? (
                                <div className="flex items-center gap-2 py-4">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span className="text-sm text-muted-foreground">Loading products...</span>
                                </div>
                              ) : hasProducts ? (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    {department.products!.map((product) => (
                                      <Badge
                                        key={product.id}
                                        variant="secondary"
                                        className="gap-1.5 px-3 py-1"
                                      >
                                        <Package className="h-3 w-3" />
                                        {product.name}
                                        {product.service_name && (
                                          <span className="text-[10px] opacity-70">
                                            ({product.service_name})
                                          </span>
                                        )}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground py-4">
                                  No products assigned to this department yet
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Department Form Dialog */}
      <DepartmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={editingDepartment}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete Department Dialog */}
      <DeleteDepartmentDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        department={deletingDepartment}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}

