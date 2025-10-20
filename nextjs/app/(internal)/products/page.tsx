'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { Product, Service } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductFormDialog } from '@/components/products/ProductFormDialog';
import { DeleteProductDialog } from '@/components/products/DeleteProductDialog';
import { Plus, Package, Filter, Loader2, Edit2, Trash2, Building } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const fetchProducts = async (serviceId?: string) => {
    try {
      setLoading(true);
      const data = await apiClient.getProducts(serviceId);
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const data = await apiClient.getServices();
      setServices(data);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchServices();
  }, []);

  // Handle service filter change
  const handleServiceFilterChange = (value: string) => {
    setSelectedServiceFilter(value);
    if (value === 'all') {
      fetchProducts();
    } else {
      fetchProducts(value);
    }
  };

  // Handle add product
  const handleAddProduct = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  // Handle delete product
  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

  // Handle dialog success
  const handleDialogSuccess = () => {
    // Re-fetch products based on current filter
    if (selectedServiceFilter === 'all') {
      fetchProducts();
    } else {
      fetchProducts(selectedServiceFilter);
    }
    // Also refresh services in case counts changed
    fetchServices();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Inventory</h1>
          <p className="text-muted-foreground mt-0.5">
            View and manage all products across services
          </p>
        </div>
        <Button onClick={handleAddProduct} size="default" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Service Filter Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
              <Filter className="h-4 w-4" />
            </div>
            <Select value={selectedServiceFilter} onValueChange={handleServiceFilterChange}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedServiceFilter !== 'all' && (
              <Badge variant="outline" className="ml-2">
                {products.length} {products.length === 1 ? 'product' : 'products'} found
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-green-50 dark:bg-green-950 mb-4">
              <Package className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              {selectedServiceFilter !== 'all' 
                ? 'No products found for the selected service. Try selecting a different service or add a new product.'
                : 'Get started by creating your first product and assigning it to a service'}
            </p>
            <Button onClick={handleAddProduct} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">All Products</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {products.length} {products.length === 1 ? 'product' : 'products'} in inventory
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
                  <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="group flex items-center justify-between p-5 hover:bg-accent/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Product Icon */}
                    <div className="flex-shrink-0 p-2.5 rounded-lg bg-green-50 dark:bg-green-950 group-hover:bg-green-100 dark:group-hover:bg-green-900 transition-colors">
                      <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base truncate">{product.name}</h3>
                      </div>
                      
                      {/* Service Badge */}
                      {product.service_name ? (
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          <Badge 
                            variant="outline" 
                            className="text-xs bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                          >
                            {product.service_name}
                          </Badge>
                        </div>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className="text-xs bg-muted/50 border-dashed"
                        >
                          No Service Assigned
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex-shrink-0 flex gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-1.5 hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all"
                      onClick={() => handleDeleteProduct(product)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete Product Dialog */}
      <DeleteProductDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        product={deletingProduct}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}

