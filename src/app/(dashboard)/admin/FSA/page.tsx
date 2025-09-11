'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Users, Ticket, CheckCircle, AlertCircle, Clock, TrendingUp, Activity,
  Gauge, ThumbsUp, PieChart, FileText, Eye, MoreVertical, Search,
  ChevronLeft, ChevronRight, Database, Star, Wrench, ArrowUp, ArrowDown, Minus,
  MapPin, Building2, UserCheck, Award, Target, BarChart3, Zap, Shield,
  Calendar, Filter, RefreshCw, Download, Settings
} from 'lucide-react'
import { apiClient } from '@/lib/api/api-client'

interface DashboardData {
  overview: {
    totalZones: number
    totalTickets: number
    resolvedTickets: number
    resolutionRate: number
    slaCompliance: number
    avgResolutionTime: number
  }
  distribution: {
    byStatus: Array<{ status: string; count: number; percentage: number }>
    byPriority: Array<{ priority: string; count: number; percentage: number }>
  }
  performance: {
    zonePerformance: Array<{
      id: number
      name: string
      totalTickets: number
      resolvedTickets: number
      resolutionRate: number
      avgResolutionTime: string
      criticalResolutionRate: number
      customerCount: number
      activeCustomers: number
    }>
    topPerformers: Array<{
      id: number
      name: string
      email: string
      resolvedTickets: number
      avgResolutionTime: string
    }>
  }
}

interface ZoneAnalytics {
  zoneInfo: {
    id: number
    name: string
    description: string
    isActive: boolean
  }
  overview: {
    totalCustomers: number
    totalServicePersons: number
    totalTickets: number
    openTickets: number
    resolvedTickets: number
    resolutionRate: number
    avgResolutionTime: string
    slaCompliance: number
  }
  performance: {
    customers: Array<{
      id: number
      name: string
      ticketCount: number
      resolvedTickets: number
      resolutionRate: number
    }>
    servicePersons: Array<{
      id: number
      name: string
      email: string
      ticketCount: number
      resolvedTickets: number
      resolutionRate: number
      avgResolutionTime: string
    }>
  }
}

interface UserPerformance {
  overview: {
    userName?: string
    customerName?: string
    serviceZone?: string
    totalTickets: number
    openTickets: number
    resolvedTickets: number
    resolutionRate: number
    avgResolutionTime: string
  }
  distribution: {
    byStatus: Array<{ status: string; count: number; percentage: number }>
    byPriority: Array<{ priority: string; count: number; percentage: number }>
    byZone?: Array<{ zone: string; count: number; percentage: number }>
  }
}

type ViewMode = 'overview' | 'zones' | 'users' | 'servicePersons' | 'analytics'

