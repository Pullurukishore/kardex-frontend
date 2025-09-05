import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Metadata } from 'next';
import { UserRole } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api/client';

// Make this an async function to fetch data
async function getDashboardData() {
  try {
    const response = await apiClient.get('/service-person/dashboard');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return {
      stats: [],
      assignedTickets: [],
      recentTasks: [],
    };
  }
}

export const metadata: Metadata = {
  title: 'Service Dashboard',
  description: 'Service person dashboard overview',
};

export default async function ServicePersonDashboard() {
  const data = await getDashboardData();
  
  // Mock data - replace with actual data from API
  const stats = [
    { name: 'Assigned Tickets', value: '12', change: '+2', changeType: 'increase' },
    { name: 'Open Tasks', value: '8', change: '-3', changeType: 'decrease' },
    { name: 'Completed Today', value: '5', change: '+2', changeType: 'increase' },
    { name: 'SLA Compliance', value: '92%', change: '+5%', changeType: 'increase' },
  ];

  const assignedTickets = [
    { id: 'T-1001', customer: 'ABC Corp', priority: 'High', status: 'In Progress', dueDate: '2023-05-20' },
    { id: 'T-1002', customer: 'XYZ Ltd', priority: 'Medium', status: 'Assigned', dueDate: '2023-05-22' },
    { id: 'T-1003', customer: '123 Industries', priority: 'Low', status: 'Assigned', dueDate: '2023-05-25' },
  ];

  const recentTasks = [
    { id: 'TSK-101', description: 'Inspect HVAC system', status: 'In Progress', due: 'Today' },
    { id: 'TSK-102', description: 'Replace filter in server room', status: 'Pending', due: 'Tomorrow' },
    { id: 'TSK-103', description: 'Monthly maintenance check', status: 'Completed', due: 'Today' },
  ];

  return (
    <DashboardLayout userRole={UserRole.SERVICE_PERSON}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Service Dashboard</h2>
            <p className="text-muted-foreground">
              Here's an overview of your assigned tickets and tasks.
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
                <p className="text-xs text-muted-foreground">
                  <span className={stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
                    {stat.change}
                  </span>{' '}
                  from yesterday
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Assigned Tickets */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Assigned Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignedTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="font-medium">Ticket {ticket.id}</p>
                      <p className="text-sm text-muted-foreground">{ticket.customer}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ticket.priority === 'High' ? 'bg-red-100 text-red-800' :
                        ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {ticket.priority}
                      </span>
                      <p className="text-sm text-muted-foreground">Due: {ticket.dueDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-start space-x-3">
                    <div className={`h-2 w-2 mt-2 rounded-full ${
                      task.status === 'Completed' ? 'bg-green-500' :
                      task.status === 'In Progress' ? 'bg-blue-500' :
                      'bg-gray-300'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium">{task.id}: {task.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{task.status}</span>
                        <span className="text-xs text-muted-foreground">Due: {task.due}</span>
                      </div>
                    </div>
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
