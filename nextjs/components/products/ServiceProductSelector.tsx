'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, Package, Layers, Loader2 } from 'lucide-react';
import type { Service, ProductSimple } from '@/types';
import { cn } from '@/lib/utils';

interface ServiceProductSelectorProps {
  services: Service[];
  selectedProductIds: string[];
  onSelectionChange: (productIds: string[]) => void;
  loading?: boolean;
  className?: string;
}

/**
 * ServiceProductSelector - Reusable component for selecting services and products
 * 
 * Features:
 * - Tree structure with expandable services
 * - Cascading selection: selecting a service selects all its Active products only
 * - Individual product selection (Active products only)
 * - Indeterminate state for partially selected services
 * - Non-Active products are disabled and show their status
 * - Returns only selected product IDs
 */
export function ServiceProductSelector({
  services,
  selectedProductIds,
  onSelectionChange,
  loading = false,
  className,
}: ServiceProductSelectorProps) {
  const [expandedServiceIds, setExpandedServiceIds] = useState<Set<string>>(new Set());

  // Expand all services by default on mount
  useEffect(() => {
    if (services.length > 0) {
      setExpandedServiceIds(new Set(services.map(s => s.id)));
    }
  }, [services]);

  const toggleServiceExpansion = (serviceId: string) => {
    setExpandedServiceIds(prev => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const getServiceProducts = (service: Service): ProductSimple[] => {
    return service.products || [];
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'Inactive':
        return 'bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-500 text-gray-900 dark:text-gray-100';
      case 'Overdue':
        return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400';
    }
  };

  const isProductActive = (product: ProductSimple): boolean => {
    // Consider product as active if status is undefined (backward compatibility) or explicitly 'Active'
    return !product.status || product.status === 'Active';
  };

  const getActiveProducts = (service: Service): ProductSimple[] => {
    return getServiceProducts(service).filter(isProductActive);
  };

  const isServiceFullySelected = (service: Service): boolean => {
    const activeProducts = getActiveProducts(service);
    if (activeProducts.length === 0) return false;
    return activeProducts.every(p => selectedProductIds.includes(p.id));
  };

  const isServicePartiallySelected = (service: Service): boolean => {
    const activeProducts = getActiveProducts(service);
    if (activeProducts.length === 0) return false;
    const selectedCount = activeProducts.filter(p => selectedProductIds.includes(p.id)).length;
    return selectedCount > 0 && selectedCount < activeProducts.length;
  };

  const handleServiceToggle = (service: Service) => {
    const activeProducts = getActiveProducts(service);
    const activeProductIds = activeProducts.map(p => p.id);
    
    if (isServiceFullySelected(service)) {
      // Deselect all active products of this service
      onSelectionChange(selectedProductIds.filter(id => !activeProductIds.includes(id)));
    } else {
      // Select all active products of this service only
      const newSelection = new Set([...selectedProductIds, ...activeProductIds]);
      onSelectionChange(Array.from(newSelection));
    }
  };

  const handleProductToggle = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      onSelectionChange(selectedProductIds.filter(id => id !== productId));
    } else {
      onSelectionChange([...selectedProductIds, productId]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">Loading services and products...</span>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="p-8 border rounded-lg text-center">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No services or products available
        </p>
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <div className="max-h-[400px] overflow-y-auto">
        {services.map((service) => {
          const products = getServiceProducts(service);
          const activeProducts = getActiveProducts(service);
          const isExpanded = expandedServiceIds.has(service.id);
          const isFullySelected = isServiceFullySelected(service);
          const isPartiallySelected = isServicePartiallySelected(service);
          const hasProducts = products.length > 0;
          const hasActiveProducts = activeProducts.length > 0;

          return (
            <div key={service.id} className="border-b last:border-b-0">
              {/* Service Header */}
              <div
                className={cn(
                  "flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors",
                  (isFullySelected || isPartiallySelected) && "bg-primary/5"
                )}
              >
                {/* Expand/Collapse Button */}
                {hasProducts && (
                  <button
                    type="button"
                    onClick={() => toggleServiceExpansion(service.id)}
                    className="flex-shrink-0 p-1 hover:bg-accent rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                )}
                
                {/* Service Checkbox */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Checkbox
                    id={`service-${service.id}`}
                    checked={isFullySelected}
                    className={cn(
                      isPartiallySelected && "data-[state=unchecked]:bg-primary/20"
                    )}
                    onCheckedChange={() => handleServiceToggle(service)}
                    disabled={!hasActiveProducts}
                  />
                  <Label
                    htmlFor={`service-${service.id}`}
                    className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                  >
                    <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm truncate block">
                        {service.name}
                      </span>
                      {service.admins && service.admins.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {service.admins.map(a => a.name).join(' / ')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-2">
                      <span>
                        {activeProducts.length} active
                      </span>
                    </div>
                  </Label>
                </div>
              </div>

              {/* Products List */}
              {hasProducts && isExpanded && (
                <div className="bg-muted/20">
                  {products.map((product) => {
                    const isSelected = selectedProductIds.includes(product.id);
                    const isActive = isProductActive(product);
                    
                    return (
                      <div
                        key={product.id}
                        className={cn(
                          "flex items-center gap-3 p-3 pl-12 transition-colors",
                          isActive && "hover:bg-accent/50",
                          isSelected && "bg-primary/5",
                          !isActive && "opacity-60"
                        )}
                      >
                        <Checkbox
                          id={`product-${product.id}`}
                          checked={isSelected}
                          onCheckedChange={() => handleProductToggle(product.id)}
                          disabled={!isActive}
                        />
                        <Label
                          htmlFor={`product-${product.id}`}
                          className={cn(
                            "flex items-center gap-2 flex-1 min-w-0",
                            isActive && "cursor-pointer",
                            !isActive && "cursor-not-allowed"
                          )}
                        >
                          <Package className={cn(
                            "h-3.5 w-3.5 flex-shrink-0",
                            isActive ? "text-green-600 dark:text-green-400" : "text-gray-400"
                          )} />
                          <span className="text-sm truncate flex-1">{product.name}</span>
                          {!isActive && (product.status === 'Overdue' || product.status === 'Inactive') && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "ml-2 text-xs",
                                product.status === 'Overdue' &&
                                  "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400",
                                product.status === 'Inactive' &&
                                  "bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-500 text-gray-900 dark:text-gray-100"
                              )}
                            >
                              {product.status}
                            </Badge>
                          )}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No Products Message */}
              {!hasProducts && isExpanded && (
                <div className="p-3 pl-12 text-xs text-muted-foreground bg-muted/20">
                  No products available for this service
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

