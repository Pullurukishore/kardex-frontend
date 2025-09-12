'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Plus,
  X,
  FileImage,
  Building2,
  Wrench,
  User,
  MapPin
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

// Types based on backend controller
interface TicketCreateData {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  customerId?: number;
  assetId?: number;
  contactId?: number;
  zoneId: number;
  errorDetails?: string;
  proofImages?: string[];
  relatedMachineIds?: number[];
}

interface Customer {
  id: number;
  companyName: string;
  address: string;
  industry: string;
}

interface Asset {
  id: number;
  machineId: string;
  model: string;
  serialNo: string;
  location: string;
  status: string;
  customerId: number;
}

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  customerId: number;
}

interface Zone {
  id: number;
  name: string;
  description?: string;
}

export default function CreateTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [relatedMachines, setRelatedMachines] = useState<number[]>([]);

  const [formData, setFormData] = useState<TicketCreateData>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    zoneId: 0,
    errorDetails: '',
    proofImages: [],
    relatedMachineIds: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Filter assets and contacts when customer changes
  useEffect(() => {
    if (formData.customerId) {
      setFilteredAssets(assets.filter(asset => asset.customerId === formData.customerId));
      setFilteredContacts(contacts.filter(contact => contact.customerId === formData.customerId));
    } else {
      setFilteredAssets([]);
      setFilteredContacts([]);
    }
    // Reset asset and contact selection when customer changes
    setFormData(prev => ({ ...prev, assetId: undefined, contactId: undefined }));
  }, [formData.customerId, assets, contacts]);

  const loadInitialData = async () => {
    try {
      // Use the new lightweight endpoints for better performance
      const [zoneInfoRes, customersAssetsRes] = await Promise.all([
        apiClient.get('/zone-dashboard/zone-info'),
        apiClient.get('/zone-dashboard/customers-assets')
      ]);
      
      console.log('Zone info response:', zoneInfoRes);
      
      // The backend returns { zone } directly, not wrapped in a data object
      const userZone = (zoneInfoRes as any).zone || zoneInfoRes.data?.zone;
      if (!userZone) {
        console.error('No zone found in response:', zoneInfoRes);
        toast.error('No zone assigned to user');
        return;
      }
      
      console.log('Zone info loaded:', userZone);

      // Set the zone ID in form data and zones
      setFormData(prev => ({ ...prev, zoneId: userZone.id }));
      setZones([userZone]);

      // Get customers with their contacts and assets from the optimized endpoint
      const customers = (customersAssetsRes as any).customers || customersAssetsRes.data?.customers || [];
      console.log('Customers loaded:', customers);
      setCustomers(customers);
      
      if (customers.length === 0) {
        toast.warning('No customers found in your zone. You can still create tickets without selecting a customer.');
      }
      
      // Extract all contacts and assets from customers for easier filtering
      const allContacts: Contact[] = [];
      const allAssets: Asset[] = [];
      
      customers.forEach((customer: any) => {
        if (customer.contacts) {
          customer.contacts.forEach((contact: any) => {
            allContacts.push({
              ...contact,
              customerId: customer.id
            });
          });
        }
        if (customer.assets) {
          customer.assets.forEach((asset: any) => {
            allAssets.push({
              ...asset,
              customerId: customer.id
            });
          });
        }
      });
      
      setContacts(allContacts);
      setAssets(allAssets);
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load zone data. Please check your permissions.');
    }
  };

  const handleInputChange = (field: keyof TicketCreateData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          const uploadRes = await apiClient.upload('/upload/image', file);
          if (uploadRes.data?.url) {
            newImages.push(uploadRes.data.url);
          }
        } catch (error) {
          console.error('Failed to upload image:', error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    }

    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const addRelatedMachine = (assetId: number) => {
    if (!relatedMachines.includes(assetId)) {
      setRelatedMachines(prev => [...prev, assetId]);
    }
  };

  const removeRelatedMachine = (assetId: number) => {
    setRelatedMachines(prev => prev.filter(id => id !== assetId));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.zoneId) {
      newErrors.zoneId = 'Zone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setLoading(true);

    try {
      const ticketData: TicketCreateData = {
        ...formData,
        proofImages: uploadedImages,
        relatedMachineIds: relatedMachines
      };

      const response = await apiClient.post('/tickets', ticketData);
      
      // The backend returns the ticket data directly, and apiClient wraps it in response.data
      const ticket = response.data || response;
      
      if (ticket && ticket.id) {
        toast.success('Ticket created successfully!');
        router.push(`/zone/tickets/${ticket.id}`);
      } else {
        throw new Error('Failed to create ticket');
      }
    } catch (error: any) {
      console.error('Failed to create ticket:', error);
      toast.error(error.response?.data?.error || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const priorityColors = {
    LOW: 'bg-blue-100 text-blue-800 border-blue-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Create New Ticket
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Report an issue or request service for your equipment
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Basic Information */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 p-6 shadow-lg">
            <div className="flex items-center space-x-2 mb-6">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ticket Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                  placeholder="Brief description of the issue"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority *
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value as any)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
                <div className={`mt-2 inline-flex px-3 py-1 rounded-full text-xs font-medium border ${priorityColors[formData.priority]}`}>
                  {formData.priority}
                </div>
              </div>

              {/* Zone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Zone *
                </label>
                <select
                  value={formData.zoneId}
                  onChange={(e) => handleInputChange('zoneId', parseInt(e.target.value))}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.zoneId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                >
                  <option value={0}>Select Zone</option>
                  {zones.map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
                {errors.zoneId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.zoneId}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Customer & Asset Information */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 p-6 shadow-lg">
            <div className="flex items-center space-x-2 mb-6">
              <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Customer & Asset Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer
                </label>
                <select
                  value={formData.customerId || ''}
                  onChange={(e) => handleInputChange('customerId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.companyName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asset */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset
                </label>
                <select
                  value={formData.assetId || ''}
                  onChange={(e) => handleInputChange('assetId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  disabled={!formData.customerId}
                >
                  <option value="">Select Asset</option>
                  {filteredAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.machineId} - {asset.model}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Contact
                </label>
                <select
                  value={formData.contactId || ''}
                  onChange={(e) => handleInputChange('contactId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  disabled={!formData.customerId}
                >
                  <option value="">Select Contact</option>
                  {filteredContacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} - {contact.role} ({contact.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Issue Description */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 p-6 shadow-lg">
            <div className="flex items-center space-x-2 mb-6">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Issue Details</h2>
            </div>

            <div className="space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                  placeholder="Provide detailed description of the issue, symptoms, and any relevant information"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Error Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Error Details / Error Codes
                </label>
                <textarea
                  value={formData.errorDetails || ''}
                  onChange={(e) => handleInputChange('errorDetails', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Any error codes, messages, or technical details"
                />
              </div>
            </div>
          </div>

          {/* Proof Images */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 p-6 shadow-lg">
            <div className="flex items-center space-x-2 mb-6">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <FileImage className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Proof Images</h2>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload images or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </label>
              </div>

              {/* Uploaded Images */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Proof ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Related Machines */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 p-6 shadow-lg">
            <div className="flex items-center space-x-2 mb-6">
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Related Machines</h2>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Select any additional machines that might be related to this issue
              </p>

              {formData.customerId && (
                <div className="space-y-2">
                  {filteredAssets.map(asset => (
                    <div key={asset.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{asset.machineId}</p>
                        <p className="text-sm text-gray-600">{asset.model} - {asset.location}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => 
                          relatedMachines.includes(asset.id) 
                            ? removeRelatedMachine(asset.id)
                            : addRelatedMachine(asset.id)
                        }
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          relatedMachines.includes(asset.id)
                            ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {relatedMachines.includes(asset.id) ? 'Remove' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!formData.customerId && (
                <p className="text-sm text-gray-500 italic">
                  Select a customer first to see available machines
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-end space-x-4"
          >
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Create Ticket</span>
                </>
              )}
            </button>
          </motion.div>
        </motion.form>
      </div>
    </div>
  );
}