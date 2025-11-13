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
import { Plus, Building, Loader2, Package, Edit2, Trash2, UserCog, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServices, setTotalServices] = useState(0);
  const [pageSize] = useState(20);
  const [pageInput, setPageInput] = useState('');

  const fetchServices = async (page: number = currentPage, search?: string) => {
    try {
      setLoading(true);
      const response = await fetchQueryServicesAction(page, pageSize, search);
      // Transform response to match expected format
      const services: Service[] = response.data.map(s => ({
        id: s.id,
        name: s.name,
        vendor: s.vendor ?? undefined, // Convert null to undefined
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
    setPageInput('');
    fetchServices(page, searchQuery || undefined);
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
    fetchServices(currentPage, searchQuery || undefined);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to page 1 when searching
    fetchServices(1, query || undefined);
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
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
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
          <Button onClick={handleAddService} size="default" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>
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
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No matching services found' : 'No services found'}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              {searchQuery 
                ? `No services match "${searchQuery}". Try a different search term.`
                : 'Get started by creating your first enterprise service. Services help you organize and manage products across your organization.'
              }
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
                        <div className="flex items-center gap-2 max-w-[250px]">
                          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors flex-shrink-0">
                            <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-semibold truncate" title={service.name}>{service.name}</span>
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
                          <div className="flex gap-1 flex-wrap max-w-[350px]">
                            {service.products.map((product) => (
                              <Badge
                                key={product.id}
                                variant="outline"
                                className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 border-green-200 max-w-[200px] truncate"
                                title={product.name}
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
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalServices)} of {totalServices} services
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

