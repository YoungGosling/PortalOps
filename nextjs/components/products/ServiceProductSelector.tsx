'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
 * - Cascading selection: selecting a service selects all its products
 * - Individual product selection
 * - Indeterminate state for partially selected services
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

  const isServiceFullySelected = (service: Service): boolean => {
    const products = getServiceProducts(service);
    if (products.length === 0) return false;
    return products.every(p => selectedProductIds.includes(p.id));
  };

  const isServicePartiallySelected = (service: Service): boolean => {
    const products = getServiceProducts(service);
    if (products.length === 0) return false;
    const selectedCount = products.filter(p => selectedProductIds.includes(p.id)).length;
    return selectedCount > 0 && selectedCount < products.length;
  };

  const handleServiceToggle = (service: Service) => {
    const products = getServiceProducts(service);
    const productIds = products.map(p => p.id);
    
    if (isServiceFullySelected(service)) {
      // Deselect all products of this service
      onSelectionChange(selectedProductIds.filter(id => !productIds.includes(id)));
    } else {
      // Select all products of this service
      const newSelection = new Set([...selectedProductIds, ...productIds]);
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
          const isExpanded = expandedServiceIds.has(service.id);
          const isFullySelected = isServiceFullySelected(service);
          const isPartiallySelected = isServicePartiallySelected(service);
          const hasProducts = products.length > 0;

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
                    disabled={!hasProducts}
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
                      {service.vendor && (
                        <span className="text-xs text-muted-foreground">
                          {service.vendor}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {products.length} {products.length === 1 ? 'product' : 'products'}
                    </span>
                  </Label>
                </div>
              </div>

              {/* Products List */}
              {hasProducts && isExpanded && (
                <div className="bg-muted/20">
                  {products.map((product) => {
                    const isSelected = selectedProductIds.includes(product.id);
                    
                    return (
                      <div
                        key={product.id}
                        className={cn(
                          "flex items-center gap-3 p-3 pl-12 hover:bg-accent/50 transition-colors",
                          isSelected && "bg-primary/5"
                        )}
                      >
                        <Checkbox
                          id={`product-${product.id}`}
                          checked={isSelected}
                          onCheckedChange={() => handleProductToggle(product.id)}
                        />
                        <Label
                          htmlFor={`product-${product.id}`}
                          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                        >
                          <Package className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="text-sm truncate">{product.name}</span>
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

