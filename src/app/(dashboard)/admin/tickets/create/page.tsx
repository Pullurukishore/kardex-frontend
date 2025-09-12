'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Loader2, 
  Ticket, 
  AlertCircle, 
  Building2, 
  Users, 
  MapPin, 
  Settings, 
  FileText, 
  ArrowLeft,
  CheckCircle,
  Clock,
  Zap,
  Plus,
  Mail,
  Phone,
  User
} from 'lucide-react';
import api from '@/lib/api/axios';
import { Priority } from '@/types';
import { Customer, Contact } from '@/types/customer';
import { Asset } from '@/types/asset';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  customerId: z.string().min(1, 'Customer is required'),
  contactId: z.string().min(1, 'Contact person is required'),
  assetId: z.string().optional(),
  zoneId: z.string().min(1, 'Zone is required'),
  errorDetails: z.string().optional(),
  relatedMachineIds: z.string().optional(),
});

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  position: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type ContactFormValues = z.infer<typeof contactSchema>;

export default function CreateTicketPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isCreatingContact, setIsCreatingContact] = useState(false);
  const [customers, setCustomers] = useState<Array<{
    id: number;
    name: string;
    companyName: string;
    contacts: Array<{id: number, name: string, email: string, phone: string}>;
    assets: Array<{id: number, model?: string, serialNo?: string, serialNumber?: string}>;
  }>>([]);
  const [contacts, setContacts] = useState<Array<{id: number, name: string, email: string, phone: string}>>([]);
  const [assets, setAssets] = useState<Array<{id: number, model?: string, serialNo?: string, serialNumber?: string}>>([]);
  const [zones, setZones] = useState<Array<{
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    servicePersons: Array<{id: number, user: {id: number, email: string}}>;
  }>>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      priority: 'MEDIUM',
    },
  });

  const contactForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      position: '',
    },
  });

  // Fetch zones on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const zonesRes = await api.get('/service-zones');
        setZones(zonesRes.data?.data || []);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load form data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch customers when zone changes
  const zoneId = form.watch('zoneId');
  useEffect(() => {
    const fetchZoneCustomers = async () => {
      if (!zoneId) {
        setCustomers([]);
        setContacts([]);
        setAssets([]);
        form.setValue('customerId', '');
        form.setValue('contactId', '');
        form.setValue('assetId', '');
        return;
      }

      try {
        setIsLoadingCustomers(true);
        // Use the customers endpoint with zone filter
        const customersRes = await api.get(`/customers?serviceZoneId=${zoneId}&include=contacts,assets`);
        
        // Map the API response to match our expected format
        const formattedCustomers = customersRes.data.map((customer: any) => ({
          ...customer,
          contacts: customer.contacts || [],
          assets: customer.assets || []
        }));
        
        setCustomers(formattedCustomers);
        
        // Reset customer-dependent fields
        form.setValue('customerId', '');
        form.setValue('contactId', '');
        form.setValue('assetId', '');
        setContacts([]);
        setAssets([]);
      } catch (error) {
        console.error('Error fetching zone customers:', error);
        toast({
          title: 'Error',
          description: 'Failed to load customers for selected zone. Please try again.',
          variant: 'destructive',
        });
        setCustomers([]);
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    fetchZoneCustomers();
  }, [zoneId, form, toast]);

  // Update contacts and assets when customer changes
  const customerId = form.watch('customerId');
  useEffect(() => {
    const updateCustomerData = () => {
      if (!customerId) {
        setContacts([]);
        setAssets([]);
        form.setValue('contactId', '');
        form.setValue('assetId', '');
        return;
      }
      
      // Find the selected customer
      const selectedCustomer = customers.find(c => c.id.toString() === customerId);
      if (selectedCustomer) {
        setContacts(selectedCustomer.contacts || []);
        setAssets(selectedCustomer.assets || []);
        form.setValue('contactId', '');
        form.setValue('assetId', '');
        
        // If there's only one contact, auto-select it
        if (selectedCustomer.contacts?.length === 1) {
          form.setValue('contactId', selectedCustomer.contacts[0].id.toString());
        }
      }
    };

    try {
      updateCustomerData();
    } catch (error) {
      console.error('Error updating customer data:', error);
      toast({
        title: 'Error',
        description: 'Failed to update customer data. Please try again.',
        variant: 'destructive',
      });
    }
  }, [customerId, form, customers, toast]);

  // Handle contact creation
  const handleCreateContact = async (values: ContactFormValues) => {
    if (!customerId) {
      toast({
        title: 'Error',
        description: 'Please select a customer first',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreatingContact(true);
      
      const payload = {
        ...values,
        customerId: parseInt(customerId),
      };

      const response = await api.post('/contacts', payload);
      const newContact = response.data;
      
      // Update the contacts list
      setContacts(prev => [...prev, newContact]);
      
      // Update the customers array to include the new contact
      setCustomers(prev => prev.map(customer => 
        customer.id.toString() === customerId 
          ? { ...customer, contacts: [...customer.contacts, newContact] }
          : customer
      ));
      
      // Auto-select the newly created contact
      form.setValue('contactId', newContact.id.toString());
      
      // Reset the contact form and close dialog
      contactForm.reset();
      setIsAddContactOpen(false);
      
      toast({
        title: 'Success',
        description: `Contact "${newContact.name}" has been created and selected.`,
      });
    } catch (error: any) {
      console.error('Error creating contact:', error);
      
      let errorMessage = 'Failed to create contact. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsCreatingContact(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const payload = {
        ...values,
        customerId: parseInt(values.customerId),
        contactId: parseInt(values.contactId),
        assetId: values.assetId ? parseInt(values.assetId) : undefined,
        zoneId: parseInt(values.zoneId),
        relatedMachineIds: values.relatedMachineIds 
          ? values.relatedMachineIds.split(',').map((id: string) => id.trim())
          : undefined,
      };

      const response = await api.post('/tickets', payload);
      const ticketData = response.data;
      
      // Get customer and zone names for better success message
      const selectedCustomer = customers.find(c => c.id.toString() === values.customerId);
      const selectedZone = zones.find(z => z.id.toString() === values.zoneId);
      
      toast({
        title: '🎉 Ticket Created Successfully!',
        description: `Ticket #${ticketData.id || 'New'} has been created for ${selectedCustomer?.companyName || 'customer'} in ${selectedZone?.name || 'selected zone'}. Redirecting to tickets page...`,
        duration: 3000,
      });
      
      // Reset form to allow creating another ticket if needed
      form.reset({
        priority: 'MEDIUM',
      });
      
      // Wait for user to see the success message, then redirect
      setTimeout(() => {
        router.push('/admin/tickets');
        router.refresh(); // Ensure the page updates with the new data
      }, 1500);
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      
      let errorMessage = 'Failed to create ticket. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: '❌ Error Creating Ticket',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Form Data</h3>
            <p className="text-gray-500">Preparing ticket creation form...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Enhanced Header with Gradient */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-800 p-6 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Ticket className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Create New Ticket</h1>
              <p className="text-indigo-100">
                Submit a new support request with detailed information for faster resolution
              </p>
            </div>
          </div>
          <Button 
            variant="outline"
            onClick={() => router.back()}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-800">Ticket Information</CardTitle>
                  <CardDescription>Basic details about the support ticket</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter ticket title" 
                        {...field} 
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the issue in detail..."
                        className="min-h-[120px]"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span>Priority</span>
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW" className="text-green-600">
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 rounded-full bg-green-500"></div>
                              <span>Low Priority</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="MEDIUM" className="text-yellow-600">
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                              <span>Medium Priority</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="HIGH" className="text-red-600">
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 rounded-full bg-red-500"></div>
                              <span>High Priority</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="zoneId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <span>Service Zone</span>
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isSubmitting || zones.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <SelectValue placeholder={zones.length === 0 ? 'No zones available' : 'Select service zone'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(zones) && zones.length > 0 ? (
                            zones.filter(zone => zone.isActive).map((zone) => (
                              <SelectItem key={zone.id} value={zone.id.toString()}>
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-3 w-3 text-blue-500" />
                                  <span>{zone.name}</span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              No active zones available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg border-b">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-800">Customer Information</CardTitle>
                  <CardDescription>Details about the customer and their assets</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-green-500" />
                      <span>Customer</span>
                      {isLoadingCustomers && <Loader2 className="h-3 w-3 animate-spin text-green-500" />}
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isSubmitting || !zoneId || isLoadingCustomers || customers.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="focus:ring-2 focus:ring-green-500 focus:border-green-500">
                          <SelectValue placeholder={
                            !zoneId 
                              ? 'Select a service zone first' 
                              : isLoadingCustomers 
                                ? 'Loading customers...' 
                                : customers.length === 0 
                                  ? 'No customers available in this zone' 
                                  : 'Select customer'
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-3 w-3 text-green-500" />
                              <span>{customer.companyName}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contactId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        <span>Contact Person</span>
                      </FormLabel>
                      <div className="flex gap-2">
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!customerId || contacts.length === 0 || isSubmitting || isLoadingCustomers}
                        >
                          <FormControl>
                            <SelectTrigger className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                              <SelectValue 
                                placeholder={
                                  !customerId 
                                    ? 'Select a customer first' 
                                    : contacts.length === 0 
                                      ? 'No contacts available' 
                                      : 'Select contact person'
                                } 
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contacts.map((contact) => (
                              <SelectItem key={contact.id} value={contact.id.toString()}>
                                <div className="flex items-center space-x-2">
                                  <Users className="h-3 w-3 text-purple-500" />
                                  <span>{contact.name} ({contact.email})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {customerId && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddContactOpen(true)}
                            disabled={isSubmitting || isLoadingCustomers}
                            className="flex-shrink-0 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Contact
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="assetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Settings className="h-4 w-4 text-indigo-500" />
                        <span>Asset (Optional)</span>
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ''}
                        disabled={!customerId || assets.length === 0 || isSubmitting || isLoadingCustomers}
                      >
                        <FormControl>
                          <SelectTrigger className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                            <SelectValue 
                              placeholder={
                                !customerId 
                                  ? 'Select a customer first' 
                                  : assets.length === 0 
                                    ? 'No assets available' 
                                    : 'Select asset (optional)'
                              } 
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">
                            <div className="flex items-center space-x-2">
                              <div className="h-3 w-3 rounded-full border-2 border-gray-300"></div>
                              <span>None</span>
                            </div>
                          </SelectItem>
                          {assets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id.toString()}>
                              <div className="flex items-center space-x-2">
                                <Settings className="h-3 w-3 text-indigo-500" />
                                <span>{asset.model} (SN: {asset.serialNumber || asset.serialNo || 'N/A'})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg border-b">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-800">Additional Information</CardTitle>
                  <CardDescription>Additional details that might help resolve the issue</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <FormField
                control={form.control}
                name="errorDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span>Error Details (Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any error messages, codes, or technical details..."
                        className="min-h-[100px] focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        disabled={isSubmitting}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-500">
                      Include any error messages, codes, or technical details that might help with diagnosis
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="relatedMachineIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span>Related Machine IDs (Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., MACHINE001, MACHINE002, MACHINE003"
                        className="focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        disabled={isSubmitting}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-500">
                      Separate multiple machine IDs with commas if this issue affects multiple machines
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Enhanced Action Buttons */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-6">
              <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>All required fields will be validated before submission</span>
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                    className="hover:bg-gray-50 border-gray-300"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg text-white px-8"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Ticket...
                      </>
                    ) : (
                      <>
                        <Ticket className="mr-2 h-4 w-4" />
                        Create Ticket
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Add Contact Dialog - Outside the main form to avoid focus issues */}
      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>
                  Create a new contact for the selected customer
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Form {...contactForm}>
            <form onSubmit={contactForm.handleSubmit(handleCreateContact)} className="space-y-4">
              <FormField
                control={contactForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-purple-500" />
                      <span>Full Name</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter contact's full name" 
                        {...field} 
                        disabled={isCreatingContact}
                        className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={contactForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span>Email Address</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="contact@company.com" 
                        {...field} 
                        disabled={isCreatingContact}
                        className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={contactForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-green-500" />
                      <span>Phone Number</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+1 (555) 123-4567" 
                        {...field} 
                        disabled={isCreatingContact}
                        className="focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={contactForm.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-orange-500" />
                      <span>Position (Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., IT Manager, Operations Director" 
                        {...field} 
                        disabled={isCreatingContact}
                        className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddContactOpen(false);
                    contactForm.reset();
                  }}
                  disabled={isCreatingContact}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreatingContact}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {isCreatingContact ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Contact
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}