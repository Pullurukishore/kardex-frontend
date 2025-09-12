'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, PlusSquare } from 'lucide-react';

export default function NewAssetPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const customerId = Number(params?.id);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    machineId: '',
    model: '',
    serialNo: '',
    location: '',
    status: 'ACTIVE',
  });

  const onSave = async () => {
    if (!form.machineId) {
      toast.error('Machine ID is required');
      return;
    }
    try {
      setSaving(true);
      await api.post(`/assets`, { ...form, customerId });
      toast.success('Asset created');
      router.back();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to create asset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PlusSquare className="h-5 w-5" /> New Asset</CardTitle>
          <CardDescription>Add a new asset for this customer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Machine ID</Label>
              <Input value={form.machineId} onChange={(e) => setForm({ ...form, machineId: e.target.value })} placeholder="Machine ID" />
            </div>
            <div>
              <Label>Model</Label>
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Model" />
            </div>
            <div>
              <Label>Serial No</Label>
              <Input value={form.serialNo} onChange={(e) => setForm({ ...form, serialNo: e.target.value })} placeholder="Serial Number" />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Create Asset'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
