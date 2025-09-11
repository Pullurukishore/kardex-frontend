'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UserRole } from '@/types/user.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  User,
  Wrench,
  Target,
  TrendingUp,
  Activity,
  Star,
  Timer,
  Route,
  Ticket,
  RefreshCw,
  Phone,
  MessageSquare,
  Navigation,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Cell,
} from 'recharts';
import api from '@/lib/api/axios';
import { useAuth } from '@/contexts/AuthContext';

interface StatItem {
  name: string;
  value: string | number;
  change: number;
  isPositive?: boolean;
}

interface Ticket {
  id: number;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  customer: {
    id: number;
    companyName: string;
  };
  asset?: {
    id: number;
    model: string;
  };
}

interface ServicePersonDashboardData {
  technician: {
    id: number;
    name: string;
    email: string;
    phone: string;
    zone: string;
    rating: number;
    totalTicketsResolved: number;
    efficiency: number;
    specializations: string[];
  };
  stats: {
    assignedTickets: { count: number; change: number };
    completedToday: { count: number; change: number };
    inProgressTickets: { count: number; change: number };
    avgResponseTime: { hours: number; minutes: number; change: number; isPositive: boolean };
    avgResolutionTime: { hours: number; minutes: number; change: number; isPositive: boolean };
    customerRating: { value: number; change: number; isPositive: boolean };
    firstCallResolution: { percentage: number; change: number; isPositive: boolean };
    travelTime: { avgMinutes: number; change: number; isPositive: boolean };
    monthlyPerformance: { score: number; change: number; isPositive: boolean };
  };
  assignedTickets: Array<{
    id: number;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
    scheduledAt?: string;
    customer: {
      id: number;
      companyName: string;
      contactPerson: string;
      phone: string;
      location: string;
    };
    asset?: {
      id: number;
      model: string;
      serialNumber: string;
    };
    estimatedDuration: number;
    distance: number;
  }>;
  performanceTrends: Array<{
    date: string;
    ticketsCompleted: number;
    avgRating: number;
    efficiency: number;
  }>;
  upcomingSchedule: Array<{
    id: number;
    ticketId: number;
    title: string;
    scheduledTime: string;
    customer: string;
    location: string;
    priority: string;
    estimatedDuration: number;
  }>;
  recentActivities: Array<{
    id: number;
    type: string;
    description: string;
    timestamp: string;
    ticketId?: number;
  }>;
}

