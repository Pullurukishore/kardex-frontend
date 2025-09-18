"use client";

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { createCustomer, updateCustomer } from '@/services/customer.service';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { getServiceZones } from '@/services/zone.service';
import { ServiceZone } from '@/types/zone';
import { ArrowLeft, Building2, Contact, Loader2, MapPin, Phone, Mail, Globe, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const customerFormSchema = z.object({
  // Company Information
  companyName: z.string().min(2, 'Company name is required'),
  industry: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  serviceZoneId: z.number().min(1, 'Service zone is required'),
  
  // Contact Information
  contactName: z.string().min(2, 'Contact name is required'),
  contactPhone: z.string().regex(/^\d{10}$/, 'Contact phone must be exactly 10 digits'),
  contactEmail: z.string().email('Valid email is required').optional().or(z.literal('')),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormComponentProps {
  customer?: {
    companyName: string;
    industry?: string;
    address?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    serviceZoneId: number;
    contactName: string;
    contactPhone: string;
  };
  customerId?: number;
}

export default function CustomerFormComponent({ customer, customerId }: CustomerFormComponentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [serviceZones, setServiceZones] = useState<ServiceZone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const loadServiceZones = async () => {
      try {
        // Use a reasonable limit that works with the API
        const response = await getServiceZones(1, 100);
        setServiceZones(response.data);
      } catch (error) {
        console.error('Failed to load service zones:', error);
        toast({
          title: 'Error',
          description: 'Failed to load service zones. Please try again later.',
          variant: 'destructive',
        });
      }
    };

    loadServiceZones();
  }, []);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: customer ? {
      companyName: customer.companyName,
      industry: customer.industry || '',
      address: customer.address || '',
      status: customer.status,
      serviceZoneId: customer.serviceZoneId,
      contactName: customer.contactName,
      contactPhone: customer.contactPhone,
    } : {
      companyName: '',
      industry: '',
      address: '',
      status: 'ACTIVE',
      serviceZoneId: 0,
      contactName: '',
      contactPhone: ''
    }
  });

  const onSubmit = async (data: CustomerFormValues) => {
    if (customer && customerId) {
      // Handle update logic here
      console.log('Updating customer:', data);
    } else {
      // Handle create logic here
      console.log('Creating customer:', data);
    }
    try {
      setFormError(null);
      setIsLoading(true);
      
      // Prepare customer data
      const customerData = {
        companyName: data.companyName,
        address: data.address,
        industry: data.industry,
        status: data.status,
        serviceZoneId: data.serviceZoneId,
      };

      // Include contact information
      const requestData = {
        ...customerData,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
      };

      if (customer && customerId) {
        await updateCustomer(customerId, requestData);
        toast({
          title: 'Success',
          description: (
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Customer updated successfully</span>
            </div>
          ),
        });
      } else {
        await createCustomer(requestData);
        toast({
          title: 'Success',
          description: (
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Customer and contact created successfully</span>
            </div>
          ),
        });
      }
      
      router.push('/admin/customers');
    } catch (error: any) {
      console.error('Error creating/updating customer:', error);
      const errorMessage = error.response?.data?.error || 'Failed to process customer. Please try again.';
      
      setFormError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold">
                  {customer ? 'Edit Customer' : 'Add New Customer'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {customer ? 'Update the customer details' : 'Enter the customer details below'}
                </p>
              </div>
            </div>

            {/* Error Alert */}
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      {customer ? 'Error Updating Customer' : 'Error Creating Customer'}
                    </h3>
                    <p className="text-sm text-red-700 mt-1">{formError}</p>
                  </div>
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="overflow-hidden border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <CardTitle className="flex items-center space-x-2 text-blue-800">
                      <Building2 className="h-5 w-5" />
                      <span>Company Information</span>
                    </CardTitle>
                    <CardDescription className="text-blue-600">
                      Enter the basic company details and contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Company Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter company name" 
                                {...field}
                                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Industry *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Technology, Healthcare" 
                                {...field}
                                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Address *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter complete address" 
                              {...field}
                              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="serviceZoneId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Service Zone</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-blue-500">
                                <SelectValue placeholder="Select a service zone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {serviceZones.map((zone) => (
                                <SelectItem key={zone.id} value={zone.id.toString()}>
                                  {zone.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-blue-500">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ACTIVE">
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  Active
                                </Badge>
                              </SelectItem>
                              <SelectItem value="INACTIVE">
                                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                  Inactive
                                </Badge>
                              </SelectItem>
                              <SelectItem value="SUSPENDED">
                                <Badge variant="destructive" className="bg-red-100 text-red-800">
                                  Suspended
                                </Badge>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                    <CardTitle className="flex items-center space-x-2 text-green-800">
                      <Contact className="h-5 w-5" />
                      <span>Contact Information</span>
                    </CardTitle>
                    <CardDescription className="text-green-600">
                      Enter the primary contact person details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Contact Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Full name" 
                                {...field}
                                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Contact Phone *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Phone number" 
                                {...field}
                                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()}
                    className="h-11 px-6"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="min-w-[140px] h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {customer ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {customer ? 'Update Customer' : 'Create Customer'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
