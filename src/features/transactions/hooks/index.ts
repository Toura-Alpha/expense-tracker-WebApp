'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionFormSchema, type TransactionFormValues } from '../types';

export * from './useOfflineMutation';

export function useTransactionForm(defaultValues?: Partial<TransactionFormValues>) {
  return useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      type: 'expense',
      category: 'Food & Dining',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      ...defaultValues,
    },
  });
}
