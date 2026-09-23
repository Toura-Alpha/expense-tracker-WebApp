import { z } from 'zod';

export const transactionFormSchema = z.object({
  description: z.string().min(1, 'Description is required').max(120),
  amount: z.number().positive('Amount must be greater than zero'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export interface Transaction extends TransactionFormValues {
  id: string;
  created_at: string;
  updated_at: string;
  synced: boolean;
}
