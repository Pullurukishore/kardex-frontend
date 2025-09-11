"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2, Users, MapPin, BarChart3 } from 'lucide-react';
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
import { MoreHorizontal } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service Zones</h1>
          <p className="text-muted-foreground">
            Manage service zones for organizing customer locations
          </p>
        </div>
        <Button onClick={() => router.push('/admin/service-zones/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service Zone
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Service Zones</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search zones..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <p>Loading service zones...</p>
            </div>
          ) : filteredZones.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <p>No service zones found</p>
              <Button 
                variant="link" 
                className="mt-2"
                onClick={() => router.push('/admin/service-zones/new')}
              >
                Create a new service zone
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Service Persons</TableHead>
                  <TableHead>Zone Users</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredZones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.name}</TableCell>
                    <TableCell>
                      <Badge variant={zone.isActive ? 'default' : 'secondary'}>
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{zone._count?.servicePersons || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>{zone._count?.zoneUsers || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{zone._count?.customers || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span>{zone._count?.tickets || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {zone.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      {new Date(zone.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewStats(zone)}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(zone)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(zone)}
                            className="text-destructive"
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
