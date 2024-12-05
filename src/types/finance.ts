export type TransactionType = 'credit' | 'debit'
export type TransactionCategory = 'Income' | 'Expense' | 'Asset' | 'Liability'

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  accountId: string;
  comment?: string;
  tags: Tag[];
}

export interface Account {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  balance: number;
  transactions: Transaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
} 