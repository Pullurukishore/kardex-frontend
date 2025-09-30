'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Mail, Shield, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
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
import { getServicePerson, deleteServicePerson, ServicePerson } from '@/services/servicePerson.service';

export default function ServicePersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [servicePerson, setServicePerson] = useState<ServicePerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const servicePersonId = parseInt(params.id as string);

  useEffect(() => {
    const fetchServicePerson = async () => {
      try {
        setLoading(true);
        const data = await getServicePerson(servicePersonId);
        setServicePerson(data);
      } catch (error) {
        console.error('Error fetching service person:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch service person details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (servicePersonId) {
      fetchServicePerson();
    }
  }, [servicePersonId]);

  const handleDelete = async () => {
    try {
      await deleteServicePerson(servicePersonId);
      toast({
        title: 'Success',
        description: 'Service person deleted successfully',
      });
      router.push('/admin/service-person');
    } catch (error: any) {
      console.error('Error deleting service person:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete service person',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading service person details...</div>
        </div>
      </div>
    );
  }

  if (!servicePerson) {
    return (
      <div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Service Person Not Found</h1>
          <p className="text-muted-foreground mt-2">The requested service person could not be found.</p>
          <Link href="/admin/service-person" className="mt-4 inline-block">
            <Button>Back to Service Persons</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/service-person">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Service Persons
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Service Person Details</h1>
            <p className="text-muted-foreground">
              View and manage service person information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/service-person/${servicePersonId}/edit`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{servicePerson.email}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={servicePerson.isActive ? 'default' : 'secondary'}>
                      {servicePerson.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <div className="mt-1 font-mono text-sm">{servicePerson.id}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <div className="mt-1">
                    <Badge variant="outline">Service Person</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Zones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Assigned Service Zones
              </CardTitle>
              <CardDescription>
                Service zones this person is responsible for
              </CardDescription>
            </CardHeader>
            <CardContent>
              {servicePerson.serviceZones.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No zones assigned</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This service person is not assigned to any zones yet.
                  </p>
                  <div className="mt-6">
                    <Link href={`/admin/service-person/${servicePersonId}/edit`}>
                      <Button variant="outline" size="sm">
                        Assign Zones
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {servicePerson.serviceZones.map((zone) => (
                    <div
                      key={zone.serviceZone.id}
                      className="p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{zone.serviceZone.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          Zone {zone.serviceZone.id}
                        </Badge>
                      </div>
                      {zone.serviceZone.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {zone.serviceZone.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics and Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Assigned Zones</span>
                <span className="font-semibold">{servicePerson.serviceZones.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Status</span>
                <Badge variant={servicePerson.isActive ? 'default' : 'secondary'} className="text-xs">
                  {servicePerson.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/admin/service-person/${servicePersonId}/edit`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Details
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Person
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Person</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {servicePerson.email}? This action cannot be undone.
              All zone assignments will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
