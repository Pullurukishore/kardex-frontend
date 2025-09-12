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
import { createCustomer } from '@/services/customer.service';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { getServiceZones } from '@/services/zone.service';
import { CustomerFormData } from '@/types/customer';
import { ServiceZone } from '@/types/zone';
import { ArrowLeft, Building2, Contact, Loader2, MapPin, Phone, Mail, Globe, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const customerFormSchema = z.object({
  // Company Information
  companyName: z.string().min(2, 'Company name is required'),
  address: z.string().min(1, 'Address is required'),
  industry: z.string().min(1, 'Industry is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Valid email is required'),
  website: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  serviceZoneId: z.string().optional(),
  
  // Owner Information
  ownerName: z.string().min(2, 'Owner name is required'),
  ownerEmail: z.string().email('Valid email is required'),
  ownerPassword: z.string().min(6, 'Password must be at least 6 characters'),
  ownerPhone: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

export default function CustomerForm() {
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
    defaultValues: {
      companyName: '',
      address: '',
      industry: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      phone: '',
      email: '',
      status: 'ACTIVE',
      serviceZoneId: undefined,
      ownerName: '',
      ownerEmail: '',
      ownerPassword: '',
      ownerPhone: '',
    },
  });

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      setFormError(null);
      setIsLoading(true);
      
      // Prepare customer data
      const customerData: CustomerFormData = {
        companyName: values.companyName,
        address: values.address,
        industry: values.industry,
        city: values.city,
        state: values.state,
        country: values.country,
        postalCode: values.postalCode,
        phone: values.phone,
        email: values.email,
        website: values.website,
        taxId: values.taxId,
        notes: values.notes,
        status: values.status,
        serviceZoneId: values.serviceZoneId ? parseInt(values.serviceZoneId) : undefined,
      };

      // Include owner information
      const requestData = {
        ...customerData,
        ownerName: values.ownerName,
        ownerEmail: values.ownerEmail,
        ownerPassword: values.ownerPassword,
        ownerPhone: values.ownerPhone,
      };

      await createCustomer(requestData);
      
      toast({
        title: 'Success',
        description: (
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span>Customer and owner account created successfully</span>
          </div>
        ),
      });
      
      router.push('/admin/customers');
    } catch (error: any) {
      console.error('Error creating customer:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create customer. Please try again.';
      
      setFormError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-gray-100"
          onClick={() => router.back()}
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Create New Customer
          </h1>
          <p className="text-muted-foreground mt-1">
            Add a new customer and set up their primary account
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Creating Customer</h3>
              <p className="text-sm text-red-700 mt-1">{formError}</p>
            </div>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">Company Information</CardTitle>
                  <CardDescription className="text-base mt-1">Enter the company details and contact information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Acme Inc." 
                          {...field} 
                          className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 h-11" 
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
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Healthcare, Manufacturing, Retail" 
                          {...field} 
                          className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 h-11" 
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
                      <FormLabel>Service Zone</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 h-11">
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
                      <FormDescription>
                        Assign this customer to a service zone for better management
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input 
                            placeholder="City" 
                            className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 h-11" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="State or Province" 
                          {...field} 
                          className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 h-11" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Country" 
                          {...field} 
                          className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 h-11" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Postal or ZIP code" 
                          {...field} 
                          className="bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 h-11" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Phone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input 
                            placeholder="+1 (555) 000-0000" 
                            className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 h-11" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input 
                            type="email" 
                            placeholder="contact@company.com" 
                            className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 h-11" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Textarea 
                            placeholder="123 Main St, Suite 100" 
                            className="min-h-[100px] pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50 p-6">
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-sm">
                  <Contact className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">Primary Contact</CardTitle>
                  <CardDescription className="text-base mt-1">Set up the primary account for this customer</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Contact className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input 
                            placeholder="John Doe" 
                            className="pl-10 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500/20 h-11" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ownerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input 
                            type="email" 
                            placeholder="john.doe@company.com" 
                            className="pl-10 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500/20 h-11" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ownerPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input 
                            type="password" 
                            placeholder="Create a strong password" 
                            className="pl-10 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500/20 h-11" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        At least 8 characters with numbers and symbols
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ownerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input 
                            placeholder="+1 (555) 000-0000" 
                            className="pl-10 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500/20 h-11" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/customers')}
              disabled={isLoading}
              className="px-6 h-11 border-gray-300 hover:bg-gray-50"
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
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Create Customer
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}