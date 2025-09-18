import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getZoneServicePersons, getZoneServicePersonStats } from '@/lib/server/zone';
import ZoneServicePersonClient from '@/components/zone/ServicePersonClient';

interface ZoneServicePersonsPageProps {
  searchParams: {
    search?: string;
    page?: string;
  };
}

export default async function ZoneServicePersonsPage({ searchParams }: ZoneServicePersonsPageProps) {
  const currentPage = parseInt(searchParams.page || '1');
  const search = searchParams.search || '';

  // Server-side data fetching
  const response = await getZoneServicePersons({
    page: currentPage,
    limit: 30,
    search: search || undefined,
  });

  const servicePersons = response.data;
  const pagination = response.pagination;
  const stats = await getZoneServicePersonStats(servicePersons);

  // Calculate stats
  const totalPersons = servicePersons.length;
  const activePersons = servicePersons.filter(p => p.isActive).length;
  const inactivePersons = totalPersons - activePersons;
  const totalZoneAssignments = servicePersons.reduce((acc, person) => acc + person.serviceZones.length, 0);

  const initialStats = {
    total: totalPersons,
    active: activePersons,
    inactive: inactivePersons,
    totalZoneAssignments
  };

  // Convert server ServicePerson types to client types by adding createdAt
  const clientServicePersons = servicePersons.map(person => ({
    ...person,
    createdAt: new Date().toISOString() // Add missing createdAt field
  }));

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-6 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Zone Service Personnel</h1>
            <p className="text-blue-100">
              Manage service personnel in your zone and their assignments
            </p>
          </div>
          <Link href="/zone/service-persons/new">
            <Button className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Service Person
            </Button>
          </Link>
        </div>
      </div>

      {/* Client Component for API calls */}
      <ZoneServicePersonClient 
        initialServicePersons={clientServicePersons}
        initialStats={initialStats}
        initialPagination={pagination}
        searchParams={searchParams}
      />
    </div>
  );
}
