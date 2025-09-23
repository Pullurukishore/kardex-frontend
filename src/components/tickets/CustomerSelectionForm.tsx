'use client';

import { Control } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Users, Settings, Plus, Loader2, MapPin } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  companyName: string;
  serviceZoneId: number;
  contacts: Array<{id: number, name: string, email: string, phone: string}>;
  assets: Array<{id: number, model?: string, serialNo?: string, serialNumber?: string}>;
}

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Asset {
  id: number;
  model?: string;
  serialNo?: string;
  serialNumber?: string;
}

interface CustomerSelectionFormProps {
  control: Control<any>;
  customers: Customer[];
  contacts: Contact[];
  assets: Asset[];
  zoneId: number | undefined;
  customerId: string;
  isSubmitting: boolean;
  isLoadingCustomers: boolean;
  onAddContactClick: () => void;
  onAddAssetClick: () => void;
}

export function CustomerSelectionForm({
  control,
  customers,
  contacts,
  assets,
  zoneId,
  customerId,
  isSubmitting,
  isLoadingCustomers,
  onAddContactClick,
  onAddAssetClick
}: CustomerSelectionFormProps) {
  return (
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
          control={control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-green-500" />
                  <span>Customer</span>
                  {isLoadingCustomers && <Loader2 className="h-3 w-3 animate-spin text-green-500" />}
                </FormLabel>
                {zoneId && (
                  <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>Zone ID: {customers[0]?.serviceZoneId || 'N/A'}</span>
                  </div>
                )}
              </div>
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
            control={control}
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
                            <span>{contact.name}{contact.phone ? ` - ${contact.phone}` : ''}</span>
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
                      onClick={onAddContactClick}
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
            control={control}
            name="assetId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-indigo-500" />
                  <span>Asset</span>
                </FormLabel>
                <div className="flex gap-2">
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
                                ? 'No assets available - Add one below' 
                                : 'Select asset'
                          } 
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
                  {customerId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onAddAssetClick}
                      disabled={isSubmitting || isLoadingCustomers}
                      className="flex-shrink-0 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Asset
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
