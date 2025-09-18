'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/axios';
import { Customer } from '@/types/customer';
import CustomerStats from './CustomerStats';
import CustomerFilters from './CustomerFilters';
import CustomerTable from './CustomerTable';

interface CustomerClientProps {
  initialCustomers: Customer[];
  initialStats: any;
  initialIndustries: string[];
  searchParams: {
    search?: string;
    status?: string;
    industry?: string;
    page?: string;
  };
}

export default function CustomerClient({
  initialCustomers,
  initialStats,
  initialIndustries,
  searchParams
}: CustomerClientProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [stats, setStats] = useState(initialStats);
  const [industries, setIndustries] = useState<string[]>(initialIndustries);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomerData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchParams.search) params.append('search', searchParams.search);
      if (searchParams.status && searchParams.status !== 'all') params.append('status', searchParams.status);
      if (searchParams.industry && searchParams.industry !== 'all') params.append('industry', searchParams.industry);
      if (searchParams.page) params.append('page', searchParams.page);
      params.append('limit', '100');

      const response = await api.get(`/customers?${params.toString()}`);
      const customerData = response.data || [];
      
      setCustomers(customerData);
      
      // Calculate stats
      const newStats = {
        total: customerData.length,
        active: customerData.filter((c: Customer) => c.isActive).length,
        inactive: customerData.filter((c: Customer) => !c.isActive).length,
        totalAssets: customerData.reduce((sum: number, c: Customer) => sum + (c._count?.assets || 0), 0),
        totalTickets: customerData.reduce((sum: number, c: Customer) => sum + (c._count?.tickets || 0), 0)
      };
      setStats(newStats);
      
      // Get unique industries
      const uniqueIndustries = Array.from(new Set(customerData.map((c: Customer) => c.industry).filter(Boolean))) as string[];
      setIndustries(uniqueIndustries);
      
      return true;
    } catch (err) {
      console.error('Failed to fetch customer data:', err);
      setError('Failed to load customer data. Please try again.');
      toast.error('Failed to refresh customer data');
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Fetch fresh data when component mounts or search params change
    fetchCustomerData();
  }, [searchParams.search, searchParams.status, searchParams.industry, searchParams.page]);

  const handleRefresh = async () => {
    await fetchCustomerData();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load customers</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md ${
            isRefreshing 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Stats Cards */}
      <CustomerStats stats={stats} />

      {/* Filters */}
      <CustomerFilters 
        search={searchParams.search}
        status={searchParams.status}
        industry={searchParams.industry}
        industries={industries}
        totalResults={customers.length}
        filteredResults={customers.length}
      />

      {/* Customer Table */}
      <CustomerTable 
        customers={customers}
      />
    </div>
  );
}
