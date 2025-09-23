import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getTickets, calculateTicketStats } from '@/lib/server/ticket';
import TicketClient from '@/components/ticket/TicketClient';
import TicketFilters from '@/components/tickets/TicketFilters';
import Link from 'next/link';
import { Ticket } from '@/types/ticket';

 

type SearchParams = {
  status?: string;
  priority?: string;
  search?: string;
  page?: string;
  limit?: string;
  view?: 'all' | 'unassigned' | 'assigned-to-zone' | 'assigned-to-service-person';
};

type Props = {
  searchParams: SearchParams;
};

export default async function ServicePersonTicketsPage({ searchParams }: Props) {
  const currentPage = parseInt(searchParams.page || '1');
  const currentLimit = parseInt(searchParams.limit || '30');

  // Force the view to service-person context by default
  const currentView = (searchParams.view || 'assigned-to-service-person') as 'all' | 'unassigned' | 'assigned-to-zone' | 'assigned-to-service-person';

  const filters = {
    status: searchParams.status || '',
    priority: searchParams.priority || '',
    search: searchParams.search || '',
    page: currentPage,
    limit: currentLimit,
    view: currentView,
  };

  let ticketsData: any;

  try {
    ticketsData = await getTickets(filters);
  } catch (err) {
    console.error('Error fetching tickets:', err);
    ticketsData = { data: [], pagination: { total: 0, page: 1, limit: 30, totalPages: 1 } };
  }

  const { data: tickets } = ticketsData as { data: Ticket[] };
  const stats = calculateTicketStats(tickets);

  // Ensure the client gets the correct default view in its own fetching
  const clientSearchParams: SearchParams = { ...searchParams, view: currentView };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 p-6 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Tickets</h1>
            <p className="text-blue-100">View and manage your assigned service tickets</p>
          </div>
          <Link href="/service-person/tickets/create">
            <Button className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Section */}
      <TicketFilters searchParams={clientSearchParams} />

      {/* Client Component for API calls */}
      <TicketClient 
        initialTickets={tickets}
        initialStats={stats}
        searchParams={clientSearchParams}
      />
    </div>
  );
}