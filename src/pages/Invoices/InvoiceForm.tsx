import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Customer, Invoice, InvoiceItem } from '@/types/models';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import styles from './InvoiceForm.module.css';
import { X } from 'lucide-react';

const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  amount: z.number(),
});

const invoiceSchema = z.object({
  id: z.string().optional(),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  customerId: z.string().min(1, 'Customer is required'),
  date: z.string().min(1, 'Date is required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  paymentStatus: z.string().min(1, 'Payment status is required'),
  totalAmount: z.number(),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  invoice?: Invoice | null;
  customers: Customer[];
  onSave: (invoice: Invoice) => void;
  onClose: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, customers, onSave, onClose }) => {
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(!invoice);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoice || {
      invoiceNumber: '',
      customerId: '',
      date: new Date().toISOString().split('T')[0],
      items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }],
      paymentStatus: 'PENDING',
      totalAmount: 0,
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const calculateItemAmount = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  const watchItems = watch('items');

  React.useEffect(() => {
    const total = watchItems.reduce((sum, item) => {
      return sum + calculateItemAmount(item.quantity || 0, item.unitPrice || 0);
    }, 0);
    setValue('totalAmount', total);
  }, [watchItems, setValue]);

  const generateInvoiceNumber = async () => {
    if (isGeneratingNumber) {
      const allInvoices = await db.invoices.getAll();
      const lastNumber = Math.max(...allInvoices.map(i => 
        parseInt(i.invoiceNumber.replace('INV-', '')) || 0
      ));
      const newNumber = `INV-${String(lastNumber + 1).padStart(4, '0')}`;
      setValue('invoiceNumber', newNumber);
      setIsGeneratingNumber(false);
    }
  };

  React.useEffect(() => {
    generateInvoiceNumber();
  }, []);

  const onSubmit = (data: InvoiceFormData) => {
    const invoiceData: Invoice = {
      ...data,
      id: invoice?.id || crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
      items: data.items.map(item => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        amount: calculateItemAmount(item.quantity, item.unitPrice),
      })),
    };
    onSave(invoiceData);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{invoice ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.formHeader}>
            <div className={styles.formGroup}>
              <label>Invoice Number</label>
              <Input {...register('invoiceNumber')} />
              {errors.invoiceNumber && (
                <span className={styles.error}>{errors.invoiceNumber.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Date</label>
              <Input type="date" {...register('date')} />
              {errors.date && (
                <span className={styles.error}>{errors.date.message}</span>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Customer</label>
            <Select
              onValueChange={(value) => setValue('customerId', value)}
              defaultValue={invoice?.customerId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customerId && (
              <span className={styles.error}>{errors.customerId.message}</span>
            )}
          </div>

          <div className={styles.itemsTable}>
            <h3>Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={field.id}>
                    <td>
                      <Input
                        {...register(`items.${index}.description`)}
                        placeholder="Item description"
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        {...register(`items.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                        min="1"
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        {...register(`items.${index}.unitPrice`, {
                          valueAsNumber: true,
                        })}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      ₹{calculateItemAmount(
                        watchItems[index]?.quantity || 0,
                        watchItems[index]?.unitPrice || 0
                      ).toFixed(2)}
                    </td>
                    <td>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button
              type="button"
              variant="outline"
              onClick={() => append({
                description: '',
                quantity: 1,
                unitPrice: 0,
                amount: 0,
              })}
            >
              Add Item
            </Button>
          </div>

          <div className={styles.formFooter}>
            <div className={styles.formGroup}>
              <label>Payment Status</label>
              <Select
                onValueChange={(value) => setValue('paymentStatus', value)}
                defaultValue={invoice?.paymentStatus || 'PENDING'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={styles.formGroup}>
              <label>Notes</label>
              <Input {...register('notes')} placeholder="Additional notes..." />
            </div>

            <div className={styles.total}>
              <span>Total Amount:</span>
              <span>₹{watch('totalAmount').toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Invoice</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceForm;