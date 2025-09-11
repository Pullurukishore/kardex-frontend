'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const zoneUserFormSchema = z
  .object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    serviceZoneIds: z.array(z.number()).min(1, 'Please select at least one service zone'),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ZoneUserFormValues = z.infer<typeof zoneUserFormSchema>;

export default function NewZoneUserPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [serviceZones, setServiceZones] = useState<
    Array<{ id: number; name: string; description?: string; isActive: boolean }>
  >([]);
  const [selectedZones, setSelectedZones] = useState<number[]>([]);

  const form = useForm<ZoneUserFormValues>({
    resolver: zodResolver(zoneUserFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      serviceZoneIds: [],
      isActive: true,
    },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    const fetchServiceZones = async () => {
      try {
        const response = await apiClient.get('/service-zones', {
          params: {
            limit: 100,
            includeInactive: false,
          },
        });

        if (response?.data) {
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

  const onSubmit = async (values: ZoneUserFormValues) => {
    try {
      const payload = {
        name: values.name,
        email: values.email,
        password: values.password,
        serviceZoneIds: values.serviceZoneIds,
        isActive: values.isActive,
        role: 'ZONE_USER', // Set role to ZONE_USER
      };

      // Single API call to create user and assign zones
      await apiClient.post('/zone-users/create-with-zones', payload);
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Zone user created and assigned to zones successfully',
      });
      
      // Redirect to zone users list
      router.push('/admin/zone-users');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating zone user:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create zone user',
        variant: 'destructive',
      });
    } finally {
      // No need to manually set loading state as formState.isSubmitting handles it
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/zone-users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">New Zone User</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zone User Details</CardTitle>
          <CardDescription>
            Fill in the details for the new zone user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter user's full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="user@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter a strong password" {...field} />
                      </FormControl>
                      <FormDescription>
                        Password must be at least 6 characters long
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm the password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Service Zones */}
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium mb-2">Service Zones</h3>
                <div className="space-y-2">
                  {serviceZones.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No service zones available. Please create service zones first.
                    </p>
                  ) : (
                    <>
                      {serviceZones
                        .filter((zone) => zone.isActive)
                        .map((zone) => (
                          <div key={zone.id} className="flex items-start space-x-2">
                            <Checkbox
                              id={`zone-${zone.id}`}
                              checked={selectedZones.includes(zone.id)}
                              onCheckedChange={(checked) => {
                                const newZones = checked
                                  ? [...selectedZones, zone.id]
                                  : selectedZones.filter((id) => id !== zone.id);
                                setSelectedZones(newZones);
                                form.setValue('serviceZoneIds', newZones, { shouldValidate: true });
                              }}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label
                                htmlFor={`zone-${zone.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {zone.name}
                              </label>
                              {zone.description && (
                                <p className="text-sm text-muted-foreground">
                                  {zone.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedZones([]);
                          form.setValue('serviceZoneIds', []);
                        }}
                        className="mt-2"
                      >
                        Clear Selection
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Active Checkbox */}
              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          This will determine if the user can log in to the system.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-4">
                <Link href="/admin/zone-users">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                      Creating...
                    </>
                  ) : (
                    'Create Zone User'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
