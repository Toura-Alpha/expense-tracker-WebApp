export interface SpendingSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  categoryBreakdown: Record<string, number>;
}
