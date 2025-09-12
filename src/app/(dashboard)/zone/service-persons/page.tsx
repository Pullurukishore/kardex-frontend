'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { RefreshCw, Users, Search, Mail, Phone, MapPin, Activity } from 'lucide-react';

interface ServicePerson {
  id: number;
  name?: string;
  email: string;
  phone?: string;
  isActive?: boolean;
  serviceZones?: { serviceZone: { id: number; name: string } }[];
  assignedTickets?: number;
  activeTickets?: number;
  resolutionRate?: number;
}

interface Zone { id: number; name: string }

export default function ZoneServicePersonsPage() {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [people, setPeople] = useState<ServicePerson[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneFilter, setZoneFilter] = useState<string>('all');

  const fetchData = async (q = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      params.set('isActive', 'true');
      // This endpoint returns ALL service persons (role filtered), not restricted to user's zones
      const res = await api.get(`/service-persons?${params.toString()}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setPeople(list);
    } catch (e) {
      // handled globally
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const res = await api.get(`/service-zones?isActive=true`);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setZones(data);
    } catch {}
  };

  useEffect(() => {
    fetchData('');
    fetchZones();
  }, []);

  const filteredPeople = useMemo(() => {
    const bySearch = (p: ServicePerson) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (p.name || '').toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q)
      );
    };
    const byZone = (p: ServicePerson) => {
      if (zoneFilter === 'all') return true;
      const zid = Number(zoneFilter);
      return (p.serviceZones || []).some(z => z.serviceZone?.id === zid);
    };
    return people.filter(p => bySearch(p) && byZone(p));
  }, [people, search, zoneFilter]);

  const metrics = (() => {
    const total = filteredPeople.length;
    const active = filteredPeople.filter(p => p.isActive !== false).length;
    const totalActiveTickets = filteredPeople.reduce((s, p) => s + (p.activeTickets || 0), 0);
    const avgResolution = filteredPeople.length > 0
      ? Math.round((filteredPeople.reduce((s, p) => s + (p.resolutionRate || 0), 0) / filteredPeople.length) * 10) / 10
      : 0;
    return { total, active, totalActiveTickets, avgResolution };
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          All Service Personnel
        </h1>
        <p className="text-muted-foreground mt-1">Browse all service persons across zones. Filter by zone if needed.</p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="text-xs text-blue-700">Total Agents</div>
            <div className="text-3xl font-bold text-blue-900">{metrics.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="text-xs text-emerald-700">Active Agents</div>
            <div className="text-3xl font-bold text-emerald-900">{metrics.active}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="text-xs text-amber-700">Active Tickets</div>
            <div className="text-3xl font-bold text-amber-900">{metrics.totalActiveTickets}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="text-xs text-purple-700">Avg. Resolution Rate</div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-purple-900">{metrics.avgResolution}%</div>
              <div className="flex-1">
                <Progress value={metrics.avgResolution} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Directory</CardTitle>
          <CardDescription>Search and optionally filter by zone</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex gap-2">
              <div className="relative w-full">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search agents"
                  className="pl-8"
                />
              </div>
              <Button onClick={() => fetchData(search.trim())} disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
            <div className="min-w-[220px]">
              <Select value={zoneFilter} onValueChange={(v) => setZoneFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  {zones.map(z => (
                    <SelectItem key={z.id} value={String(z.id)}>{z.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Zones</TableHead>
                  <TableHead>Active Tickets</TableHead>
                  <TableHead>Resolution Rate</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPeople.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{p.name || p.email}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3">
                          <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</span>
                          {p.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone}</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(p.serviceZones || []).map((z, i) => (
                          <Badge key={i} variant="outline" className="gap-1"><MapPin className="h-3 w-3" />{z.serviceZone?.name}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-1"><Activity className="h-4 w-4" />{p.activeTickets ?? 0}</div>
                    </TableCell>
                    <TableCell>
                      <div className="w-40">
                        <div className="text-xs mb-1">{(p.resolutionRate ?? 0).toFixed(1)}%</div>
                        <Progress value={p.resolutionRate ?? 0} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={p.isActive !== false ? 'default' : 'secondary'}>
                        {p.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && filteredPeople.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No service persons found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
