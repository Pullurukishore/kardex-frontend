"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Users, MapPin, BarChart3, Building, UserCheck, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getServiceZones, deleteServiceZone, ServiceZonesResponse } from '@/services/zone.service';
import { useToast } from '@/components/ui/use-toast';
import type { ServiceZone } from '@/types/zone';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Remove duplicate interface - it's already exported from zone.service.ts

export default function ServiceZonesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [apiResponse, setApiResponse] = useState<ServiceZonesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<ServiceZone | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Derived state
  const zones = apiResponse?.data || [];
  const pagination = apiResponse?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  };

  useEffect(() => {
    const fetchZones = async () => {
      setIsLoading(true);
      try {
        const response = await getServiceZones(pagination.page, pagination.limit);
        setApiResponse(response);
      } catch (error) {
        console.error('Error fetching service zones:', error);
        setApiResponse({
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchZones();
  }, [pagination.page, pagination.limit]);

  const filteredZones = searchTerm
    ? zones.filter((zone: ServiceZone) => 
        zone.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (zone.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
    : zones;

  const handleDelete = async (zone: ServiceZone) => {
    setZoneToDelete(zone);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!zoneToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteServiceZone(zoneToDelete.id);
      toast({
        title: 'Success',
        description: 'Service zone deleted successfully',
      });
      // Refresh the list
      const response = await getServiceZones(pagination.page, pagination.limit);
      setApiResponse(response);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete service zone',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setZoneToDelete(null);
    }
  };

  const handleEdit = (zone: ServiceZone) => {
    router.push(`/admin/service-zones/${zone.id}/edit`);
  };

  const handleViewStats = (zone: ServiceZone) => {
    router.push(`/admin/service-zones/${zone.id}`);
  };

  // Calculate stats
  const totalZones = zones.length;
  const activeZones = zones.filter(z => z.isActive).length;
  const inactiveZones = totalZones - activeZones;
  const totalServicePersons = zones.reduce((acc, zone) => acc + (zone._count?.servicePersons || 0), 0);
  const totalCustomers = zones.reduce((acc, zone) => acc + (zone._count?.customers || 0), 0);
  const totalTickets = zones.reduce((acc, zone) => acc + (zone._count?.tickets || 0), 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-green-600 via-teal-600 to-green-800 p-6 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Service Zones</h1>
            <p className="text-green-100">
              Manage service zones for organizing customer locations
            </p>
          </div>
          <Button 
            onClick={() => router.push('/admin/service-zones/new')}
            className="bg-white text-green-600 hover:bg-green-50 shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Service Zone
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Zones</p>
                <p className="text-2xl font-bold text-green-900">{totalZones}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Active Zones</p>
                <p className="text-2xl font-bold text-blue-900">{activeZones}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Service Personnel</p>
                <p className="text-2xl font-bold text-purple-900">{totalServicePersons}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Total Customers</p>
                <p className="text-2xl font-bold text-orange-900">{totalCustomers}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <CardTitle className="text-gray-800">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search zones by name or description..."
                  className="pl-10 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Service Zones Table */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 rounded-t-lg">
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            Service Zones ({filteredZones.length})
          </CardTitle>
          <CardDescription>
            Manage and monitor your service zones
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-lg text-gray-600">Loading service zones...</div>
            </div>
          ) : filteredZones.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center mb-4">
                <MapPin className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No service zones found</h3>
              <p className="text-gray-500 mb-6">
                Get started by creating your first service zone.
              </p>
              <Button 
                onClick={() => router.push('/admin/service-zones/new')}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Service Zone
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Zone Details</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Personnel</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Customers</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Tickets</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Created</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100">
                  {filteredZones.map((zone, index) => (
                    <TableRow key={zone.id} className="hover:bg-gradient-to-r hover:from-green-50/50 hover:to-teal-50/50 transition-all duration-200">
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                            {zone.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{zone.name}</div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {zone.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge 
                          variant={zone.isActive ? 'default' : 'secondary'}
                          className={zone.isActive 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }
                        >
                          {zone.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-md">
                            <Users className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-700">{zone._count?.servicePersons || 0}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-md">
                          <Building className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-700">{zone._count?.customers || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md">
                          <BarChart3 className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">{zone._count?.tickets || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-gray-600">
                        {new Date(zone.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleViewStats(zone)}>
                              <BarChart3 className="mr-2 h-4 w-4 text-blue-500" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(zone)}>
                              <Edit className="mr-2 h-4 w-4 text-green-500" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(zone)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the service zone "{zoneToDelete?.name}". 
              This action cannot be undone and will fail if there are associated customers, 
              service persons, or tickets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
