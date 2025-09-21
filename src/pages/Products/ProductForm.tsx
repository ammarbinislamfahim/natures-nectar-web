import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Product } from '@/types/models';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import styles from './ProductForm.module.css';

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  stockQty: z.number().min(0, 'Stock quantity must be 0 or greater'),
  status: z.enum(['active', 'inactive']),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product | null;
  onSave: (product: Product) => void;
  onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onClose }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product || {
      name: '',
      category: '',
      unit: '',
      price: 0,
      stockQty: 0,
      status: 'active',
    },
  });

  const onSubmit = (data: ProductFormData) => {
    onSave({
      ...data,
      id: product?.id || crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    });
    reset();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <Input {...register('name')} />
            {errors.name && (
              <span className={styles.error}>{errors.name.message}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Category</label>
            <Input {...register('category')} />
            {errors.category && (
              <span className={styles.error}>{errors.category.message}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Unit</label>
            <Input {...register('unit')} />
            {errors.unit && (
              <span className={styles.error}>{errors.unit.message}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Price</label>
            <Input
              type="number"
              step="0.01"
              {...register('price', { valueAsNumber: true })}
            />
            {errors.price && (
              <span className={styles.error}>{errors.price.message}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Stock Quantity</label>
            <Input
              type="number"
              {...register('stockQty', { valueAsNumber: true })}
            />
            {errors.stockQty && (
              <span className={styles.error}>{errors.stockQty.message}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Status</label>
            <Select
              onValueChange={(value) => setValue('status', value as 'active' | 'inactive')}
              defaultValue={product?.status || 'active'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;