export default function FSADashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    overview: {
      totalZones: 0,
      totalTickets: 0,
      resolvedTickets: 0,
      resolutionRate: 0,
      slaCompliance: 0,
      avgResolutionTime: 0
    },
    distribution: {
      byStatus: [],
      byPriority: []
    },
    performance: {
      zonePerformance: [],
      topPerformers: []
    }
  })
  
  const [zoneAnalytics, setZoneAnalytics] = useState<ZoneAnalytics | null>(null)
  const [userPerformance, setUserPerformance] = useState<UserPerformance | null>(null)
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('ADMIN')
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [timeframe, setTimeframe] = useState('30d')
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [performanceFilter, setPerformanceFilter] = useState('all')

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      const response = await apiClient.get(`/fsa/dashboard?timeframe=${timeframe}`)
      
      if (response.success && response.data) {
        setDashboardData(response.data.dashboard || dashboardData)
        
        if (response.data.userRole) {
          setUserRole(response.data.userRole)
        }
      } else {
        throw new Error(response.error || 'Failed to fetch dashboard data')
      }
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [timeframe])

  const fetchZoneAnalytics = useCallback(async (zoneId: number) => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/fsa/zones/${zoneId}?timeframe=${timeframe}`)
      
      if (response.success && response.data) {
        setZoneAnalytics(response.data)
      }
    } catch (err) {
      console.error('Error fetching zone analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch zone analytics')
    } finally {
      setLoading(false)
    }
  }, [timeframe])

  const fetchUserPerformance = useCallback(async (userId: number, isServicePerson = false) => {
    try {
      setLoading(true)
      const endpoint = isServicePerson 
        ? `/fsa/service-persons/${userId}/performance?timeframe=${timeframe}`
        : `/fsa/users/${userId}/performance?timeframe=${timeframe}`
      
      const response = await apiClient.get(endpoint)
      
      if (response.success && response.data) {
        setUserPerformance(response.data)
      }
    } catch (err) {
      console.error('Error fetching user performance:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch user performance')
    } finally {
      setLoading(false)
    }
  }, [timeframe])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  useEffect(() => {
    if (viewMode === 'zones' && selectedZoneId) {
      fetchZoneAnalytics(selectedZoneId)
    }
  }, [viewMode, selectedZoneId, fetchZoneAnalytics])

  useEffect(() => {
    if ((viewMode === 'users' || viewMode === 'servicePersons') && selectedUserId) {
      fetchUserPerformance(selectedUserId, viewMode === 'servicePersons')
    }
  }, [viewMode, selectedUserId, fetchUserPerformance])

  const filteredZones = useMemo(() => {
    return dashboardData.performance.zonePerformance.filter(zone => {
      const matchesSearch = searchTerm === '' || 
        zone.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesPerformance = performanceFilter === 'all' || 
        (performanceFilter === 'high' && zone.resolutionRate >= 80) ||
        (performanceFilter === 'medium' && zone.resolutionRate >= 60 && zone.resolutionRate < 80) ||
        (performanceFilter === 'low' && zone.resolutionRate < 60)
      
      return matchesSearch && matchesPerformance
    })
  }, [dashboardData.performance.zonePerformance, searchTerm, performanceFilter])

  const filteredPerformers = useMemo(() => {
    return dashboardData.performance.topPerformers.filter(performer => {
      const matchesSearch = searchTerm === '' || 
        performer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        performer.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch
    })
  }, [dashboardData.performance.topPerformers, searchTerm])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading FSA Dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Field Service Analytics</h1>
              <p className="text-gray-600 mt-1">Detailed zone-wise, user-wise & service person analytics</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Timeframe Selector */}
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="365d">Last Year</option>
              </select>
              
              {/* View Mode Selector */}
              <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                {[
                  { key: 'overview', label: 'Overview', icon: <Gauge className="w-4 h-4" /> },
                  { key: 'zones', label: 'Zones', icon: <MapPin className="w-4 h-4" /> },
                  { key: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
                  { key: 'servicePersons', label: 'Service Team', icon: <UserCheck className="w-4 h-4" /> },
                  { key: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> }
                ].map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => setViewMode(mode.key as ViewMode)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === mode.key
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {mode.icon}
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        {(viewMode === 'zones' || viewMode === 'users' || viewMode === 'servicePersons') && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={`Search ${viewMode === 'zones' ? 'zones' : viewMode === 'users' ? 'users' : 'service persons'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <select
                  value={performanceFilter}
                  onChange={(e) => setPerformanceFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Performance</option>
                  <option value="high">High (≥80%)</option>
                  <option value="medium">Medium (60-79%)</option>
                  <option value="low">Low (&lt;60%)</option>
                </select>
                
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setPerformanceFilter('all')
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overview Dashboard */}
        {viewMode === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <AnalyticsCard
                title="Total Zones"
                value={dashboardData.overview.totalZones.toString()}
                icon={<MapPin className="w-6 h-6" />}
                color="bg-blue-100 text-blue-600"
                trend="+2 this month"
              />
              
              <AnalyticsCard
                title="Total Tickets"
                value={dashboardData.overview.totalTickets.toString()}
                icon={<Ticket className="w-6 h-6" />}
                color="bg-purple-100 text-purple-600"
                trend="+12% vs last period"
              />
              
              <AnalyticsCard
                title="Resolved Tickets"
                value={dashboardData.overview.resolvedTickets.toString()}
                icon={<CheckCircle className="w-6 h-6" />}
                color="bg-green-100 text-green-600"
                trend="+8% resolution rate"
              />
              
              <AnalyticsCard
                title="Resolution Rate"
                value={`${dashboardData.overview.resolutionRate}%`}
                icon={<Target className="w-6 h-6" />}
                color="bg-orange-100 text-orange-600"
                trend="Above target"
              />
              
              <AnalyticsCard
                title="SLA Compliance"
                value={`${dashboardData.overview.slaCompliance}%`}
                icon={<Shield className="w-6 h-6" />}
                color="bg-emerald-100 text-emerald-600"
                trend="Excellent"
              />
            </div>

            {/* Zone Performance Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-blue-500" />
                  Zone Performance Overview
                </h3>
                <button 
                  onClick={() => setViewMode('zones')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All Zones →
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.performance.zonePerformance.slice(0, 6).map((zone) => (
                  <ZonePerformanceCard 
                    key={zone.id} 
                    zone={zone}
                    onClick={() => {
                      setSelectedZoneId(zone.id)
                      setViewMode('zones')
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Award className="w-6 h-6 text-yellow-500" />
                  Top Performing Service Personnel
                </h3>
                <button 
                  onClick={() => setViewMode('servicePersons')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All Personnel →
                </button>
              </div>
              
              <div className="space-y-4">
                {dashboardData.performance.topPerformers.slice(0, 5).map((performer, index) => (
                  <TopPerformerCard 
                    key={performer.id} 
                    performer={performer} 
                    rank={index + 1}
                    onClick={() => {
                      setSelectedUserId(performer.id)
                      setViewMode('servicePersons')
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Zones Analytics View */}
        {viewMode === 'zones' && (
          <div className="space-y-8">
            {/* Zone Selection Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-500" />
                Zone Performance Analytics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredZones.map((zone) => (
                  <ZoneAnalyticsCard 
                    key={zone.id} 
                    zone={zone}
                    onClick={() => setSelectedZoneId(zone.id)}
                    isSelected={selectedZoneId === zone.id}
                  />
                ))}
              </div>
            </div>

            {/* Detailed Zone Analytics */}
            {selectedZoneId && zoneAnalytics && (
              <ZoneDetailedView zoneAnalytics={zoneAnalytics} />
            )}
          </div>
        )}

        {/* Users Analytics View */}
        {viewMode === 'users' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-500" />
                User Performance Analytics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPerformers.map((user) => (
                  <UserAnalyticsCard 
                    key={user.id} 
                    user={user}
                    onClick={() => setSelectedUserId(user.id)}
                    isSelected={selectedUserId === user.id}
                  />
                ))}
              </div>
            </div>

            {/* Detailed User Performance */}
            {selectedUserId && userPerformance && (
              <UserDetailedView userPerformance={userPerformance} />
            )}
          </div>
        )}

        {/* Service Persons Analytics View */}
        {viewMode === 'servicePersons' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-blue-500" />
                Service Personnel Analytics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPerformers.map((servicePerson) => (
                  <ServicePersonCard 
                    key={servicePerson.id} 
                    servicePerson={servicePerson}
                    onClick={() => setSelectedUserId(servicePerson.id)}
                    isSelected={selectedUserId === servicePerson.id}
                  />
                ))}
              </div>
            </div>

            {/* Detailed Service Person Performance */}
            {selectedUserId && userPerformance && (
              <ServicePersonDetailedView userPerformance={userPerformance} />
            )}
          </div>
        )}

        {/* Advanced Analytics View */}
        {viewMode === 'analytics' && (
          <div className="space-y-8">
            <AdvancedAnalyticsView dashboardData={dashboardData} />
          </div>
        )}

      </div>
    </div>
  )
}

