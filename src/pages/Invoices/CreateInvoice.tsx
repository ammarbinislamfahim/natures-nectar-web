import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from '@/components/ui/select';
import { Customer, Product, Invoice, InvoiceItem } from '@/types/models';
import { db } from '@/db';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import styles from './CreateInvoice.module.css';

const CreateInvoice: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [note, setNote] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadCustomersAndProducts();
  }, []);

  const loadCustomersAndProducts = async () => {
    const [allCustomers, allProducts] = await Promise.all([
      db.customers.getAll(),
      db.products.getAll()
    ]);
    setCustomers(allCustomers);
    setProducts(allProducts);
  };

  const addItem = () => {
    setItems([...items, {
      id: crypto.randomUUID(),
      productId: '',
      quantity: 1,
      price: 0,
      total: 0
    }]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        item.productId = value;
        item.price = product.price;
        item.total = product.price * item.quantity;
      }
    } else if (field === 'quantity') {
      item.quantity = parseInt(value) || 0;
      item.total = item.price * item.quantity;
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSave = async () => {
    if (!selectedCustomer || items.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a customer and add at least one item.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const invoice: Invoice = {
        id: crypto.randomUUID(),
        customerId: selectedCustomer,
        items,
        total: calculateTotal(),
        note,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.invoices.set(invoice.id, invoice);
      toast({
        title: 'Success',
        description: 'Invoice has been created successfully.'
      });
      navigate(`/invoices/${invoice.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create invoice.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className={styles.container}>
      <h1>Create New Invoice</h1>

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label>Customer</label>
          <Select onValueChange={setSelectedCustomer}>
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={styles.items}>
          <div className={styles.itemsHeader}>
            <h2>Items</h2>
            <Button onClick={addItem}>Add Item</Button>
          </div>

          {items.map((item, index) => (
            <div key={item.id} className={styles.itemRow}>
              <Select
                value={item.productId}
                onValueChange={(value) => updateItem(index, 'productId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
              />

              <div className={styles.price}>
                ${item.price.toFixed(2)}
              </div>

              <div className={styles.total}>
                ${item.total.toFixed(2)}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
              >
                ✕
              </Button>
            </div>
          ))}

          <div className={styles.total}>
            <strong>Total: ${calculateTotal().toFixed(2)}</strong>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Note</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note to this invoice (optional)"
          />
        </div>

        <div className={styles.actions}>
          <Button variant="outline" onClick={() => navigate('/invoices')}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Create Invoice
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;