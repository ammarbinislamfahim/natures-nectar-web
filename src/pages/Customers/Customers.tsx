import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { Customer } from '@/types/models';
import { db } from '@/db';
import CustomerForm from './CustomerForm';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import styles from './Customers.module.css';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const allCustomers = await db.customers.getAll();
    setCustomers(allCustomers.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleSave = async (customer: Customer) => {
    try {
      await db.customers.set(customer.id, customer);
      await loadCustomers();
      setIsFormOpen(false);
      setEditCustomer(null);
      toast({
        title: 'Success',
        description: `Customer ${customer.name} has been saved.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save customer.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (customer: Customer) => {
    try {
      await db.customers.remove(customer.id);
      await loadCustomers();
      setDeleteCustomer(null);
      toast({
        title: 'Success',
        description: `Customer ${customer.name} has been deleted.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete customer.',
        variant: 'destructive',
      });
    }
  };

  const viewInvoices = (customerId: string) => {
    navigate(`/invoices?customer=${customerId}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Customers</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>{customer.name}</TableCell>
              <TableCell>{customer.phone}</TableCell>
              <TableCell>{customer.address}</TableCell>
              <TableCell>
                <div className={styles.actions}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => viewInvoices(customer.id)}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditCustomer(customer)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteCustomer(customer)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {(isFormOpen || editCustomer) && (
        <CustomerForm
          customer={editCustomer}
          onSave={handleSave}
          onClose={() => {
            setIsFormOpen(false);
            setEditCustomer(null);
          }}
        />
      )}

      <DeleteConfirmDialog
        isOpen={!!deleteCustomer}
        onClose={() => setDeleteCustomer(null)}
        onConfirm={() => deleteCustomer && handleDelete(deleteCustomer)}
        title="Delete Customer"
        description={`Are you sure you want to delete ${deleteCustomer?.name}? This action cannot be undone.`}
      />
    </div>
  );
};

export default Customers;