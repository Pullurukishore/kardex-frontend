import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Eye, 
  Pencil, 
  Trash2, 
  Users,
  AlertCircle,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import { Customer } from '@/types/customer';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';

interface CustomerTableProps {
  customers: Customer[];
  readOnly?: boolean;
}

// Memoized customer row component for better performance
const CustomerRow = memo(({ customer, readOnly, basePath }: { customer: Customer; readOnly?: boolean; basePath: string }) => {
  const primaryContact = useMemo(() => {
    return customer.contacts && customer.contacts.length > 0 ? customer.contacts[0] : null;
  }, [customer.contacts]);

  const companyInitial = useMemo(() => {
    return customer.companyName.charAt(0).toUpperCase();
  }, [customer.companyName]);

  return (
    <tr className="hover:bg-blue-50/30 transition-colors duration-150">
      <td className="py-3 px-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
            {companyInitial}
          </div>
          <div className="min-w-0 flex-1">
            <Link 
              href={`${basePath}/customers/${customer.id}`}
              className="font-medium text-gray-900 hover:text-blue-600 transition-colors block break-words leading-tight"
              style={{ wordBreak: 'break-word', hyphens: 'auto' }}
            >
              {customer.companyName}
            </Link>
            {customer.serviceZone?.name && (
              <div className="text-xs text-gray-500 flex items-center mt-1">
                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="break-words">{customer.serviceZone.name}</span>
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-start text-sm text-gray-500 min-w-0">
          <MapPin className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
          <span className="break-words leading-tight">{customer.address || 'No address'}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="min-w-0">
          {primaryContact ? (
            <div className="space-y-1">
              {primaryContact.name && (
                <div className="font-medium text-gray-900 text-sm break-words leading-tight">{primaryContact.name}</div>
              )}
              {primaryContact.email && (
                <div className="flex items-start text-xs text-gray-500 min-w-0">
                  <Mail className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                  <a 
                    href={`mailto:${primaryContact.email}`} 
                    className="hover:underline break-all hover:text-blue-600 leading-tight"
                  >
                    {primaryContact.email}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-400 flex items-center">
              <Users className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="break-words">
                {customer._count?.contacts ? `${customer._count.contacts} contacts` : 'No contacts'}
              </span>
            </div>
          )}
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
          {customer._count?.assets || 0}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
          {customer._count?.tickets || 0}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        <span 
          className={cn(
            'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
            customer.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          )}
        >
          {customer.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <Link 
            href={`${basePath}/customers/${customer.id}`}
            className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-blue-50 transition-colors"
          >
            <Eye className="h-4 w-4 text-gray-600" />
          </Link>
          {!readOnly && (
            <Link 
              href={`/admin/customers/${customer.id}/edit`}
              className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-green-50 transition-colors"
            >
              <Pencil className="h-4 w-4 text-gray-600" />
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
});

CustomerRow.displayName = 'CustomerRow';

const CustomerTable = memo(function CustomerTable({ customers, readOnly = false }: CustomerTableProps) {
  // Memoize the customer count to prevent unnecessary recalculations
  const customerCount = useMemo(() => customers.length, [customers.length]);
  
  // Determine base path based on readOnly mode
  const basePath = readOnly ? '/zone' : '/admin';

  if (!customerCount) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Customers (0)
          </CardTitle>
          <CardDescription>
            Manage customer relationships and business data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
              <Building2 className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500 mb-6">
              Get started by adding your first customer.
            </p>
            {!readOnly && (
              <Link href="/admin/customers/new">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Customer
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <CardTitle className="text-gray-800 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          Customers ({customerCount})
        </CardTitle>
        <CardDescription>
          Manage customer relationships and business data
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm w-1/4">Company</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm w-1/5">Location</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm w-1/5">Contact</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700 text-sm w-16">Assets</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700 text-sm w-16">Tickets</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700 text-sm w-20">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700 text-sm w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((customer) => (
                <CustomerRow key={customer.id} customer={customer} readOnly={readOnly} basePath={basePath} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
});

CustomerTable.displayName = 'CustomerTable';

export default CustomerTable;
