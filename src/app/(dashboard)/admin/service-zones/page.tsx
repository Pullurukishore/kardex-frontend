import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getServiceZones, getServiceZoneStats } from '@/lib/server/admin';
import ServiceZoneClient from '@/components/admin/ServiceZoneClient';

interface ServiceZonesPageProps {
  searchParams: {
    search?: string;
    page?: string;
  };
}

export default async function ServiceZonesPage({ searchParams }: ServiceZonesPageProps) {
  const currentPage = parseInt(searchParams.page || '1');
  const search = searchParams.search || '';

  // Server-side data fetching
  const response = await getServiceZones({
    page: currentPage,
    limit: 20,
    search: search || undefined,
  });

  const zones = response.data;
  const pagination = response.pagination;
  const stats = await getServiceZoneStats(zones);

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-green-600 via-teal-600 to-green-800 p-6 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Service Zones</h1>
            <p className="text-green-100">
              Manage service zones for organizing customer locations
            </p>
          </div>
          <Link href="/admin/service-zones/new">
            <Button className="bg-white text-green-600 hover:bg-green-50 shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Service Zone
            </Button>
          </Link>
        </div>
      </div>

      {/* Client Component for API calls */}
      <ServiceZoneClient 
        initialZones={zones}
        initialStats={stats}
        initialPagination={pagination}
        searchParams={searchParams}
      />
    </div>
  );
}
