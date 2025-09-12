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
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  serviceZoneIds: z.array(z.number()).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CreateServicePersonForm = z.infer<typeof createServicePersonSchema>;

export default function NewServicePersonPage() {
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
      password: '',
      confirmPassword: '',
      serviceZoneIds: [],
    },
  });

  // Fetch available service zones
  useEffect(() => {
    const fetchServiceZones = async () => {
      try {
        const response = await apiClient.get('/service-zones', {
          params: { 
            limit: 100,
            includeInactive: true
          }
        });
        
        if (response?.data) {
          // The API returns { data: [...], pagination: {...} }
          const zones = Array.isArray(response.data) 
            ? response.data 
            : response.data.data || [];
          
          setServiceZones(zones);
        }
      } catch (error) {
        console.error('Error fetching service zones:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch service zones',
          variant: 'destructive',
        });
      }
    };
    
    fetchServiceZones();
  }, []);

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
        password: data.password,
        serviceZoneIds: selectedZones,
      };

      const response = await apiClient.post('/service-persons', payload);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create service person');
      }

      toast({
        title: 'Success',
        description: 'Service person created successfully',
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
        router.push('/admin/service-person');
        router.refresh();
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [created, router]);

  if (created) {
    return (
      <div className="container mx-auto py-12 max-w-lg">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle>Service Person Created</CardTitle>
            <CardDescription>Redirecting to the Service Persons list...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-3">
              <Link href="/admin/service-person">
                <Button>
                  Go to Service Persons
                </Button>
              </Link>
              <Link href="/admin/service-person/new">
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
    <div className="container mx-auto py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/service-person">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Service Persons
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Service Person</h1>
          <p className="text-muted-foreground">
            Add a new service person and assign them to service zones
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
              Select the service zones this person will be assigned to. You can modify these assignments later.
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
                  The service person will be assigned to the selected zones upon creation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/admin/service-person">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
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
