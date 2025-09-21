import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Invoice, Customer, Product } from '@/types/models';
import { db } from '@/db';
import { format } from 'date-fns';
import styles from './InvoicePrint.module.css';

const InvoicePrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (invoice && customer && Object.keys(products).length > 0) {
      window.print();
    }
  }, [invoice, customer, products]);

  const loadData = async () => {
    if (!id) return;

    const [invoiceData, allProducts] = await Promise.all([
      db.invoices.get(id),
      db.products.getAll(),
    ]);

    if (invoiceData) {
      setInvoice(invoiceData);
      const customerData = await db.customers.get(invoiceData.customerId);
      setCustomer(customerData || null);

      const productsMap = allProducts.reduce((acc, product) => {
        acc[product.id] = product;
        return acc;
      }, {} as Record<string, Product>);
      setProducts(productsMap);
    }
  };

  if (!invoice || !customer) return null;

  return (
    <div className={styles.printContainer}>
      <div className={styles.header}>
        <h1>INVOICE</h1>
        <div className={styles.invoiceInfo}>
          <div>
            <strong>Invoice #:</strong> {invoice.invoiceNumber}
          </div>
          <div>
            <strong>Date:</strong> {format(new Date(invoice.date), 'dd/MM/yyyy')}
          </div>
        </div>
      </div>

      <div className={styles.addresses}>
        <div className={styles.from}>
          <h3>From:</h3>
          <div>Nature's Nectar</div>
          <div>Your Company Address</div>
          <div>Phone: Your Phone</div>
          <div>Email: your@email.com</div>
        </div>
        
        <div className={styles.to}>
          <h3>To:</h3>
          <div>{customer.name}</div>
          <div>{customer.address}</div>
          <div>Phone: {customer.phone}</div>
        </div>
      </div>

      <table className={styles.itemsTable}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={index}>
              <td>{products[item.productId]?.name}</td>
              <td>{item.quantity}</td>
              <td>${item.price.toFixed(2)}</td>
              <td>${(item.quantity * item.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>Total Amount</td>
            <td>${invoice.totalAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td colSpan={3}>Paid Amount</td>
            <td>${invoice.paidAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td colSpan={3}>Balance</td>
            <td>${(invoice.totalAmount - invoice.paidAmount).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      {invoice.notes && (
        <div className={styles.notes}>
          <h3>Notes:</h3>
          <p>{invoice.notes}</p>
        </div>
      )}

      <div className={styles.footer}>
        <p>Thank you for your business!</p>
      </div>
    </div>
  );
};

export default InvoicePrint;