// Analytics Components
const AnalyticsCard = ({ title, value, icon, color, trend }: {
  title: string
  value: string
  icon: React.ReactNode
  color: string
  trend?: string
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm font-medium text-gray-600 mb-2">{title}</div>
      {trend && (
        <div className="text-xs text-green-600 font-medium">{trend}</div>
      )}
    </div>
  </div>
)

const ZonePerformanceCard = ({ zone, onClick }: {
  zone: any
  onClick: () => void
}) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
  >
    <div className="flex items-center justify-between mb-3">
      <h4 className="font-semibold text-gray-900">{zone.name}</h4>
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
        zone.resolutionRate >= 80 ? 'bg-green-100 text-green-700' :
        zone.resolutionRate >= 60 ? 'bg-yellow-100 text-yellow-700' :
        'bg-red-100 text-red-700'
      }`}>
        {zone.resolutionRate}% resolved
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div>
        <span className="text-gray-500">Tickets:</span>
        <span className="font-medium ml-1">{zone.totalTickets}</span>
      </div>
      <div>
        <span className="text-gray-500">Customers:</span>
        <span className="font-medium ml-1">{zone.customerCount}</span>
      </div>
    </div>
  </div>
)

const TopPerformerCard = ({ performer, rank, onClick }: {
  performer: any
  rank: number
  onClick: () => void
}) => (
  <div 
    onClick={onClick}
    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
  >
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
        rank === 1 ? 'bg-yellow-500' :
        rank === 2 ? 'bg-gray-400' :
        rank === 3 ? 'bg-orange-600' :
        'bg-blue-500'
      }`}>
        {rank}
      </div>
      <div>
        <div className="font-medium text-gray-900">{performer.name}</div>
        <div className="text-sm text-gray-500">{performer.email}</div>
      </div>
    </div>
    <div className="text-right">
      <div className="font-bold text-gray-900">{performer.resolvedTickets}</div>
      <div className="text-sm text-gray-500">resolved</div>
    </div>
  </div>
)

