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
import { getServicePerson, updateServicePerson } from '@/services/servicePerson.service';
import { getServiceZones } from '@/services/zone.service';
import type { ServicePerson as ServicePersonType, ServiceZone as ServiceZoneType } from '@/types/service';
import type { ServiceZone as ZoneServiceZone } from '@/types/zone';
import type { ServicePerson as ServicePersonServiceType } from '@/services/servicePerson.service';
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

// Type conversion function to convert ZoneServiceZone to ServiceZoneType
const convertZoneServiceZoneToServiceZone = (zone: ZoneServiceZone): ServiceZoneType => ({
  id: zone.id,
  name: zone.name,
  description: zone.description || undefined,
  isActive: zone.isActive,
  createdAt: zone.createdAt,
  updatedAt: zone.updatedAt,
});

// Type conversion function to convert ServiceZone from servicePerson.service to ServiceZoneType
const convertServicePersonServiceZoneToServiceZone = (serviceZone: any): ServiceZoneType => ({
  id: serviceZone.id,
  name: serviceZone.name,
  description: serviceZone.description || undefined,
  isActive: serviceZone.isActive,
  createdAt: serviceZone.createdAt,
  updatedAt: serviceZone.updatedAt,
});

// Type conversion function to convert ServicePersonServiceType to ServicePersonType
const convertServicePersonServiceToType = (servicePerson: any): ServicePersonType => {
  console.log('Converting service person:', servicePerson);
  
  // Handle name field - API returns 'name' as null, but we need firstName and lastName
  let firstName = '';
  let lastName = '';
  if (servicePerson.name && typeof servicePerson.name === 'string') {
    const nameParts = servicePerson.name.split(' ');
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }
  
  return {
    id: servicePerson.id,
    email: servicePerson.email,
    firstName: firstName,
    lastName: lastName,
    phone: servicePerson.phone || undefined,
    isActive: servicePerson.isActive,
    serviceZones: servicePerson.serviceZones?.map((sz: any) => convertServicePersonServiceZoneToServiceZone(sz.serviceZone)) || [],
    createdAt: servicePerson.createdAt || new Date().toISOString(),
    updatedAt: servicePerson.updatedAt || new Date().toISOString(),
  };
};

