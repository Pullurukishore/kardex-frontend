import { apiClient } from "@/lib/api/client";

export default async function ServicePersonSchedulePage() {
  const { schedule } = await apiClient
    .get("/service-person/schedule")
    .then((res) => res.data)
    .catch(() => ({ schedule: [] }));
  return (
    <div>
      {schedule.length ? (
        schedule.map((item) => (
          <div key={item.id}>
            Task {item.id} - {item.description}
          </div>
        ))
      ) : (
        <div>No schedule found</div>
      )}
    </div>
  );
}