// Helper to format numbers with commas
const formatNumber = (num: number) =>
  num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function ServicePersonDashboard() {
  const [data, setData] = useState<ServicePersonDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchServicePersonData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await api.get("/service-person-dashboard");
        setData(response.data);
      } catch (error) {
        console.error("Error fetching service person dashboard data:", error);
        // Mock data for development
        setData({
          technician: {
            id: 1,
            name: "John Smith",
            email: "john.smith@kardexcare.com",
            phone: "+1 (555) 123-4567",
            zone: "North Zone",
            rating: 4.8,
            totalTicketsResolved: 234,
            efficiency: 92.5,
            specializations: ["Hydraulic Systems", "Electrical", "Preventive Maintenance"]
          },
          stats: {
            assignedTickets: { count: 8, change: 2 },
            completedToday: { count: 3, change: 1 },
            inProgressTickets: { count: 5, change: -1 },
            avgResponseTime: { hours: 2, minutes: 15, change: -10, isPositive: true },
            avgResolutionTime: { hours: 4, minutes: 30, change: -5, isPositive: true },
            customerRating: { value: 4.8, change: 0.2, isPositive: true },
            firstCallResolution: { percentage: 85, change: 5, isPositive: true },
            travelTime: { avgMinutes: 25, change: -3, isPositive: true },
            monthlyPerformance: { score: 92, change: 4, isPositive: true }
          },
          assignedTickets: [
            {
              id: 1,
              title: "Hydraulic System Malfunction",
              status: "IN_PROGRESS",
              priority: "HIGH",
              createdAt: "2024-01-15T09:00:00Z",
              scheduledAt: "2024-01-15T14:00:00Z",
              customer: {
                id: 1,
                companyName: "Industrial Corp",
                contactPerson: "Mike Johnson",
                phone: "+1 (555) 987-6543",
                location: "123 Industrial Ave, City"
              },
              asset: {
                id: 1,
                model: "KX-2000",
                serialNumber: "KX2000-001"
              },
              estimatedDuration: 120,
              distance: 15.5
            },
            {
              id: 2,
              title: "Preventive Maintenance",
              status: "ASSIGNED",
              priority: "MEDIUM",
              createdAt: "2024-01-15T08:30:00Z",
              scheduledAt: "2024-01-16T10:00:00Z",
              customer: {
                id: 2,
                companyName: "Manufacturing Ltd",
                contactPerson: "Sarah Wilson",
                phone: "+1 (555) 456-7890",
                location: "456 Factory Rd, City"
              },
              asset: {
                id: 2,
                model: "KX-1500",
                serialNumber: "KX1500-045"
              },
              estimatedDuration: 90,
              distance: 8.2
            }
          ],
          performanceTrends: [
            { date: "Mon", ticketsCompleted: 4, avgRating: 4.7, efficiency: 90 },
            { date: "Tue", ticketsCompleted: 3, avgRating: 4.8, efficiency: 88 },
            { date: "Wed", ticketsCompleted: 5, avgRating: 4.9, efficiency: 95 },
            { date: "Thu", ticketsCompleted: 2, avgRating: 4.6, efficiency: 85 },
            { date: "Fri", ticketsCompleted: 4, avgRating: 4.8, efficiency: 92 },
            { date: "Sat", ticketsCompleted: 1, avgRating: 5.0, efficiency: 98 },
            { date: "Sun", ticketsCompleted: 0, avgRating: 0, efficiency: 0 }
          ],
          upcomingSchedule: [
            {
              id: 1,
              ticketId: 1,
              title: "Hydraulic System Repair",
              scheduledTime: "2024-01-15T14:00:00Z",
              customer: "Industrial Corp",
              location: "123 Industrial Ave",
              priority: "HIGH",
              estimatedDuration: 120
            },
            {
              id: 2,
              ticketId: 2,
              title: "Preventive Maintenance",
              scheduledTime: "2024-01-16T10:00:00Z",
              customer: "Manufacturing Ltd",
              location: "456 Factory Rd",
              priority: "MEDIUM",
              estimatedDuration: 90
            }
          ],
          recentActivities: [
            {
              id: 1,
              type: "TICKET_COMPLETED",
              description: "Completed electrical repair at TechCorp",
              timestamp: "1 hour ago",
              ticketId: 123
            },
            {
              id: 2,
              type: "TICKET_STARTED",
              description: "Started hydraulic system diagnosis",
              timestamp: "3 hours ago",
              ticketId: 124
            },
            {
              id: 3,
              type: "PARTS_ORDERED",
              description: "Ordered replacement parts for conveyor system",
              timestamp: "5 hours ago",
              ticketId: 125
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchServicePersonData();
  }, [toast, user]);

  if (loading) {
    return (
      <DashboardLayout userRole={UserRole.SERVICE_PERSON}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout userRole={UserRole.SERVICE_PERSON}>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-lg">No data available</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  return (
    <DashboardLayout userRole={UserRole.SERVICE_PERSON}>
      <div className="space-y-8 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
        {/* Technician Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Welcome back, {data.technician.name}
            </h1>
            <p className="text-muted-foreground flex items-center mt-1">
              <MapPin className="h-4 w-4 mr-1 text-blue-500" />
              {data.technician.zone} • {data.technician.specializations.join(", ")}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                {data.technician.rating}/5.0 Rating
              </span>
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                {data.technician.totalTicketsResolved} Tickets Resolved
              </span>
              <span className="flex items-center">
                <Target className="h-4 w-4 mr-1 text-blue-500" />
                {data.technician.efficiency}% Efficiency
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 bg-white shadow hover:bg-blue-50"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 text-blue-500" />
              <span>Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 bg-white shadow hover:bg-purple-50"
            >
              <Calendar className="h-4 w-4 text-purple-500" />
              <span>Schedule</span>
            </Button>
          </div>
        </div>

        {/* Performance KPIs */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-blue-400 to-blue-600 text-white hover:scale-[1.02] transition-transform">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Assigned Tickets</CardTitle>
              <Ticket className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.stats.assignedTickets.count}</div>
              <p className="text-xs text-white/80">
                <span className={data.stats.assignedTickets.change >= 0 ? 'text-green-200' : 'text-red-200'}>
                  {data.stats.assignedTickets.change > 0 ? '+' : ''}{data.stats.assignedTickets.change}
                </span> from yesterday
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-green-400 to-green-600 text-white hover:scale-[1.02] transition-transform">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.stats.completedToday.count}</div>
              <p className="text-xs text-white/80">
                <span className={data.stats.completedToday.change >= 0 ? 'text-green-200' : 'text-red-200'}>
                  {data.stats.completedToday.change > 0 ? '+' : ''}{data.stats.completedToday.change}
                </span> from yesterday
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white hover:scale-[1.02] transition-transform">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
              <Star className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.stats.customerRating.value}/5.0</div>
              <p className="text-xs text-white/80">
                <span className={data.stats.customerRating.isPositive ? 'text-green-200' : 'text-red-200'}>
                  {data.stats.customerRating.change > 0 ? '+' : ''}{data.stats.customerRating.change}
                </span> this month
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-purple-400 to-purple-600 text-white hover:scale-[1.02] transition-transform">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">First Call Resolution</CardTitle>
              <Target className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.stats.firstCallResolution.percentage}%</div>
              <p className="text-xs text-white/80">
                <span className={data.stats.firstCallResolution.isPositive ? 'text-green-200' : 'text-red-200'}>
                  {data.stats.firstCallResolution.change > 0 ? '+' : ''}{data.stats.firstCallResolution.change}%
                </span> this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Charts and Assigned Tickets */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Performance Trends */}
          <Card className="shadow-xl hover:shadow-2xl transition-shadow rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                Weekly Performance
              </CardTitle>
              <CardDescription>Your performance metrics over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="ticketsCompleted" stroke="#3b82f6" name="Tickets Completed" />
                    <Line type="monotone" dataKey="efficiency" stroke="#10b981" name="Efficiency %" />
                    <Line type="monotone" dataKey="avgRating" stroke="#f59e0b" name="Rating (x20)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Tickets */}
          <Card className="shadow-xl hover:shadow-2xl transition-shadow rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wrench className="h-5 w-5 mr-2 text-blue-500" />
                Assigned Tickets
              </CardTitle>
              <CardDescription>Your current ticket assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {data.assignedTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{ticket.title}</h4>
                          <Badge className={
                            ticket.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                            ticket.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {ticket.priority}
                          </Badge>
                          <Badge variant="outline">
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>{ticket.customer.companyName}</strong> • {ticket.customer.contactPerson}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          📍 {ticket.customer.location} • {ticket.distance}km away
                        </p>
                        {ticket.asset && (
                          <p className="text-sm text-muted-foreground mb-2">
                            🔧 {ticket.asset.model} ({ticket.asset.serialNumber})
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Timer className="h-3 w-3 mr-1" />
                            {ticket.estimatedDuration} min
                          </span>
                          {ticket.scheduledAt && (
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(ticket.scheduledAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Button size="sm" className="text-xs">
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Navigation className="h-3 w-3 mr-1" />
                          Navigate
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule and Activities */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Schedule */}
          <Card className="shadow-xl hover:shadow-2xl transition-shadow rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-indigo-500" />
                Today's Schedule
              </CardTitle>
              <CardDescription>Your scheduled appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.upcomingSchedule.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{appointment.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.customer} • {appointment.location}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(appointment.scheduledTime).toLocaleTimeString()} • {appointment.estimatedDuration} min
                        </p>
                      </div>
                      <Badge className={
                        appointment.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                        appointment.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {appointment.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="shadow-xl hover:shadow-2xl transition-shadow rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-500" />
                Recent Activities
              </CardTitle>
              <CardDescription>Your latest work activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-green-50 hover:to-emerald-50 transition-all duration-200"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                    {activity.ticketId && (
                      <Badge variant="outline" className="text-xs">
                        #{activity.ticketId}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2 text-blue-500" />
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {data.stats.avgResponseTime.hours}h {data.stats.avgResponseTime.minutes}m
              </div>
              <p className="text-xs text-muted-foreground">
                <span className={data.stats.avgResponseTime.isPositive ? 'text-green-500' : 'text-red-500'}>
                  {data.stats.avgResponseTime.change}% improvement
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Timer className="h-4 w-4 mr-2 text-green-500" />
                Avg Resolution Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data.stats.avgResolutionTime.hours}h {data.stats.avgResolutionTime.minutes}m
              </div>
              <p className="text-xs text-muted-foreground">
                <span className={data.stats.avgResolutionTime.isPositive ? 'text-green-500' : 'text-red-500'}>
                  {data.stats.avgResolutionTime.change}% improvement
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Route className="h-4 w-4 mr-2 text-orange-500" />
                Avg Travel Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {data.stats.travelTime.avgMinutes} min
              </div>
              <p className="text-xs text-muted-foreground">
                <span className={data.stats.travelTime.isPositive ? 'text-green-500' : 'text-red-500'}>
                  {data.stats.travelTime.change}% improvement
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-purple-500" />
                Monthly Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {data.stats.monthlyPerformance.score}%
              </div>
              <p className="text-xs text-muted-foreground">
                <span className={data.stats.monthlyPerformance.isPositive ? 'text-green-500' : 'text-red-500'}>
                  {data.stats.monthlyPerformance.change > 0 ? '+' : ''}{data.stats.monthlyPerformance.change}% this month
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
