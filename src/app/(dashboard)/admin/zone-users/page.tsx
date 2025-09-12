'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Users, UserCheck, UserX, MapPin, Shield, MoreHorizontal } from 'lucide-react';
import api from '@/lib/api/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServiceZone {
  id: number;
  name: string;
}

interface ZoneUser {
  id: number;
  email: string;
  role: string;
  isActive: boolean;
  serviceZones: {
    serviceZone: ServiceZone;
  }[];
}

interface ZoneUsersResponse {
  data: ZoneUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ZoneUsersPage() {
  const [zoneUsers, setZoneUsers] = useState<ZoneUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ZoneUser | null>(null);

  const fetchZoneUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        role: 'ZONE_USER' // Only fetch users with ZONE_USER role
      };

      const response = await api.get<ZoneUsersResponse>('/zone-users', { params });
      
      if (response.data) {
        // Filter out any service persons that might still be in the response
        const zoneUsers = (response.data.data || response.data).filter(
          (user: ZoneUser) => user.role === 'ZONE_USER'
        );
        
        setZoneUsers(zoneUsers);
        
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error('Error fetching zone users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch zone users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZoneUsers();
  }, [currentPage, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchZoneUsers();
  };

  const handleDeleteClick = (user: ZoneUser) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await api.delete(`/zone-users/${userToDelete.id}`);

      toast({
        title: 'Success',
        description: 'Zone user deleted successfully',
      });

      fetchZoneUsers();
    } catch (error: any) {
      console.error('Error deleting zone user:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete zone user',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const renderPagination = () => {
    const pages = [];
    return (
      <Card className="shadow-md">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing page <span className="font-semibold">{currentPage}</span> of{' '}
              <span className="font-semibold">{totalPages}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="hover:bg-cyan-50 hover:border-cyan-300 disabled:opacity-50"
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={
                        currentPage === page
                          ? "bg-cyan-600 hover:bg-cyan-700"
                          : "hover:bg-cyan-50 hover:border-cyan-300"
                      }
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="hover:bg-cyan-50 hover:border-cyan-300 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'default';
      case 'SERVICE_PERSON':
        return 'secondary';
      case 'CUSTOMER':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading zone users...</div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalUsers = zoneUsers.length;
  const activeUsers = zoneUsers.filter(u => u.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;
  const totalZoneAssignments = zoneUsers.reduce((acc, user) => acc + user.serviceZones.length, 0);
  const adminUsers = zoneUsers.filter(u => u.role === 'ADMIN').length;
  const zoneUserCount = zoneUsers.filter(u => u.role === 'ZONE_USER').length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-800 p-6 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Zone Users</h1>
            <p className="text-cyan-100">
              Manage users assigned to service zones and their permissions
            </p>
          </div>
          <Link href="/admin/zone-users/new">
            <Button className="bg-white text-cyan-600 hover:bg-cyan-50 shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Zone User
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-600">Total Users</p>
                <p className="text-2xl font-bold text-cyan-900">{totalUsers}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-cyan-500 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Users</p>
                <p className="text-2xl font-bold text-green-900">{activeUsers}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Admin Users</p>
                <p className="text-2xl font-bold text-orange-900">{adminUsers}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Zone Assignments</p>
                <p className="text-2xl font-bold text-purple-900">{totalZoneAssignments}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <CardTitle className="text-gray-800">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by email or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                type="submit" 
                onClick={handleSearch}
                className="bg-cyan-600 hover:bg-cyan-700 shadow-md"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Zone Users Table */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-t-lg">
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-600" />
            Zone Users ({zoneUsers.length})
          </CardTitle>
          <CardDescription>
            Manage users assigned to service zones and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {zoneUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center mb-4">
                <Users className="h-12 w-12 text-cyan-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No zone users found</h3>
              <p className="text-gray-500 mb-6">
                Get started by assigning users to service zones.
              </p>
              <Link href="/admin/zone-users/new">
                <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Zone User
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">User Details</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Role & Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Assigned Zones</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {zoneUsers.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-blue-50/50 transition-all duration-200">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{user.email}</div>
                            <div className="text-sm text-gray-500">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-2">
                          <Badge 
                            variant={getRoleBadgeVariant(user.role)}
                            className={
                              user.role === 'ADMIN' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' :
                              user.role === 'ZONE_USER' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                              'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }
                          >
                            {user.role.replace('_', ' ')}
                          </Badge>
                          <div>
                            <Badge 
                              variant={user.isActive ? 'default' : 'secondary'}
                              className={user.isActive 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {user.serviceZones.length > 0 ? (
                            user.serviceZones.map((zone) => (
                              <Badge 
                                key={zone.serviceZone.id} 
                                variant="outline"
                                className="bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100"
                              >
                                {zone.serviceZone.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400 italic">No zones assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/zone-users/${user.id}`} className="flex items-center">
                                <Eye className="mr-2 h-4 w-4 text-blue-500" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/zone-users/${user.id}/edit`} className="flex items-center">
                                <Edit className="mr-2 h-4 w-4 text-green-500" />
                                Edit Zones
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(user)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove from Zones
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </CardContent>
    </Card>

    {/* Enhanced Pagination */}
    {totalPages > 1 && (
      <Card className="shadow-md">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing page <span className="font-semibold">{currentPage}</span> of{' '}
              <span className="font-semibold">{totalPages}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="hover:bg-cyan-50 hover:border-cyan-300 disabled:opacity-50"
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={
                        currentPage === page
                          ? "bg-cyan-600 hover:bg-cyan-700"
                          : "hover:bg-cyan-50 hover:border-cyan-300"
                      }
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="hover:bg-cyan-50 hover:border-cyan-300 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Enhanced Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Remove Zone User
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            This action will permanently remove <span className="font-semibold">"{userToDelete?.email}"</span> from all assigned service zones. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="hover:bg-gray-100">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDeleteConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Remove User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);
}
