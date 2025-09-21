// Add this to your existing db.ts file
invoices: {
  schema: {
    id: 'string',
    invoiceNumber: 'string',
    customerId: 'string',
    date: 'string',
    items: 'array',
    paymentStatus: 'string',
    totalAmount: 'number',
    notes: 'string?',
    updatedAt: 'string',
  },
  indexes: ['invoiceNumber', 'customerId', 'date', 'paymentStatus'],
},