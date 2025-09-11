"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow, 
  TableCaption 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { fetchCustomers, deleteCustomer, type CustomerListResponse } from '@/services/customer.service';
import { Customer } from '@/types/customer';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { format } from 'date-fns';

// Status badge styles
const getStatusBadgeStyles = (isActive: boolean) => {
  return cn(
    'capitalize',
    isActive 
      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  );
};

export default function CustomersPage() {
  // State for customers data and UI
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const customers = await fetchCustomers({ 
        page, 
        search,
        limit: 10 
      });
      
      setCustomers(customers);
      // Update pagination state
      setTotalCount(customers.length);
      setTotalPages(Math.ceil(customers.length / 10) || 1);
    } catch (error) {
      console.error('Error loading customers:', error);
      setError('Failed to load customers. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load customers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to first page on new search
      loadCustomers();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Load customers when page changes
  useEffect(() => {
    loadCustomers();
  }, [page]);

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    
    try {
      setIsDeleting(true);
      await deleteCustomer(selectedCustomer.id);
      toast({
        title: 'Success',
        description: `${selectedCustomer.companyName} has been deleted successfully.`,
      });
      setIsDeleteDialogOpen(false);
      // If we're on the last page with only one item, go back a page
      if (customers.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        loadCustomers();
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error',
        description: `Failed to delete ${selectedCustomer.companyName}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setSelectedCustomer(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPp');
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage your organization's customers and their assets</p>
        </div>
        <Button 
          onClick={() => router.push('/admin/customers/new')}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="w-full sm:max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name, industry, or contact..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9"
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {!loading && customers.length > 0 && (
                <span>
                  Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(page * 10, (page - 1) * 10 + customers.length)}
                  </span>{' '}
                  of <span className="font-medium">{totalCount}</span> customers
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="min-w-[200px]">Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-center">Assets</TableHead>
                  <TableHead className="text-center">Contacts</TableHead>
                  <TableHead className="text-center">Tickets</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Loading customers...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2 text-destructive">
                        <AlertCircle className="h-8 w-8" />
                        <p>{error}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={loadCustomers}
                          className="mt-2"
                        >
                          Retry
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !customers?.length ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No customers found</p>
                        {search && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSearch('')}
                          >
                            Clear search
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id} className="group hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <button 
                              onClick={() => router.push(`/admin/customers/${customer.id}`)}
                              className="font-medium hover:underline text-left"
                            >
                              {customer.companyName}
                            </button>
                            {customer.serviceZone?.name && (
                              <div className="text-xs text-muted-foreground">
                                {customer.serviceZone.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {customer.industry || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {customer.city}, {customer.state}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.contacts?.[0]?.name && (
                            <div className="font-medium">{customer.contacts[0].name}</div>
                          )}
                          {customer.contacts?.[0]?.email && (
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                              <a 
                                href={`mailto:${customer.contacts[0].email}`} 
                                className="hover:underline truncate"
                                onClick={(e) => e.stopPropagation()}
                                title={customer.contacts[0].email}
                              >
                                {customer.contacts[0].email}
                              </a>
                            </div>
                          )}
                          {customer.contacts?.[0]?.phone && (
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                              <a 
                                href={`tel:${customer.contacts[0].phone}`}
                                className="hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {customer.contacts[0].phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="min-w-[2rem]">
                          {customer._count?.assets || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="min-w-[2rem]">
                          {customer._count?.contacts || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="min-w-[2rem]">
                          {customer._count?.tickets || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                        className={getStatusBadgeStyles(customer.isActive)}
                        variant="outline"
                      >
                        {customer.isActive ? 'active' : 'inactive'}
                      </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => router.push(`/admin/customers/${customer.id}`)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/customers/${customer.id}/edit`);
                            }}
                            title="Edit customer"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(customer);
                              setIsDeleteDialogOpen(true);
                            }}
                            title="Delete customer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle>Delete Customer</DialogTitle>
            </div>
            <DialogDescription className="pt-4">
              <p className="font-medium">
                Are you sure you want to delete <span className="text-foreground">{selectedCustomer?.companyName}</span>?
              </p>
              <p className="mt-2 text-sm">
                This will permanently delete the customer and all associated data including {selectedCustomer?._count?.assets || 0} assets, {selectedCustomer?._count?.contacts || 0} contacts, and {selectedCustomer?._count?.tickets || 0} tickets. This action cannot be undone.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedCustomer(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Customer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}