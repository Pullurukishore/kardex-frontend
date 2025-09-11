// src/app/(dashboard)/admin/customers/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Building2, 
  Edit, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Ticket, 
  HardDrive, 
  Calendar,
  AlertCircle,
  Loader2,
  Trash2,
  Plus
} from 'lucide-react';
import { fetchCustomer, deleteCustomer } from '@/services/customer.service';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';
import { Customer, Contact } from '@/types/customer';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

const getStatusBadgeStyles = (isActive: boolean) => {
  return isActive 
    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
    : 'bg-gray-100 text-gray-800 hover:bg-gray-200';
};

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const data = await fetchCustomer(Number(id));
      setCustomer(data);
    } catch (error) {
      console.error('Error loading customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customer details',
        variant: 'destructive',
      });
      router.push('/admin/customers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;
    
    try {
      setDeleting(true);
      await deleteCustomer(customer.id);
      
      toast({
        title: 'Success',
        description: `${customer.companyName} has been deleted successfully`,
      });
      
      router.push('/admin/customers');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete customer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadCustomer();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading customer details...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-medium">Customer not found</h3>
        <p className="mt-1 text-muted-foreground">The customer you're looking for doesn't exist or was deleted.</p>
        <Button className="mt-4" onClick={() => router.push('/admin/customers')}>
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
        </Button>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/admin/customers/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{customer.companyName}</CardTitle>
                    <CardDescription className="mt-1">
                      {customer.serviceZone?.name || 'No service zone assigned'}
                    </CardDescription>
                  </div>
                </div>
                <Badge 
                  className={`${getStatusBadgeStyles(customer.isActive)} capitalize`}
                  variant="outline"
                >
                  {customer.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      <MapPin className="inline-block h-4 w-4 mr-1" />
                      Address
                    </h3>
                    <p className="text-sm">
                      {customer.address || 'N/A'}<br />
                      {customer.city}, {customer.state} {customer.postalCode}<br />
                      {customer.country}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      <Phone className="inline-block h-4 w-4 mr-1" />
                      Contact
                    </h3>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <a 
                          href={`tel:${customer.phone}`} 
                          className="hover:underline hover:text-primary"
                        >
                          {customer.phone || 'N/A'}
                        </a>
                      </p>
                      <p className="text-sm">
                        <a 
                          href={`mailto:${customer.email}`} 
                          className="hover:underline hover:text-primary"
                        >
                          {customer.email}
                        </a>
                      </p>
                      {customer.website && (
                        <p className="text-sm">
                          <a 
                            href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline hover:text-primary"
                          >
                            {customer.website}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">
                      <Calendar className="inline-block h-4 w-4 mr-1" />
                      Additional Information
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Industry:</span>{' '}
                        {customer.industry || 'N/A'}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Tax ID:</span>{' '}
                        {customer.taxId || 'N/A'}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Created:</span>{' '}
                        {format(new Date(customer.createdAt), 'PPpp')}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Last Updated:</span>{' '}
                        {format(new Date(customer.updatedAt), 'PPpp')}
                      </p>
                    </div>
                  </div>

                  {customer.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Notes
                      </h3>
                      <p className="text-sm bg-muted/50 p-3 rounded-md">
                        {customer.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contacts Section */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                  Contacts
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {customer._count.contacts} contact{customer._count.contacts !== 1 ? 's' : ''}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => router.push(`/admin/customers/${customer.id}/contacts/new`)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Contact
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {customer.contacts?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.contacts.map((contact: Contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell>
                          <a 
                            href={`mailto:${contact.email}`}
                            className="hover:underline hover:text-primary"
                          >
                            {contact.email}
                          </a>
                        </TableCell>
                        <TableCell>
                          {contact.phone ? (
                            <a 
                              href={`tel:${contact.phone}`}
                              className="hover:underline hover:text-primary"
                            >
                              {contact.phone}
                            </a>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {contact.role.replace(/_/g, ' ').toLowerCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6">
                  <Users className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">No contacts found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add contacts to this customer to manage their information.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Assets</span>
                </div>
                <Badge variant="outline">
                  {customer._count.assets}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Ticket className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Tickets</span>
                </div>
                <Badge variant="outline">
                  {customer._count.tickets}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Assets Section */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <HardDrive className="h-5 w-5 mr-2 text-muted-foreground" />
                  Assets
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {customer._count.assets} asset{customer._count.assets !== 1 ? 's' : ''}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => router.push(`/admin/customers/${customer.id}/assets/new`)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Asset
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {customer.assets && customer.assets.length > 0 ? (
                <div className="space-y-4">
                  {customer.assets.slice(0, 3).map((asset: any) => (
                    <Link 
                      key={asset.id} 
                      href={`/admin/assets/${asset.id}`}
                      className="block border rounded-lg p-3 hover:bg-accent transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{asset.machineId}</p>
                          <p className="text-sm text-muted-foreground">{asset.model}</p>
                        </div>
                        <Badge variant="outline">
                          {asset.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                  {customer.assets.length > 3 && (
                    <Button 
                      variant="ghost" 
                      className="w-full mt-2"
                      onClick={() => router.push(`/admin/customers/${customer.id}/assets`)}
                    >
                      View all assets
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <HardDrive className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">No assets found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add assets to this customer to track their equipment.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => router.push(`/admin/customers/${customer.id}/assets/new`)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add First Asset
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}