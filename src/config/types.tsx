// --- Type Definitions ---
export interface BaseTransaction {
    id: string;
    description: string;
    amount: number;
    runningBalance: number;
    note: string;
    date: string; // ISO string YYYY-MM-DD
    isTransfer?: boolean; // Optional field to mark transactions as transfers
}

export interface Expense extends BaseTransaction {
    category: string;
}

export interface Income extends BaseTransaction { }

export interface Balance extends BaseTransaction {
    type: 'balance';
}

export type AnyTransaction = Expense | Income | Balance;
