import Dexie, { Table } from 'dexie';
import { Customer, Product, Invoice } from '@/types/models';

export class AppDatabase extends Dexie {
  customers!: Table<Customer>;
  products!: Table<Product>;
  invoices!: Table<Invoice>;

  constructor() {
    super('NaturesNectarDB');
    
    this.version(1).stores({
      customers: '++id, name, email, phone',
      products: '++id, name, category, price',
      invoices: '++id, invoiceNumber, customerId, date, status'
    });
  }
}

export const db = new AppDatabase();