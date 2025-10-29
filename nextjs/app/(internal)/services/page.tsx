'use client';

import { useState, useEffect } from 'react';
import { fetchQueryServicesAction } from '@/api/services/query_services/action';
import type { Service } from '@/types';
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
import { ServiceFormDialog } from '@/components/services/ServiceFormDialog';
import { DeleteServiceDialog } from '@/components/services/DeleteServiceDialog';
import { Plus, Building, Loader2, Package, Edit2, Trash2, UserCog, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServices, setTotalServices] = useState(0);
  const [pageSize] = useState(20);

  const fetchServices = async (page: number = currentPage) => {
    try {
      setLoading(true);
      const response = await fetchQueryServicesAction(page, pageSize);
      // Transform response to match expected format
      const services: Service[] = response.data.map(s => ({
        id: s.id,
        name: s.name,
        vendor: s.vendor,
        product_count: s.productCount || 0,
        products: s.products,
        admins: s.admins,
        created_at: s.created_at,
        updated_at: s.updated_at,
      }));
      setServices(services);
      setCurrentPage(response.pagination.page);
      setTotalServices(response.pagination.total);
      setTotalPages(Math.ceil(response.pagination.total / response.pagination.limit));
    } catch (error) {
      toast.error('Failed to load services');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!dataLoaded) {
      fetchServices();
      setDataLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchServices(page);
  };

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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Provider</h1>
          <p className="text-muted-foreground mt-0.5">
            {totalServices > 0 ? `${totalServices} ${totalServices === 1 ? 'service' : 'services'} in directory` : 'No services in directory'}
          </p>
        </div>
        <Button onClick={handleAddService} size="default" className="gap-2">
          <Plus className="h-4 w-4" />
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
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Get started by creating your first enterprise service. Services help you organize and manage products across your organization.
            </p>
            <Button onClick={handleAddService} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Service
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
                    <TableHead className="w-[250px]">Service Name</TableHead>
                    <TableHead className="w-[400px]">Administrators</TableHead>
                    <TableHead className="w-[350px]">Associated Products</TableHead>
                    <TableHead className="text-right w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow 
                      key={service.id}
                      className="group hover:bg-accent/30 transition-colors"
                    >
                      {/* Service Name */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                            <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-semibold">{service.name}</span>
                        </div>
                      </TableCell>

                      {/* Administrators */}
                      <TableCell>
                        {service.admins && service.admins.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {service.admins.slice(0, 3).map((admin) => (
                              <Badge
                                key={admin.id}
                                variant="outline"
                                className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border-purple-200"
                              >
                                <UserCog className="h-3 w-3 mr-1" />
                                {admin.name}
                              </Badge>
                            ))}
                            {service.admins.length > 3 && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-muted"
                              >
                                +{service.admins.length - 3} more
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <UserCog className="h-3.5 w-3.5" />
                            <span>No assigned</span>
                          </div>
                        )}
                      </TableCell>

                      {/* Associated Products */}
                      <TableCell>
                        {service.products && service.products.length > 0 ? (
                          <div className="flex gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                            {service.products.map((product) => (
                              <Badge
                                key={product.id}
                                variant="outline"
                                className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 border-green-200 whitespace-nowrap"
                              >
                                {product.name}
                              </Badge>
                            ))}
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
                            onClick={() => handleEditService(service)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="gap-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all"
                            onClick={() => handleDeleteService(service)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls */}
      {!loading && services.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalServices)} of {totalServices} services
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

