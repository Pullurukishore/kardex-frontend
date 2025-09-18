'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api/axios';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RefreshCw, Users, Search, Building2, MapPin, Clock, Package, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';

interface Customer {
  id: number;
  companyName: string;
  address?: string;
  industry?: string;
  timezone?: string;
  isActive: boolean;
  serviceZone?: { id: number; name: string };
  assets?: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ZoneCustomersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 0 });

  const fetchCustomers = async (page = 1, limit = 10, query = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (query) params.set('search', query);
      params.set('isActive', 'true');
      const res = await api.get(`/customers?${params.toString()}`);
      const data = Array.isArray(res.data) ? { data: res.data, pagination: { total: res.data.length, page: 1, limit, totalPages: 1 } } : res.data;
      setCustomers(data.data || []);
      setPagination(data.pagination || { total: data.data?.length || 0, page, limit, totalPages: 1 });
    } catch (e) {
      // Silent fail handled by global interceptor redirect if unauthorized
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1, pagination.limit, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    fetchCustomers(1, pagination.limit, search.trim());
  };

  const handlePageChange = (nextPage: number) => {
    fetchCustomers(nextPage, pagination.limit, search.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Customers
          </h1>
          <p className="text-muted-foreground mt-1">Customers within your assigned service zones</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Directory
          </CardTitle>
          <CardDescription>Search and browse customers by name or address</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by company, address, or industry"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Timezone</TableHead>
                  <TableHead className="text-right">Assets</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-500" />
                        {c.companyName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        {c.serviceZone?.name || '—'}
                      </div>
                    </TableCell>
                    <TableCell>{c.industry || '—'}</TableCell>
                    <TableCell className="truncate max-w-[200px]" title={c.address || ''}>{c.address || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-500" />
                        {c.timezone || '—'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Package className="h-4 w-4 text-slate-500" />
                        {c.assets || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={c.isActive ? 'default' : 'secondary'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/zone/customers/${c.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/zone/customers/${c.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this customer?')) {
                                // Add delete logic here
                              }
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                      No customers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1 || loading} onClick={() => handlePageChange(pagination.page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages || loading} onClick={() => handlePageChange(pagination.page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
