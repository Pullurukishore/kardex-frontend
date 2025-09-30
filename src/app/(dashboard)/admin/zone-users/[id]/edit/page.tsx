'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api';

type ServiceZone = { id: number; name: string; description?: string | null; isActive: boolean };
type ZoneUser = {
  id: number;
  email: string;
  name?: string | null;
  isActive: boolean;
  role: string;
  serviceZones: Array<{ serviceZone: { id: number; name: string } }>;
};

const formSchema = z.object({
  serviceZoneIds: z.array(z.number()).min(1, 'Please select at least one service zone')
});

type FormValues = z.infer<typeof formSchema>;

export default function EditZoneUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const userId = useMemo(() => Number(params?.id), [params?.id]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zoneUser, setZoneUser] = useState<ZoneUser | null>(null);
  const [serviceZones, setServiceZones] = useState<ServiceZone[]>([]);
  const [selectedZones, setSelectedZones] = useState<number[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { serviceZoneIds: [] }
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!userId || Number.isNaN(userId)) return;
      setLoading(true);
      try {
        const [userRes, zonesRes] = await Promise.all([
          apiClient.get(`/zone-users/${userId}`),
          // fetch active zones
          apiClient.get('/service-zones', { params: { limit: 100, includeInactive: false } })
        ]);

        const user: ZoneUser = userRes.data;
        const zones = Array.isArray(zonesRes.data)
          ? zonesRes.data
          : zonesRes.data?.data ?? [];

        setZoneUser(user);
        setServiceZones(zones);

        const assigned = (user.serviceZones || []).map((z) => z.serviceZone.id);
        setSelectedZones(assigned);
        form.reset({ serviceZoneIds: assigned });
      } catch (error: any) {
        console.error('Failed to load zone user data:', error);
        toast({
          title: 'Error',
          description: error?.response?.data?.message || 'Failed to load zone user details',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const onSubmit = async (values: FormValues) => {
    if (!userId) return;
    setSaving(true);
    try {
      await apiClient.put(`/zone-users/${userId}`, { serviceZoneIds: values.serviceZoneIds });
      toast({ title: 'Success', description: 'Zone assignments updated successfully' });
      router.push('/admin/zone-users');
      router.refresh();
    } catch (error: any) {
      console.error('Failed to update zone assignments:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to update zone assignments',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild title="Back to Zone Users">
            <Link href="/admin/zone-users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Zone User</h1>
            {zoneUser && (
              <p className="text-sm text-muted-foreground">{zoneUser.email}</p>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zone Assignments</CardTitle>
          <CardDescription>
            {loading
              ? 'Loading user and zones...'
              : 'Select the service zones that this user should be assigned to'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* User info (read-only) */}
              {zoneUser && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Name</div>
                    <div className="font-medium">{zoneUser.name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">{zoneUser.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="font-medium">{zoneUser.isActive ? 'Active' : 'Inactive'}</div>
                  </div>
                </div>
              )}

              {/* Zones */}
              <FormField
                control={form.control}
                name="serviceZoneIds"
                render={() => (
                  <FormItem>
                    <FormLabel>Service Zones</FormLabel>
                    <div className="space-y-2">
                      {serviceZones.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No service zones available.</p>
                      ) : (
                        <>
                          {serviceZones
                            .filter((z) => z.isActive)
                            .map((zone) => (
                              <div key={zone.id} className="flex items-start space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={selectedZones.includes(zone.id)}
                                    onCheckedChange={(checked) => {
                                      const updated = checked
                                        ? [...selectedZones, zone.id]
                                        : selectedZones.filter((id) => id !== zone.id);
                                      setSelectedZones(updated);
                                      form.setValue('serviceZoneIds', updated, { shouldValidate: true });
                                    }}
                                  />
                                </FormControl>
                                <div className="grid gap-1.5 leading-none">
                                  <label className="text-sm font-medium leading-none">
                                    {zone.name}
                                  </label>
                                  {zone.description && (
                                    <p className="text-sm text-muted-foreground">{zone.description}</p>
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
                              form.setValue('serviceZoneIds', [], { shouldValidate: true });
                            }}
                            className="mt-2"
                          >
                            Clear Selection
                          </Button>
                        </>
                      )}
                    </div>
                    <FormDescription>
                      Assign the user to one or more service zones.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end gap-4">
                <Link href="/admin/zone-users">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={saving || loading}>
                  {saving ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
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

