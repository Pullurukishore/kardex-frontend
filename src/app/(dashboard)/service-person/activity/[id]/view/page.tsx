'use client';

import { useParams } from 'next/navigation';
import AttendanceDetailView from '@/components/attendance/AttendanceDetailView';

export default function AttendanceViewPage() {
  const params = useParams();
  const attendanceId = params.id as string;

  return (
    <AttendanceDetailView
      attendanceId={attendanceId}
      apiEndpoint={`/service-person/attendance/${attendanceId}`}
      backUrl="/service-person/activity"
      pageTitle="My Activity Details"
    />
  );
}