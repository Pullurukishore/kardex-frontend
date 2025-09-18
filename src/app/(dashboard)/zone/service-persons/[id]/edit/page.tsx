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
import { apiClient } from '@/lib/api';

// Local helper type to handle either wrapped or raw responses
type ApiResponse<T> = { success?: boolean; data?: T } | T;

interface ServiceZone {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

interface ServiceZoneRef {
  id: number;
  name: string;
}

interface ServicePerson {
  id: number;
  email: string;
  name?: string;
  phone?: string;
  isActive: boolean;
  serviceZones: Array<{
    serviceZone: ServiceZoneRef;
  }>;
}

type ServicePersonResponse = ServicePerson;

const updateServicePersonSchema = z.object({
  id: z.number(),
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

export default function EditZoneServicePersonPage() {
  const params = useParams();
  const router = useRouter();
  const servicePersonId = Number(params.id);
  
  const [servicePerson, setServicePerson] = useState<ServicePerson | null>(null);
  const [zones, setZones] = useState<ServiceZone[]>([]);
  const [selectedZones, setSelectedZones] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<UpdateServicePersonForm>({
    resolver: zodResolver(updateServicePersonSchema),
    defaultValues: {
      id: servicePersonId,
      email: '',
      password: '',
      confirmPassword: '',
      serviceZoneIds: [],
    },
  });

  const loadZones = async () => {
    try {
      console.log('Loading zones for zone user...');
      // Use zone-specific endpoint to get only zones the current user has access to
      const response = await apiClient.get('/zone/attendance/service-zones');
      console.log('Zone service zones response:', response);
      
      const zones = Array.isArray(response.data) 
        ? response.data 
        : response.data.data || [];
      
      console.log('Processed zones:', zones);
      setZones(zones);
    } catch (error) {
      console.error('Error loading zones:', error);
      toast({
        title: 'Error',
        description: 'Failed to load service zones for your zone',
        variant: 'destructive',
      });
    }
  };

  const loadServicePerson = async (id: number) => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<ApiResponse<ServicePerson>>(`/service-persons/${id}`);
      console.log('Service person API response:', response);

      // Unwrap response: handle both raw object and { data: object }
      const unwrapped: any = (response && (response as any).data !== undefined)
        ? (response as any).data
        : (response as any);

      if (!unwrapped || typeof unwrapped !== 'object') {
        console.error('Invalid service person data received:', unwrapped);
        console.log('Full response:', response);
        setServicePerson(null);
        return;
      }
      
      console.log('Processing service person data:', unwrapped);
      
      // Use a strongly typed variable for the rest of the function
      const sp: ServicePerson = unwrapped as ServicePerson;
      setServicePerson(sp);
      
      // Extract service zones, handling different possible structures
      const serviceZones: any[] = (sp as any).serviceZones || [];
      console.log('Service zones from API:', serviceZones);
      
      // Extract zone IDs from serviceZones array
      const zoneIds: number[] = serviceZones
        .map((zoneItem: any): number | null => {
          if (!zoneItem) return null;
          // Handle different possible zone object structures
          if (zoneItem.serviceZone?.id) return zoneItem.serviceZone.id;
          if ('id' in zoneItem) return (zoneItem as any).id;
          return null;
        })
        .filter((id: number | null): id is number => id !== null);
        
      console.log('Extracted zone IDs:', zoneIds);
      
      // Reset form with service person data
      reset({
        id: sp.id,
        email: sp.email || '',
        password: '',
        confirmPassword: '',
        serviceZoneIds: zoneIds,
      });
      
      // Set selected zones based on the service person's zones
      setSelectedZones(zoneIds);
      setValue('serviceZoneIds', zoneIds);
      
    } catch (error) {
      console.error('Error loading service person:', error);
      toast({
        title: 'Error',
        description: 'Failed to load service person details',
        variant: 'destructive',
      });
      setServicePerson(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([loadZones(), loadServicePerson(servicePersonId)]);
    };

    if (servicePersonId) {
      fetchData();
    }
  }, [servicePersonId]);

  const handleZoneToggle = (zoneId: number) => {
    const newSelectedZones = selectedZones.includes(zoneId)
      ? selectedZones.filter(id => id !== zoneId)
      : [...selectedZones, zoneId];
    
    setSelectedZones(newSelectedZones);
    setValue('serviceZoneIds', newSelectedZones);
  };

  const onSubmit = async (data: UpdateServicePersonForm) => {
    console.log('Form submission data:', data);
    
    // Validate required fields
    if (!data.email || !data.email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Email address is required',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate password if provided
    if (data.password && data.password.length > 0) {
      if (data.password.length < 6) {
        toast({
          title: 'Validation Error',
          description: 'Password must be at least 6 characters long',
          variant: 'destructive',
        });
        return;
      }
      
      if (data.password !== data.confirmPassword) {
        toast({
          title: 'Validation Error',
          description: 'Passwords do not match',
          variant: 'destructive',
        });
        return;
      }
    }
    
    try {
      setLoading(true);
      
      // Prepare update data
      const updateData = {
        email: data.email,
        password: data.password && data.password.length > 0 ? data.password : undefined,
        serviceZoneIds: data.serviceZoneIds,
      };
      
      console.log('Updating service person with data:', updateData);
      
      // Use general service person update endpoint (backend will handle zone restrictions)
      const response = await apiClient.put(`/service-persons/${servicePersonId}`, updateData);
      
      if (response.data && !response.data.success && response.data.error) {
        throw new Error(response.data.error || 'Failed to update service person');
      }
      
      toast({
        title: 'Success!',
        description: 'Service person updated successfully',
      });
      
      // Redirect to zone service persons list after a short delay
      setTimeout(() => {
        router.push('/zone/service-persons');
        router.refresh();
      }, 1500);
      
    } catch (error: any) {
      console.error('Error updating service person:', error);
      
      let errorMessage = 'Failed to update service person';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!servicePerson) {
    return (
      <div>
        <div className="text-center">
          <h2 className="text-xl font-semibold">Service person not found</h2>
          <p className="text-gray-500 mt-2">The requested service person could not be loaded or is not in your zone.</p>
          <Button className="mt-4" onClick={() => router.push('/zone/service-persons')}>
            Back to Zone Service Persons
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/zone/service-persons">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Zone Service Persons
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Zone Service Person</h1>
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
            {/* Hidden ID field */}
            <input
              type="hidden"
              {...register('id')}
            />
            
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
              Update the service zones this person is assigned to within your zone
            </CardDescription>
          </CardHeader>
          <CardContent>
            {zones.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No service zones available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You don't have access to any service zones or no zones are available.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {zones.map((zone: ServiceZone) => (
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
          <Link href="/zone/service-persons">
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