// --- Type Definitions ---
export interface BaseTransaction {
    id: string;
    description: string;
    amount: number;
    runningBalance: number;
    date: string; // ISO string YYYY-MM-DD
}

export interface Expense extends BaseTransaction {
    category: string;
}

export interface Income extends BaseTransaction { }

export interface Balance extends BaseTransaction {
    type: 'balance';
}

export type AnyTransaction = Expense | Income | Balance;