export default function EditServicePersonPage() {
  const params = useParams();
  const router = useRouter();
  const servicePersonId = Number(params.id); // Convert to number
  
  const [servicePerson, setServicePerson] = useState<ServicePersonType | null>(null);
  const [zones, setZones] = useState<ServiceZoneType[]>([]);
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

  // Debug: Log form errors
  console.log('Form errors:', errors);

  const loadZones = async () => {
    try {
      const response = await getServiceZones(1, 100); // Get first 100 zones
      const convertedZones = response.data.map(convertZoneServiceZoneToServiceZone);
      setZones(convertedZones || []);
    } catch (error) {
      console.error('Error loading zones:', error);
      toast({
        title: 'Error',
        description: 'Failed to load service zones',
        variant: 'destructive',
      });
    } finally {
      // Loading zones completed
    }
  };

  const loadServicePerson = async (id: number) => {
    try {
      console.log('Loading service person with ID:', id);
      const response = await getServicePerson(id);
      console.log('Service person response:', response);
      
      if (!response) {
        console.error('No response data received from API');
        setServicePerson(null);
        return;
      }
      
      try {
        const convertedServicePerson = convertServicePersonServiceToType(response);
        console.log('Converted service person:', convertedServicePerson);
        setServicePerson(convertedServicePerson);
        
        // Reset form with service person data
        reset({
          id: servicePersonId,
          email: convertedServicePerson.email || '',
          password: '', // Password should be empty for security
          confirmPassword: '', // Password should be empty for security
          serviceZoneIds: convertedServicePerson.serviceZones?.map(sz => sz.id) || [],
        });
        console.log('Form reset with service person data');
      } catch (conversionError) {
        console.error('Error converting service person:', conversionError);
        // If conversion fails, try to set the raw response
        setServicePerson(response as any);
        
        // Still try to reset form with basic data
        reset({
          id: servicePersonId,
          email: response.email || '',
          password: '',
          confirmPassword: '',
          serviceZoneIds: response.serviceZones?.map((sz: any) => sz.serviceZone.id) || [],
        });
        return;
      }
      
      // Set selected zones based on the service person's zones
      if (response && response.serviceZones) {
        const zoneIds = response.serviceZones.map(sz => sz.serviceZone.id);
        console.log('Setting selected zones:', zoneIds);
        setSelectedZones(zoneIds);
        setValue('serviceZoneIds', zoneIds);
      }
    } catch (error) {
      console.error('Error loading service person:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        response: error && typeof error === 'object' && 'response' in error ? error.response : 'No response'
      });
      toast({
        title: 'Error',
        description: `Failed to load service person: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
      setServicePerson(null); // Explicitly set to null to trigger the "not found" message
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
    console.log('onSubmit function called with data:', data);
    
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
      console.log('Form submission data:', data);
      
      // Prepare update data (only include fields expected by UpdateServicePersonPayload)
      const updateData = {
        email: data.email,
        password: data.password && data.password.length > 0 ? data.password : undefined,
        serviceZoneIds: data.serviceZoneIds,
      };
      
      console.log('Cleaned update data:', updateData);
      
      // Show loading toast
      const loadingToast = toast({
        title: 'Updating Service Person',
        description: 'Please wait while we update the service person...',
      });
      
      console.log('Calling updateServicePerson API...');
      console.log('About to call updateServicePerson with:', servicePersonId, updateData);
      
      try {
        const result = await updateServicePerson(servicePersonId, updateData);
        console.log('updateServicePerson API call successful:', result);
        console.log('Continuing execution after API call...');
      } catch (apiError) {
        console.error('updateServicePerson API call failed:', apiError);
        throw apiError; // Re-throw to be caught by the outer catch block
      }
      
      console.log('Reached code after API call - this should always execute if no error was thrown');
      
      // Show success toast
      toast({
        title: 'Success!',
        description: 'Service person updated successfully',
      });
      
      // Show detailed success message
      setTimeout(() => {
        toast({
          title: 'Update Complete',
          description: `Service person ${data.email} has been updated. Redirecting to details page...`,
        });
      }, 500);
      
      // Redirect to details page after a short delay
      setTimeout(() => {
        console.log('Redirecting to service person page...');
        console.log('Service person ID:', servicePersonId);
        console.log('Redirect URL:', `/admin/service-person/${servicePersonId}`);
        
        if (servicePersonId && !isNaN(servicePersonId)) {
          try {
            router.push(`/admin/service-person/${servicePersonId}`);
            console.log('Redirect initiated');
          } catch (redirectError: any) {
            console.error('Redirect failed:', redirectError);
            toast({
              title: 'Redirect Error',
              description: 'Update was successful but redirect failed. Please navigate manually.',
              variant: 'destructive',
            });
          }
        } else {
          console.error('Invalid service person ID for redirect:', servicePersonId);
          toast({
            title: 'Redirect Error',
            description: 'Update was successful but could not redirect due to invalid ID.',
            variant: 'destructive',
          });
        }
      }, 1500);
      
    } catch (error: any) {
      console.error('Error updating service person:', error);
      
      // Handle specific error messages
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
          <p className="text-gray-500 mt-2">The requested service person could not be loaded.</p>
          <Button className="mt-4" onClick={() => router.push('/admin/service-person')}>
            Back to Service Persons
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
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

      <form onSubmit={(e) => {
        console.log('Form submit event triggered');
        console.log('Current form errors before submit:', errors);
        e.preventDefault();
        handleSubmit((data) => {
          console.log('handleSubmit validation passed, calling onSubmit');
          onSubmit(data);
        }, (errors) => {
          console.log('handleSubmit validation failed:', errors);
        })(e);
      }} className="space-y-6">
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
              Update the service zones this person is assigned to
            </CardDescription>
          </CardHeader>
          <CardContent>
            {zones.length === 0 ? (
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
                {zones.map((zone: ServiceZoneType) => (
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
