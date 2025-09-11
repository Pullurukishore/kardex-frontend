"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CustomerForm from '../../new/page';
import { fetchCustomer } from '@/services/customer.service';
import { Customer } from '@/types/customer';

export default function EditCustomerPage() {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const data = await fetchCustomer(Number(id));
        setCustomer(data);
      } catch (error) {
        console.error('Error loading customer:', error);
        router.push('/admin/customers');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadCustomer();
    }
  }, [id, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!customer) {
    return <div>Customer not found</div>;
  }

  return <CustomerForm customer={customer} />;
}