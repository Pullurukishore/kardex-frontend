import { apiClient } from "@/lib/api/client";

export default async function ZoneReportsPage() {
  const { reports } = await apiClient
    .get("/zone/reports")
    .then((res) => res.data)
    .catch(() => ({ reports: [] }));
  return (
    <div>
      {reports.length ? (
        reports.map((report) => (
          <div key={report.id}>
            Report {report.id} - {report.summary}
          </div>
        ))
      ) : (
        <div>No reports found</div>
      )}
    </div>
  );
}
