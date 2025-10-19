'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { Product, Service } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductFormDialog } from '@/components/products/ProductFormDialog';
import { DeleteProductDialog } from '@/components/products/DeleteProductDialog';
import { Plus, Package, Filter } from 'lucide-react';
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-warning/20 to-chart-5/20">
            <Package className="h-8 w-8 text-warning" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-warning to-chart-5 bg-clip-text text-transparent">
              Product Inventory
            </h1>
            <p className="text-muted-foreground">
              View and manage all products across services
            </p>
          </div>
        </div>
        <Button variant="warning" onClick={handleAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Service Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filter by Service:</span>
        <Select value={selectedServiceFilter} onValueChange={handleServiceFilterChange}>
          <SelectTrigger className="w-[250px]">
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
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-0">
            <div className="animate-pulse p-8">
              <div className="h-8 bg-muted rounded w-1/4 mb-4" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded mb-2" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 rounded-full bg-gradient-to-br from-warning/20 to-chart-5/20 mb-4">
              <Package className="h-12 w-12 text-warning" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by creating your first product
            </p>
            <Button variant="warning" onClick={handleAddProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.service_name || 'No Service'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditProduct(product)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                      onClick={() => handleDeleteProduct(product)}
                    >
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

