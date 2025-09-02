
import { deleteDoc, doc } from "firebase/firestore";
import React from "react";
import { appId, db } from "../../config/firebase";
import type { AnyTransaction, Balance, Expense } from "../../config/types";
import { getCategoryClass } from "../../utils/helper";
import './TransactionList.css';

interface TransactionListProps {
    transactions: AnyTransaction[];
    userId: string;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, userId }) => {
    const handleDelete = async (id: string, transactionType: 'expense' | 'income' | 'balance') => {
        if (!window.confirm("Are you sure you want to delete this transaction?")) return;

        const collectionName = transactionType === 'expense' ? 'expenses' :
            transactionType === 'income' ? 'incomes' : 'balances';

        const docRef = doc(db, 'artifacts', appId, 'users', userId, collectionName, id);
        try {
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };

    return (
        <div className="transaction-list-container">
            <table className="transaction-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Category/Source</th>
                        <th>Date</th>
                        <th className="text-right">Amount</th>
                        <th className="text-right">Running Balance</th>
                        <th className="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.length === 0 ? (
                        <tr><td colSpan={5} className="text-center" style={{ padding: '2rem' }}>No transactions logged for this month yet.</td></tr>
                    ) : (
                        transactions.map(t => {
                            const isExpense = 'category' in t;
                            const isBalance = 'type' in t && (t as Balance).type === 'balance';
                            console.log(t)
                            return (
                                <tr key={t.id}>
                                    <td>{t.description}</td>
                                    <td>
                                        <span className={`category-tag ${isExpense ? getCategoryClass((t as Expense).category) :
                                            isBalance ? 'category-balance' :
                                                'category-income'
                                            }`}>
                                            {isExpense ? (t as Expense).category :
                                                isBalance ? 'Balance' :
                                                    'Income'}
                                        </span>
                                    </td>
                                    <td>{new Date(t.date).toLocaleDateString('en-IN', { timeZone: 'UTC' })}</td>
                                    <td className={`text-right ${isExpense ? 'amount-expense' :
                                        isBalance ? 'amount-balance' :
                                            'amount-income'
                                        }`}>
                                        {isExpense ? '-' : isBalance ? '±' : '+'} ₹{t.amount.toFixed(2)}
                                    </td>
                                    <td className="text-right">
                                        ₹{t.runningBalance.toFixed(2)}
                                    </td>
                                    <td className="text-center">
                                        <button
                                            onClick={() => {
                                                const transactionType = isExpense ? 'expense' : isBalance ? 'balance' : 'income';
                                                handleDelete(t.id, transactionType);
                                            }}
                                            className="delete-button"
                                            aria-label="Delete transaction"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TransactionList;
