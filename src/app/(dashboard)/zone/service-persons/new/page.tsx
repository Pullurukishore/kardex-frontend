'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
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

interface ServiceZone {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

const createServicePersonSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  serviceZoneIds: z.array(z.number()).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CreateServicePersonForm = z.infer<typeof createServicePersonSchema>;

export default function NewZoneServicePersonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serviceZones, setServiceZones] = useState<ServiceZone[]>([]);
  const [selectedZones, setSelectedZones] = useState<number[]>([]);
  const [created, setCreated] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateServicePersonForm>({
    resolver: zodResolver(createServicePersonSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      serviceZoneIds: [],
    },
  });

  // Fetch available service zones for the current zone user
  useEffect(() => {
    const fetchZoneServiceZones = async () => {
      try {
        // Use zone-specific endpoint to get only zones the current user has access to
        const response = await apiClient.get('/zone/attendance/service-zones');
        
        if (response?.data) {
          const zones = Array.isArray(response.data) 
            ? response.data 
            : response.data.data || [];
          
          setServiceZones(zones);
          
          // Auto-select all available zones since zone user should only see their zones
          const activeZoneIds = zones.filter((zone: ServiceZone) => zone.isActive).map((zone: ServiceZone) => zone.id);
          setSelectedZones(activeZoneIds);
          setValue('serviceZoneIds', activeZoneIds);
        }
      } catch (error) {
        console.error('Error fetching zone service zones:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch available service zones',
          variant: 'destructive',
        });
      }
    };
    
    fetchZoneServiceZones();
  }, [setValue]);

  const handleZoneToggle = (zoneId: number) => {
    const newSelectedZones = selectedZones.includes(zoneId)
      ? selectedZones.filter(id => id !== zoneId)
      : [...selectedZones, zoneId];
    
    setSelectedZones(newSelectedZones);
    setValue('serviceZoneIds', newSelectedZones);
  };

  const onSubmit = async (data: CreateServicePersonForm) => {
    try {
      setLoading(true);

      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        password: data.password,
        serviceZoneIds: selectedZones,
      };

      // Use general endpoint for creating service persons (backend will handle zone restrictions)
      const response = await apiClient.post('/service-persons', payload);
      
      console.log('Service person creation response:', response);
      
      // Check if response indicates success (handle different response formats)
      if (response.data && !response.data.success && response.data.error) {
        throw new Error(response.data.error || 'Failed to create service person');
      }

      toast({
        title: 'Success',
        description: 'Service person created successfully in your zone',
      });

      // Show success screen, then redirect shortly after
      setCreated(true);
    } catch (error: any) {
      console.error('Error creating service person:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create service person',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (created) {
      const timeoutId = setTimeout(() => {
        router.push('/zone/service-persons');
        router.refresh();
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [created, router]);

  if (created) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle>Service Person Created</CardTitle>
            <CardDescription>Redirecting to the Zone Service Persons list...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-3">
              <Link href="/zone/service-persons">
                <Button>
                  Go to Service Persons
                </Button>
              </Link>
              <Link href="/zone/service-persons/new">
                <Button variant="outline">
                  Create Another
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
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
          <h1 className="text-2xl font-bold">Create Zone Service Person</h1>
          <p className="text-muted-foreground">
            Add a new service person to your zone
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the basic details for the new service person
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter full name"
                  {...register('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number (e.g., 9876543210)"
                {...register('phone')}
                className={errors.phone ? 'border-red-500' : ''}
              />
              <p className="text-sm text-muted-foreground">
                Phone number is required for WhatsApp notifications
              </p>
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  {...register('password')}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
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
              Service person will be assigned to your zone. You can modify these assignments later if you have access to multiple zones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {serviceZones.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No service zones available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You don't have access to any service zones or no zones are available.
                </p>
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
                  The service person will be assigned to the selected zones upon creation.
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
          <Button type="submit" disabled={loading || selectedZones.length === 0}>
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Service Person
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}