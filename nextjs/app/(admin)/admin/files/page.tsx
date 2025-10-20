'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { MasterFileInvoice } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Archive, Download, FileText, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

export default function MasterFilesPage() {
  const { isAdmin } = useAuth();
  const [invoices, setInvoices] = useState<MasterFileInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<MasterFileInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMasterFileInvoices();
      setInvoices(data);
      setFilteredInvoices(data);
    } catch (error) {
      toast.error('Failed to load invoices');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchInvoices();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  // Filter invoices based on search term and selected product
  useEffect(() => {
    let filtered = invoices;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(invoice =>
        invoice.original_file_name.toLowerCase().includes(searchLower) ||
        invoice.product_name.toLowerCase().includes(searchLower) ||
        invoice.service_name.toLowerCase().includes(searchLower) ||
        invoice.file_name.toLowerCase().includes(searchLower)
      );
    }

    // Apply product filter
    if (selectedProduct && selectedProduct !== 'all') {
      filtered = filtered.filter(invoice => invoice.product_id === selectedProduct);
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, selectedProduct]);

  if (!isAdmin()) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Archive className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-sm text-muted-foreground">
            Only administrators can access master files
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleDownload = async (invoiceId: string, filename: string) => {
    try {
      const blob = await apiClient.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to download invoice');
      console.error(error);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedProduct('all');
  };

  const hasActiveFilters = searchTerm.trim() !== '' || selectedProduct !== 'all';

  // Get unique products for filter dropdown
  const uniqueProducts = Array.from(
    new Map(invoices.map(invoice => [invoice.product_id, { id: invoice.product_id, name: invoice.product_name }])).values()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Master Files</h1>
        <p className="text-muted-foreground">
          Central repository of all invoice files uploaded through the Payment Register
        </p>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices by name, product, or service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-64">
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {uniqueProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="shrink-0"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
          {hasActiveFilters && (
            <div className="mt-3 text-sm text-muted-foreground">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-0">
            <div className="animate-pulse p-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded mb-2" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-950 mb-4">
              <Archive className="h-16 w-16 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {invoices.length === 0 ? 'No invoices found' : 'No invoices match your filters'}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {invoices.length === 0 
                ? 'Invoices will appear here once they are uploaded through the Payment Register'
                : 'Try adjusting your search terms or product filter'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-5 hover:bg-accent/10"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">{invoice.original_file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.product_name} • {invoice.service_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {new Date(invoice.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(invoice.id, invoice.original_file_name)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

