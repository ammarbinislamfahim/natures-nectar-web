import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Invoice } from '@/types/models';
import { db } from '@/db';
import { useToast } from '@/components/ui/use-toast';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Printer, Receipt, ArrowLeft } from 'lucide-react';
import styles from './InvoiceDetail.module.css';

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadInvoice(id);
    }
  }, [id]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      const data = await db.invoices.get(invoiceId);
      if (data) {
        setInvoice(data);
      } else {
        toast({
          title: 'Error',
          description: 'Invoice not found.',
          variant: 'destructive',
        });
        navigate('/invoices');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load invoice.',
        variant: 'destructive',
      });
    }
  };

  if (!invoice) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
        </Button>
        <div className={styles.actions}>
          <Button onClick={() => navigate(`/invoices/${id}/print`)}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button onClick={() => navigate(`/invoices/${id}/payment`)}>
            <Receipt className="mr-2 h-4 w-4" /> Record Payment
          </Button>
        </div>
      </div>

      <div className={styles.invoice}>
        <div className={styles.invoiceHeader}>
          <h1>Invoice #{invoice.invoiceNumber}</h1>
          <div className={`${styles.status} ${styles[invoice.status.toLowerCase()]}`}>
            {invoice.status}
          </div>
        </div>

        <div className={styles.details}>
          <div className={styles.section}>
            <h2>Customer Details</h2>
            <p>{invoice.customerName}</p>
          </div>

          <div className={styles.section}>
            <h2>Invoice Details</h2>
            <p>Date: {formatDate(invoice.createdAt)}</p>
            <p>Due Date: {formatDate(invoice.dueDate || '')}</p>
          </div>
        </div>

        <div className={styles.items}>
          <h2>Items</h2>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{formatCurrency(item.quantity * item.price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Total</td>
                <td>{formatCurrency(invoice.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {invoice.notes && (
          <div className={styles.notes}>
            <h2>Notes</h2>
            <p>{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetail;