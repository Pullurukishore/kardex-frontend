import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Target
} from 'lucide-react';
import type { FSADashboardData, RealTimeMetrics } from '@/types/fsa';

interface FSAOverviewCardsProps {
  data: FSADashboardData;
  realTimeMetrics?: RealTimeMetrics | null;
}

export default function FSAOverviewCards({ data, realTimeMetrics }: FSAOverviewCardsProps) {
  const { overview } = data;

  const cards = [
    {
      title: 'Total Zones',
      value: overview.totalZones,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Active service zones'
    },
    {
      title: 'Total Tickets',
      value: overview.totalTickets,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'All tickets in system'
    },
    {
      title: 'Resolved Tickets',
      value: overview.resolvedTickets,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Successfully resolved'
    },
    {
      title: 'Resolution Rate',
      value: `${typeof overview.resolutionRate === 'number' ? overview.resolutionRate.toFixed(1) : overview.resolutionRate || '0'}%`,
      icon: Target,
      color: overview.resolutionRate >= 80 ? 'text-green-600' : 'text-orange-600',
      bgColor: overview.resolutionRate >= 80 ? 'bg-green-50' : 'bg-orange-50',
      description: 'Ticket resolution percentage'
    },
    {
      title: 'SLA Compliance',
      value: `${typeof overview.slaCompliance === 'number' ? overview.slaCompliance.toFixed(1) : overview.slaCompliance || '0'}%`,
      icon: overview.slaCompliance >= 90 ? TrendingUp : TrendingDown,
      color: overview.slaCompliance >= 90 ? 'text-green-600' : 'text-red-600',
      bgColor: overview.slaCompliance >= 90 ? 'bg-green-50' : 'bg-red-50',
      description: 'Service level agreement compliance'
    },
    {
      title: 'Avg Resolution Time',
      value: `${typeof overview.avgResolutionTime === 'number' ? overview.avgResolutionTime.toFixed(1) : overview.avgResolutionTime || '0'}h`,
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Average time to resolve tickets'
    }
  ];

  // Add real-time metrics if available
  if (realTimeMetrics) {
    cards.push(
      {
        title: 'Active Tickets',
        value: realTimeMetrics.activeTickets,
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        description: 'Currently active tickets'
      },
      {
        title: 'Active Service Persons',
        value: realTimeMetrics.activeServicePersons,
        icon: Users,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        description: 'Service persons currently active'
      }
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        
        // Define vibrant gradients for different card types
        const cardGradients = [
          'from-purple-400 via-pink-400 to-red-400',
          'from-blue-400 via-cyan-400 to-teal-400',
          'from-green-400 via-emerald-400 to-teal-400',
          'from-yellow-400 via-orange-400 to-red-400',
          'from-indigo-400 via-purple-400 to-pink-400',
          'from-cyan-400 via-blue-400 to-indigo-400'
        ];
        
        const gradientIndex = index % cardGradients.length;
        
        return (
          <div 
            key={index}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-transparent hover:border-white transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
          >
            {/* Vibrant gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
            
            {/* Colorful top accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cardGradients[gradientIndex]}`}></div>
            
            <div className="relative p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-800 tracking-tight">
                  {card.title}
                </h3>
                <div className={`p-3 rounded-xl ${card.bgColor} group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                  <IconComponent className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
              
              {/* Value */}
              <div className="mb-2">
                <div className={`text-3xl font-bold bg-gradient-to-r ${cardGradients[gradientIndex]} bg-clip-text text-transparent`}>
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </div>
              </div>
              
              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                {card.description}
              </p>
              
              {/* Decorative corner accent */}
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-gradient-to-br opacity-20 rounded-full blur-sm"></div>
            </div>
          </div>
        );
      })}
      
      {realTimeMetrics && (
        <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-transparent hover:border-white transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
          {/* Vibrant gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-emerald-400 to-teal-400 opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
          
          {/* Colorful top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400"></div>
          
          <div className="relative p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800 tracking-tight">
                Last Updated
              </h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-xs font-bold shadow-md">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Real-time
              </div>
            </div>
            
            {/* Value */}
            <div className="mb-2">
              <div className="text-xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {new Date(realTimeMetrics.lastUpdated).toLocaleTimeString()}
              </div>
            </div>
            
            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              Live data feed active
            </p>
            
            {/* Decorative corner accent */}
            <div className="absolute bottom-2 right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-400 opacity-20 rounded-full blur-sm"></div>
          </div>
        </div>
      )}
    </div>
  );
}
