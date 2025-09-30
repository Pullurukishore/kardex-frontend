'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Mail, User, Shield, Phone, Hash } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ZoneUserActions } from '@/components/admin/ZoneUserActions';
import { apiClient } from '@/lib/api';

type ZoneUser = {
  id: number;
  email: string;
  name?: string | null;
  role: string;
  isActive: boolean;
  phone?: string | null;
  serviceZones: Array<{
    serviceZone: { id: number; name: string };
  }>;
};

export default function ZoneUserDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const userId = useMemo(() => Number(params?.id), [params?.id]);

  const [loading, setLoading] = useState(true);
  const [zoneUser, setZoneUser] = useState<ZoneUser | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId || Number.isNaN(userId)) return;
      setLoading(true);
      try {
        const res = await apiClient.get(`/zone-users/${userId}`);
        setZoneUser(res.data);
      } catch (error: any) {
        console.error('Failed to fetch zone user:', error);
        toast({
          title: 'Error',
          description: error?.response?.data?.message || 'Failed to fetch zone user',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId, toast]);

  const onDeleteSuccess = () => {
    router.push('/admin/zone-users');
    router.refresh();
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
            <h1 className="text-3xl font-bold">Zone User Details</h1>
            {zoneUser && <p className="text-sm text-muted-foreground">{zoneUser.email}</p>}
          </div>
        </div>
        {zoneUser && (
          <div className="flex items-center gap-2">
            <Link href={`/admin/zone-users/${zoneUser.id}/edit`}>
              <Button variant="secondary" className="flex items-center gap-2">
                <Pencil className="h-4 w-4" /> Edit Zones
              </Button>
            </Link>
            <ZoneUserActions user={{ id: zoneUser.id, email: zoneUser.email }} onDeleteSuccess={onDeleteSuccess} />
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>
            {loading ? 'Loading user...' : 'Basic details and current status'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {zoneUser ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {zoneUser.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" /> {zoneUser.name || '-'}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Mail className="h-4 w-4" /> {zoneUser.email}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Role</div>
                <div className="mt-1">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200" variant="outline">
                    <Shield className="h-3 w-3 mr-1" /> {zoneUser.role.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="mt-1">
                  <Badge className={zoneUser.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                    {zoneUser.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="mt-1 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{zoneUser.phone || '-'}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">User ID</div>
                <div className="mt-1 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{zoneUser.id}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No data available.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Service Zones</CardTitle>
          <CardDescription>
            {loading ? 'Loading zones...' : 'Zones assigned to this user'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {zoneUser && zoneUser.serviceZones && zoneUser.serviceZones.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {zoneUser.serviceZones.map((z) => (
                <Badge key={z.serviceZone.id} variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                  {z.serviceZone.name}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No zones assigned.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

