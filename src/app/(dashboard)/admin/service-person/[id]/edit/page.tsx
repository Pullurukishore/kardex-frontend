'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getServicePerson, updateServicePerson, ServicePerson } from '@/services/servicePerson.service';
import { getServiceZones, ServiceZone } from '@/services/zone.service';

const updateServicePersonSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  confirmPassword: z.string().optional(),
  serviceZoneIds: z.array(z.number()).optional(),
}).refine((data) => {
  if (data.password && data.password.length > 0) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UpdateServicePersonForm = z.infer<typeof updateServicePersonSchema>;

export default function EditServicePersonPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [servicePerson, setServicePerson] = useState<ServicePerson | null>(null);
  const [serviceZones, setServiceZones] = useState<ServiceZone[]>([]);
  const [selectedZones, setSelectedZones] = useState<number[]>([]);

  const servicePersonId = parseInt(params.id as string);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<UpdateServicePersonForm>({
    resolver: zodResolver(updateServicePersonSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      serviceZoneIds: [],
    },
  });

  // Fetch service person and zones
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        
        const [personData, zonesResult] = await Promise.all([
          getServicePerson(servicePersonId),
          getServiceZones({ limit: 100 })
        ]);

        setServicePerson(personData);
        setServiceZones(zonesResult.data || zonesResult);

        // Set form values
        reset({
          email: personData.email,
          password: '',
          confirmPassword: '',
        });

        // Set selected zones
        const assignedZoneIds = personData.serviceZones.map(z => z.serviceZone.id);
        setSelectedZones(assignedZoneIds);
        setValue('serviceZoneIds', assignedZoneIds);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch service person details',
          variant: 'destructive',
        });
      } finally {
        setInitialLoading(false);
      }
    };

    if (servicePersonId) {
      fetchData();
    }
  }, [servicePersonId, reset, setValue]);

  const handleZoneToggle = (zoneId: number) => {
    const newSelectedZones = selectedZones.includes(zoneId)
      ? selectedZones.filter(id => id !== zoneId)
      : [...selectedZones, zoneId];
    
    setSelectedZones(newSelectedZones);
    setValue('serviceZoneIds', newSelectedZones);
  };

  const onSubmit = async (data: UpdateServicePersonForm) => {
    try {
      setLoading(true);

      const payload: any = {
        email: data.email,
        serviceZoneIds: selectedZones,
      };

      // Only include password if it's provided
      if (data.password && data.password.length > 0) {
        payload.password = data.password;
      }

      await updateServicePerson(servicePersonId, payload);

      toast({
        title: 'Success',
        description: 'Service person updated successfully',
      });

      router.push(`/admin/service-person/${servicePersonId}`);
    } catch (error: any) {
      console.error('Error updating service person:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update service person',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading service person details...</div>
        </div>
      </div>
    );
  }

  if (!servicePerson) {
    return (
      <div className="container mx-auto py-6">
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
    <div className="container mx-auto py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/service-person/${servicePersonId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Details
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Service Person</h1>
          <p className="text-muted-foreground">
            Update service person details and zone assignments
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update the basic details for this service person
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  {...register('password')}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Leave blank to keep the current password
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zone Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Zone Assignment</CardTitle>
            <CardDescription>
              Update the service zones this person is assigned to
            </CardDescription>
          </CardHeader>
          <CardContent>
            {serviceZones.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No service zones available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create service zones first before assigning them to service persons.
                </p>
                <Link href="/admin/service-zones/new" className="mt-4 inline-block">
                  <Button variant="outline" size="sm">
                    Create Service Zone
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {serviceZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`zone-${zone.id}`}
                      checked={selectedZones.includes(zone.id)}
                      onCheckedChange={() => handleZoneToggle(zone.id)}
                      disabled={!zone.isActive}
                    />
                    <div className="flex-1 min-w-0">
                      <Label
                        htmlFor={`zone-${zone.id}`}
                        className={`font-medium cursor-pointer ${!zone.isActive ? 'text-muted-foreground' : ''}`}
                      >
                        {zone.name}
                        {!zone.isActive && (
                          <span className="ml-2 text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </Label>
                      {zone.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {zone.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedZones.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Selected zones: {selectedZones.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Changes will be applied when you save the form.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href={`/admin/service-person/${servicePersonId}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                Updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Service Person
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
