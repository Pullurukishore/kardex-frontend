'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, ArrowLeft, Building2 } from 'lucide-react';

export default function EditCustomerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const customerId = params?.id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    address: '',
    industry: '',
    timezone: 'UTC',
    isActive: true,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/customers/${customerId}`);
        const c = res.data || {};
        setForm({
          companyName: c.companyName || '',
          address: c.address || '',
          industry: c.industry || '',
          timezone: c.timezone || 'UTC',
          isActive: c.isActive !== false,
        });
      } catch (e: any) {
        toast.error(e.response?.data?.error || 'Failed to load customer');
      } finally {
        setLoading(false);
      }
    };
    if (customerId) load();
  }, [customerId]);

  const onSave = async () => {
    try {
      setSaving(true);
      await api.put(`/customers/${customerId}`, form);
      toast.success('Customer updated');
      router.back();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Edit Customer</CardTitle>
          <CardDescription>Update customer details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Company Name</Label>
              <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Company Name" />
            </div>
            <div>
              <Label>Industry</Label>
              <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Industry" />
            </div>
            <div className="md:col-span-2">
              <Label>Address</Label>
              <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" rows={3} />
            </div>
            <div>
              <Label>Timezone</Label>
              <Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} placeholder="UTC" />
            </div>
          </div>
          <Separator className="my-6" />
          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving}>
              {saving ? 'Saving...' : (<><Save className="h-4 w-4 mr-2" />Save Changes</>)}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
