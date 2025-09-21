import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Invoice } from '@/types/models';
import { db } from '@/db';
import { format } from 'date-fns';
import styles from './Dashboard.module.css';

const Dashboard: React.FC = () => {
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Get counts
    const customers = await db.customers.getAll();
    const products = await db.products.getAll();
    const invoices = await db.invoices.getAll();

    setTotalCustomers(customers.length);
    setTotalProducts(products.length);
    setTotalInvoices(invoices.length);

    // Get recent invoices
    const sortedInvoices = invoices.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setRecentInvoices(sortedInvoices.slice(0, 5));

    // Calculate monthly data
    const monthlyStats = calculateMonthlyStats(invoices);
    setMonthlyData(monthlyStats);
  };

  const calculateMonthlyStats = (invoices: Invoice[]) => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: format(date, 'MMM'),
        total: 0,
        count: 0,
      };
    }).reverse();

    invoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.date);
      const monthIndex = last6Months.findIndex(
        item => item.month === format(invoiceDate, 'MMM')
      );
      if (monthIndex !== -1) {
        last6Months[monthIndex].total += invoice.total;
        last6Months[monthIndex].count += 1;
      }
    });

    return last6Months;
  };

  return (
    <div className={styles.container}>
      <h1>Dashboard</h1>
      
      <div className={styles.statsGrid}>
        <Card>
          <CardHeader>
            <CardTitle>Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{totalInvoices}</div>
          </CardContent>
        </Card>
      </div>

      <div className={styles.chartsGrid}>
        <Card className={styles.chartCard}>
          <CardHeader>
            <CardTitle>Monthly Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.chart}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3b82f6" name="Total Amount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.recentInvoices}>
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className={styles.invoiceItem}>
                  <div>
                    <div className={styles.invoiceNumber}>#{invoice.invoiceNumber}</div>
                    <div className={styles.invoiceDate}>
                      {format(new Date(invoice.date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className={styles.invoiceAmount}>
                    ${invoice.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;