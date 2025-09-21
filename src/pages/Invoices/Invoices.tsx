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
import { Plus, Edit, Trash2, Printer } from 'lucide-react';
import { Invoice, Customer } from '@/types/models';
import { db } from '@/db';
import InvoiceForm from './InvoiceForm';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import styles from './Invoices.module.css';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const customerParam = searchParams.get('customer');
    const allInvoices = await db.invoices.getAll();
    const allCustomers = await db.customers.getAll();
    
    setCustomers(allCustomers);
    
    let filteredInvoices = allInvoices;
    if (customerParam) {
      filteredInvoices = allInvoices.filter(
        invoice => invoice.customerId === customerParam
      );
    }
    
    setInvoices(filteredInvoices.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ));
  };

  const handleSave = async (invoice: Invoice) => {
    try {
      await db.invoices.set(invoice.id, invoice);
      await loadData();
      setIsFormOpen(false);
      setEditInvoice(null);
      toast({
        title: 'Success',
        description: `Invoice #${invoice.invoiceNumber} has been saved.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save invoice.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    try {
      await db.invoices.remove(invoice.id);
      await loadData();
      setDeleteInvoice(null);
      toast({
        title: 'Success',
        description: `Invoice #${invoice.invoiceNumber} has been deleted.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete invoice.',
        variant: 'destructive',
      });
    }
  };

  const printInvoice = (invoice: Invoice) => {
    // We'll implement printing functionality later
    window.print();
  };

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || 'Unknown';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Invoices</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Invoice
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>{invoice.invoiceNumber}</TableCell>
              <TableCell>{format(new Date(invoice.date), 'dd/MM/yyyy')}</TableCell>
              <TableCell>{getCustomerName(invoice.customerId)}</TableCell>
              <TableCell>₹{invoice.totalAmount.toFixed(2)}</TableCell>
              <TableCell>{invoice.paymentStatus}</TableCell>
              <TableCell>
                <div className={styles.actions}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => printInvoice(invoice)}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditInvoice(invoice)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteInvoice(invoice)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {(isFormOpen || editInvoice) && (
        <InvoiceForm
          invoice={editInvoice}
          customers={customers}
          onSave={handleSave}
          onClose={() => {
            setIsFormOpen(false);
            setEditInvoice(null);
          }}
        />
      )}

      <DeleteConfirmDialog
        isOpen={!!deleteInvoice}
        onClose={() => setDeleteInvoice(null)}
        onConfirm={() => deleteInvoice && handleDelete(deleteInvoice)}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice #${deleteInvoice?.invoiceNumber}? This action cannot be undone.`}
      />
    </div>
  );
};

export default Invoices;