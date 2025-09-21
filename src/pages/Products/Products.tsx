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
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Product } from '@/types/models';
import { db } from '@/db';
import ProductForm from './ProductForm';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';
import { useToast } from '@/components/ui/use-toast';
import styles from './Products.module.css';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const allProducts = await db.products.getAll();
    setProducts(allProducts.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleSave = async (product: Product) => {
    try {
      await db.products.set(product.id, product);
      await loadProducts();
      setIsFormOpen(false);
      setEditProduct(null);
      toast({
        title: 'Success',
        description: `Product ${product.name} has been saved.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save product.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (product: Product) => {
    try {
      await db.products.remove(product.id);
      await loadProducts();
      setDeleteProduct(null);
      toast({
        title: 'Success',
        description: `Product ${product.name} has been deleted.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete product.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Products</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>{product.unit}</TableCell>
              <TableCell>${product.price.toFixed(2)}</TableCell>
              <TableCell>{product.stockQty}</TableCell>
              <TableCell>
                <span className={`status ${product.status}`}>
                  {product.status}
                </span>
              </TableCell>
              <TableCell>
                <div className={styles.actions}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditProduct(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteProduct(product)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {(isFormOpen || editProduct) && (
        <ProductForm
          product={editProduct}
          onSave={handleSave}
          onClose={() => {
            setIsFormOpen(false);
            setEditProduct(null);
          }}
        />
      )}

      <DeleteConfirmDialog
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={() => deleteProduct && handleDelete(deleteProduct)}
        title="Delete Product"
        description={`Are you sure you want to delete ${deleteProduct?.name}? This action cannot be undone.`}
      />
    </div>
  );
};

export default Products;