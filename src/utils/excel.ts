import { utils, write, read } from 'xlsx';
import { db } from '../db';
import { Product, Customer, Invoice, InvoiceItem, Payment } from '../types/models';

interface ExcelData {
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  payments: Payment[];
}

export const excelUtils = {
  // Export data to Excel
  async exportToExcel(): Promise<Blob> {
    const data: ExcelData = {
      products: await db.products.getAll(),
      customers: await db.customers.getAll(),
      invoices: await db.invoices.getAll(),
      invoiceItems: await db.invoiceItems.getAll(),
      payments: await db.payments.getAll()
    };

    const wb = utils.book_new();

    // Create worksheets for each data type
    Object.entries(data).forEach(([name, items]) => {
      const ws = utils.json_to_sheet(items);
      utils.book_append_sheet(wb, ws, name);
    });

    // Generate Excel file
    const wbout = write(wb, { 
      bookType: 'xlsx', 
      type: 'array' 
    });

    return new Blob([wbout], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  },

  // Import data from Excel
  async importFromExcel(file: File): Promise<void> {
    const buffer = await file.arrayBuffer();
    const wb = read(buffer);

    const importedData: ExcelData = {
      products: utils.sheet_to_json(wb.Sheets['products']),
      customers: utils.sheet_to_json(wb.Sheets['customers']),
      invoices: utils.sheet_to_json(wb.Sheets['invoices']),
      invoiceItems: utils.sheet_to_json(wb.Sheets['invoiceItems']),
      payments: utils.sheet_to_json(wb.Sheets['payments'])
    };

    // Merge data with existing records
    await this.mergeData(importedData);

    // Update import metadata
    await db.metadata.setImportMetadata({
      lastImported: new Date().toISOString(),
      importCount: (await db.metadata.getImportMetadata())?.importCount ?? 0 + 1
    });
  },

  // Merge imported data with existing data
  private async mergeData(importedData: ExcelData): Promise<void> {
    const mergeItems = async <T extends { id: string, updatedAt: string }>(
      items: T[],
      dbGet: () => Promise<T[]>,
      dbSet: (id: string, item: T) => Promise<T>
    ) => {
      const existing = await dbGet();
      const existingMap = new Map(existing.map(item => [item.id, item]));

      for (const item of items) {
        const existingItem = existingMap.get(item.id);
        if (!existingItem || new Date(item.updatedAt) > new Date(existingItem.updatedAt)) {
          await dbSet(item.id, item);
        }
      }
    };

    // Merge all data types
    await mergeItems(importedData.products, db.products.getAll, db.products.set);
    await mergeItems(importedData.customers, db.customers.getAll, db.customers.set);
    await mergeItems(importedData.invoices, db.invoices.getAll, db.invoices.set);
    await mergeItems(importedData.invoiceItems, db.invoiceItems.getAll, db.invoiceItems.set);
    await mergeItems(importedData.payments, db.payments.getAll, db.payments.set);
  }
};