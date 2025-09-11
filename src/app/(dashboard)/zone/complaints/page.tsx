import { apiClient } from "@/lib/api/client";

export default async function ZoneComplaintsPage() {
  const { complaints } = await apiClient
    .get("/zone/complaints")
    .then((res) => res.data)
    .catch(() => ({ complaints: [] }));
  return (
    <div>
      {complaints.length ? (
        complaints.map((complaint) => (
          <div key={complaint.id}>
            Complaint {complaint.id} - {complaint.description}
          </div>
        ))
      ) : (
        <div>No complaints found</div>
      )}
    </div>
  );
}
