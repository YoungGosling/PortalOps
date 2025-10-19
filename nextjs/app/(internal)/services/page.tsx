'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { Service } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ServiceFormDialog } from '@/components/services/ServiceFormDialog';
import { DeleteServiceDialog } from '@/components/services/DeleteServiceDialog';
import { Plus, Building } from 'lucide-react';
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
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-success/20 to-info/20">
            <Building className="h-8 w-8 text-success" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-success to-info bg-clip-text text-transparent">
              Service Inventory
            </h1>
            <p className="text-muted-foreground">
              Manage your enterprise services and their associated products
            </p>
          </div>
        </div>
        <Button variant="success" onClick={handleAddService}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 rounded-full bg-gradient-to-br from-success/20 to-info/20 mb-4">
              <Building className="h-12 w-12 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No services found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by creating your first service
            </p>
            <Button variant="success" onClick={handleAddService}>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-success">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{service.name}</span>
                  <div className="p-1.5 rounded-lg bg-success/10">
                    <Building className="h-5 w-5 text-success" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Product count and names */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary">
                      {service.productCount} {service.productCount <= 1 ? 'Product' : 'Products'}
                    </p>
                    
                    {/* Product names - only show if products exist */}
                    {service.products && service.products.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {service.products.map((product) => (
                          <span
                            key={product.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-success/10 text-success border border-success/20"
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
                      className="flex-1 hover:bg-info/10 hover:text-info hover:border-info"
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

