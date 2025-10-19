'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { Service } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ServiceFormDialog } from '@/components/services/ServiceFormDialog';
import { DeleteServiceDialog } from '@/components/services/DeleteServiceDialog';
import { Plus, Building, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getServices();
      setServices(data);
    } catch (error) {
      toast.error('Failed to load services');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Handle add service
  const handleAddService = () => {
    setEditingService(null);
    setDialogOpen(true);
  };

  // Handle edit service
  const handleEditService = (service: Service) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  // Handle delete service
  const handleDeleteService = (service: Service) => {
    setDeletingService(service);
    setDeleteDialogOpen(true);
  };

  // Handle dialog success
  const handleDialogSuccess = () => {
    fetchServices();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Inventory</h1>
          <p className="text-muted-foreground">
            Manage your enterprise services and their associated products
          </p>
        </div>
        <Button onClick={handleAddService}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : services.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-950 mb-4">
              <Building className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No services found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Get started by creating your first service
            </p>
            <Button onClick={handleAddService}>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-semibold">{service.name}</CardTitle>
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950">
                  <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Product count */}
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {service.productCount} {service.productCount <= 1 ? 'Product' : 'Products'}
                    </p>
                    
                    {/* Product names - only show if products exist */}
                    {service.products && service.products.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {service.products.map((product) => (
                          <span
                            key={product.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                          >
                            {product.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditService(service)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                      onClick={() => handleDeleteService(service)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Service Form Dialog */}
      <ServiceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={editingService}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete Service Dialog */}
      <DeleteServiceDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        service={deletingService}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}

