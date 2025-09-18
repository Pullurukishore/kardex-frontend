import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Eye, 
  Edit, 
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
}

export default function CustomerTable({ customers }: CustomerTableProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPp');
    } catch (e) {
      return 'N/A';
    }
  };

  if (!customers.length) {
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
            <Link href="/admin/customers/new">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </Link>
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
          Customers ({customers.length})
        </CardTitle>
        <CardDescription>
          Manage customer relationships and business data
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 min-w-[200px]">Company</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Industry & Location</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Contact</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Assets</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Tickets</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Status</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                        {customer.companyName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Link 
                          href={`/admin/customers/${customer.id}`}
                          className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {customer.companyName}
                        </Link>
                        {customer.serviceZone?.name && (
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {customer.serviceZone.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      {customer.industry ? (
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                          {customer.industry}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">No industry</span>
                      )}
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        {customer.address || 'No address'}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      {customer.contacts && customer.contacts.length > 0 ? (
                        <>
                          {customer.contacts[0]?.name && (
                            <div className="font-medium text-gray-900">{customer.contacts[0].name}</div>
                          )}
                          {customer.contacts[0]?.email && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Mail className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                              <a 
                                href={`mailto:${customer.contacts[0].email}`} 
                                className="hover:underline truncate hover:text-blue-600"
                              >
                                {customer.contacts[0].email}
                              </a>
                            </div>
                          )}
                          {customer.contacts[0]?.phone && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                              <a 
                                href={`tel:${customer.contacts[0].phone}`}
                                className="hover:underline hover:text-blue-600"
                              >
                                {customer.contacts[0].phone}
                              </a>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-gray-400 flex items-center">
                          <Users className="h-3.5 w-3.5 mr-1" />
                          {customer._count?.contacts ? `${customer._count.contacts} contacts` : 'No contacts'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Badge 
                      variant="outline" 
                      className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                    >
                      {customer._count?.assets || 0}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Badge 
                      variant="outline" 
                      className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                    >
                      {customer._count?.tickets || 0}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Badge 
                      className={cn(
                        'capitalize font-medium',
                        customer.isActive 
                          ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
                      )}
                      variant="outline"
                    >
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/customers/${customer.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/customers/${customer.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-green-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/customers/${customer.id}/delete`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-red-50 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
