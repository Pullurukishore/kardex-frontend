'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus } from 'lucide-react';

export default function NewContactPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const customerId = params?.id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const onSave = async () => {
    if (!form.name || !form.email) {
      toast.error('Name and Email are required');
      return;
    }
    try {
      setSaving(true);
      await api.post(`/contacts`, { ...form, customerId: Number(customerId) });
      toast.success('Contact created');
      router.back();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to create contact');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
      </div>

      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> New Contact</CardTitle>
          <CardDescription>Add a contact for this customer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contact Name" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
            </div>
            <div className="flex justify-end">
              <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Create Contact'}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