const ZoneAnalyticsCard = ({ zone, onClick, isSelected }: {
  zone: any
  onClick: () => void
  isSelected: boolean
}) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer ${
      isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
    }`}
  >
    <div className="flex items-center justify-between mb-3">
      <h4 className="font-semibold text-gray-900">{zone.name}</h4>
      <MapPin className="w-5 h-5 text-blue-500" />
    </div>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Resolution Rate:</span>
        <span className="font-medium">{zone.resolutionRate || 0}%</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Total Tickets:</span>
        <span className="font-medium">{zone.totalTickets}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Avg Resolution:</span>
        <span className="font-medium">{zone.avgResolutionTime}h</span>
      </div>
    </div>
  </div>
)

const UserAnalyticsCard = ({ user, onClick, isSelected }: {
  user: any
  onClick: () => void
  isSelected: boolean
}) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer ${
      isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
    }`}
  >
    <div className="flex items-center justify-between mb-3">
      <h4 className="font-semibold text-gray-900">{user.name}</h4>
      <Users className="w-5 h-5 text-blue-500" />
    </div>
    <div className="space-y-2">
      <div className="text-sm text-gray-500">{user.email}</div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Resolved:</span>
        <span className="font-medium">{user.resolvedTickets}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Avg Time:</span>
        <span className="font-medium">{user.avgResolutionTime}h</span>
      </div>
    </div>
  </div>
)

const ServicePersonCard = ({ servicePerson, onClick, isSelected }: {
  servicePerson: any
  onClick: () => void
  isSelected: boolean
}) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer ${
      isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
    }`}
  >
    <div className="flex items-center justify-between mb-3">
      <h4 className="font-semibold text-gray-900">{servicePerson.name}</h4>
      <UserCheck className="w-5 h-5 text-blue-500" />
    </div>
    <div className="space-y-2">
      <div className="text-sm text-gray-500">{servicePerson.email}</div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Resolved:</span>
        <span className="font-medium">{servicePerson.resolvedTickets}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Avg Time:</span>
        <span className="font-medium">{servicePerson.avgResolutionTime}h</span>
      </div>
    </div>
  </div>
)

const ZoneDetailedView = ({ zoneAnalytics }: { zoneAnalytics: ZoneAnalytics }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h3 className="text-xl font-semibold text-gray-800 mb-6">
      {zoneAnalytics.zoneInfo.name} - Detailed Analytics
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">Zone Overview</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Customers:</span>
            <span className="font-medium">{zoneAnalytics.overview.totalCustomers}</span>
          </div>
          <div className="flex justify-between">
            <span>Service Personnel:</span>
            <span className="font-medium">{zoneAnalytics.overview.totalServicePersons}</span>
          </div>
          <div className="flex justify-between">
            <span>SLA Compliance:</span>
            <span className="font-medium">{zoneAnalytics.overview.slaCompliance}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const UserDetailedView = ({ userPerformance }: { userPerformance: UserPerformance }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h3 className="text-xl font-semibold text-gray-800 mb-6">
      {userPerformance.overview.userName || userPerformance.overview.customerName} - Performance Details
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">Performance Metrics</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Tickets:</span>
            <span className="font-medium">{userPerformance.overview.totalTickets}</span>
          </div>
          <div className="flex justify-between">
            <span>Resolution Rate:</span>
            <span className="font-medium">{userPerformance.overview.resolutionRate}%</span>
          </div>
          <div className="flex justify-between">
            <span>Avg Resolution Time:</span>
            <span className="font-medium">{userPerformance.overview.avgResolutionTime}h</span>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const ServicePersonDetailedView = ({ userPerformance }: { userPerformance: UserPerformance }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h3 className="text-xl font-semibold text-gray-800 mb-6">
      {userPerformance.overview.userName} - Service Performance
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">Service Metrics</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Tickets:</span>
            <span className="font-medium">{userPerformance.overview.totalTickets}</span>
          </div>
          <div className="flex justify-between">
            <span>Resolution Rate:</span>
            <span className="font-medium">{userPerformance.overview.resolutionRate}%</span>
          </div>
          <div className="flex justify-between">
            <span>Avg Resolution Time:</span>
            <span className="font-medium">{userPerformance.overview.avgResolutionTime}h</span>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const AdvancedAnalyticsView = ({ dashboardData }: { dashboardData: DashboardData }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-blue-500" />
        Advanced Analytics & Insights
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">Status Distribution</h4>
          <div className="space-y-3">
            {dashboardData.distribution.byStatus.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${
                    item.status === 'OPEN' ? 'bg-blue-500' :
                    item.status === 'IN_PROGRESS' ? 'bg-yellow-500' :
                    item.status === 'RESOLVED' ? 'bg-green-500' :
                    item.status === 'CLOSED' ? 'bg-gray-500' :
                    'bg-purple-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.status}</span>
                </div>
                <div className="text-sm font-bold text-gray-900">{item.count} ({item.percentage.toFixed(1)}%)</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">Priority Distribution</h4>
          <div className="space-y-3">
            {dashboardData.distribution.byPriority.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${
                    item.priority === 'CRITICAL' ? 'bg-red-500' :
                    item.priority === 'HIGH' ? 'bg-orange-500' :
                    item.priority === 'MEDIUM' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.priority}</span>
                </div>
                <div className="text-sm font-bold text-gray-900">{item.count} ({item.percentage.toFixed(1)}%)</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)
