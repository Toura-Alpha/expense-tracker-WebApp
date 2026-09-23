export interface ParsedTransactionResult {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

export async function parseTransactionNaturalLanguage(input: string): Promise<ParsedTransactionResult> {
  const response = await fetch('/api/parse-nlp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    throw new Error('Failed to parse natural language transaction');
  }

  const json = await response.json();
  return json.data;
}
