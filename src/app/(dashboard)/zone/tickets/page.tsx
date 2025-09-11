import { apiClient } from "@/lib/api/client";

export default async function ZoneTicketsPage() {
  const { tickets } = await apiClient
    .get("/zone/tickets")
    .then((res) => res.data)
    .catch(() => ({ tickets: [] }));
  return (
    <div>
      {tickets.length ? (
        tickets.map((ticket) => (
          <div key={ticket.id}>
            Ticket {ticket.id} - {ticket.status}
          </div>
        ))
      ) : (
        <div>No tickets found</div>
      )}
    </div>
  );
}
