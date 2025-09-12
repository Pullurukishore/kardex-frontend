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
  Loader2,
  Filter,
  Download,
  MoreHorizontal,
  Users,
  TrendingUp,
  Activity
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const router = useRouter();
  const { toast } = useToast();

  // Calculate stats
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.isActive).length,
    inactive: customers.filter(c => !c.isActive).length,
    totalAssets: customers.reduce((sum, c) => sum + (c._count?.assets || 0), 0),
    totalTickets: customers.reduce((sum, c) => sum + (c._count?.tickets || 0), 0)
  };

  // Get unique industries for filter
  const industries = Array.from(new Set(customers.map(c => c.industry).filter(Boolean)));

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

  // Filter customers based on selected filters
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = search === '' || 
      customer.companyName.toLowerCase().includes(search.toLowerCase()) ||
      customer.industry?.toLowerCase().includes(search.toLowerCase()) ||
      customer.address?.toLowerCase().includes(search.toLowerCase()) ||
      customer.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && customer.isActive) ||
      (statusFilter === 'inactive' && !customer.isActive);
    
    const matchesIndustry = industryFilter === 'all' || customer.industry === industryFilter;
    
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 p-6 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Customers</h1>
            <p className="text-blue-100">
              Manage your organization's customers and their business relationships
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              onClick={() => {/* Export functionality */}}
              className="hidden sm:flex bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button 
              onClick={() => router.push('/admin/customers/new')}
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Customer
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Customers</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active</p>
                <p className="text-2xl font-bold text-green-900">{stats.active}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-500 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Assets</p>
                <p className="text-2xl font-bold text-purple-900">{stats.totalAssets}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Total Tickets</p>
                <p className="text-2xl font-bold text-orange-900">{stats.totalTickets}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters and Search */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <CardTitle className="text-gray-800">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map(industry => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-gray-600">
              {!loading && filteredCustomers.length > 0 && (
                <span>
                  Showing <span className="font-semibold">{filteredCustomers.length}</span> of{' '}
                  <span className="font-semibold">{customers.length}</span> customers
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Customers Table */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Customers ({filteredCustomers.length})
          </CardTitle>
          <CardDescription>
            Manage customer relationships and business data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
                Loading customers...
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-red-100 to-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading customers</h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <Button 
                variant="outline" 
                onClick={loadCustomers}
                className="hover:bg-blue-50 hover:border-blue-300"
              >
                Retry
              </Button>
            </div>
          ) : !filteredCustomers.length ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                <Building2 className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500 mb-6">
                {search ? 'Try adjusting your search criteria.' : 'Get started by adding your first customer.'}
              </p>
              {search ? (
                <Button 
                  variant="ghost" 
                  onClick={() => setSearch('')}
                  className="hover:bg-blue-50"
                >
                  Clear search
                </Button>
              ) : (
                <Button 
                  onClick={() => router.push('/admin/customers/new')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Customer
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 min-w-[200px]">Company</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Industry & Location</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Contact</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700">Assets</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700">Tickets</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700">Status</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                            {customer.companyName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <button 
                              onClick={() => router.push(`/admin/customers/${customer.id}`)}
                              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left"
                            >
                              {customer.companyName}
                            </button>
                            {customer.serviceZone?.name && (
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {customer.serviceZone.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {customer.industry ? (
                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                              {customer.industry}
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-400">No industry</span>
                          )}
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-1" />
                            {customer.address || 'No address'}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {customer.contacts && customer.contacts.length > 0 ? (
                            <>
                              {customer.contacts[0]?.name && (
                                <div className="font-medium text-gray-900">{customer.contacts[0].name}</div>
                              )}
                              {customer.contacts[0]?.email && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <Mail className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                  <a 
                                    href={`mailto:${customer.contacts[0].email}`} 
                                    className="hover:underline truncate hover:text-blue-600"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {customer.contacts[0].email}
                                  </a>
                                </div>
                              )}
                              {customer.contacts[0]?.phone && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <Phone className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                  <a 
                                    href={`tel:${customer.contacts[0].phone}`}
                                    className="hover:underline hover:text-blue-600"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {customer.contacts[0].phone}
                                  </a>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm text-gray-400 flex items-center">
                              <Users className="h-3.5 w-3.5 mr-1" />
                              {customer._count?.contacts ? `${customer._count.contacts} contacts` : 'No contacts'}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Badge 
                          variant="outline" 
                          className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                        >
                          {customer._count?.assets || 0}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Badge 
                          variant="outline" 
                          className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                        >
                          {customer._count?.tickets || 0}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Badge 
                          className={cn(
                            'capitalize font-medium',
                            customer.isActive 
                              ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
                          )}
                          variant="outline"
                        >
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-blue-50"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/customers/${customer.id}`)}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4 text-blue-500" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/customers/${customer.id}/edit`)}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4 text-green-500" />
                              Edit Customer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Customer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="border-t bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing page <span className="font-semibold">{page}</span> of{' '}
                  <span className="font-semibold">{totalPages}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className={
                            page === pageNum
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "hover:bg-blue-50 hover:border-blue-300"
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                    className="hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
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