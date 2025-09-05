import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Metadata } from 'next';
import { UserRole } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api/client';

// Make this an async function to fetch data
async function getDashboardData() {
  try {
    const response = await apiClient.get('/zone/dashboard');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return {
      stats: [],
      zoneMetrics: [],
      recentComplaints: [],
    };
  }
}

export const metadata: Metadata = {
  title: 'Zone Dashboard',
  description: 'Zone user dashboard overview',
};

export default async function ZoneDashboard() {
  const data = await getDashboardData();
  
  // Mock data - replace with actual data from API
  const stats = [
    { name: 'Active Tickets', value: '42', change: '+5', changeType: 'increase' },
    { name: 'Open Complaints', value: '18', change: '-3', changeType: 'decrease' },
    { name: 'Zones Managed', value: '5', change: '0', changeType: 'neutral' },
    { name: 'SLA Compliance', value: '88%', change: '+2%', changeType: 'increase' },
  ];

  const zoneMetrics = [
    { zone: 'North Zone', tickets: 12, complaints: 5, status: 'Active' },
    { zone: 'South Zone', tickets: 8, complaints: 2, status: 'Active' },
    { zone: 'East Zone', tickets: 15, complaints: 8, status: 'Needs Attention' },
    { zone: 'West Zone', tickets: 5, complaints: 1, status: 'Stable' },
    { zone: 'Central Zone', tickets: 2, complaints: 0, status: 'Stable' },
  ];

  const recentComplaints = [
    { id: 'C-1001', zone: 'East Zone', type: 'Service Delay', status: 'Open', reported: '2h ago' },
    { id: 'C-1002', zone: 'North Zone', type: 'Quality Issue', status: 'In Progress', reported: '5h ago' },
    { id: 'C-1003', zone: 'South Zone', type: 'Billing', status: 'Resolved', reported: '1d ago' },
  ];

  return (
    <DashboardLayout userRole={UserRole.ZONE_USER}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Zone Dashboard</h2>
            <p className="text-muted-foreground">
              Overview of zone operations and service metrics
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change !== '0' && (
                  <p className="text-xs text-muted-foreground">
                    <span className={stat.changeType === 'increase' ? 'text-green-500' : 
                                    stat.changeType === 'decrease' ? 'text-red-500' : 'text-gray-500'}>
                      {stat.change}
                    </span>{' '}
                    from last week
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Zone Metrics */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Zone Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complaints</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {zoneMetrics.map((zone) => (
                      <tr key={zone.zone} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {zone.zone}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {zone.tickets}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {zone.complaints}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            zone.status === 'Active' ? 'bg-green-100 text-green-800' :
                            zone.status === 'Needs Attention' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {zone.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Complaints */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentComplaints.map((complaint) => (
                  <div key={complaint.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{complaint.id}</p>
                        <p className="text-sm text-muted-foreground">{complaint.zone}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        complaint.status === 'Open' ? 'bg-red-100 text-red-800' :
                        complaint.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {complaint.status}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{complaint.type}</p>
                    <p className="text-xs text-muted-foreground">Reported {complaint.reported}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
