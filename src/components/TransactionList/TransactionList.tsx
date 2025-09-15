
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import { appId, db } from "../../config/firebase";
import type { AnyTransaction, Balance, Expense } from "../../config/types";
import { useToast } from "../../contexts/ToastContext";
import { formatDateTimeToIST } from "../../utils/dateUtils";
import { getCategoryClass } from "../../utils/helper";
import EditTransactionModal from "../EditTransactionModal/EditTransactionModal";
import './TransactionList.css';

interface TransactionListProps {
    transactions: AnyTransaction[];
    userId: string;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, userId }) => {
    const [editingTransaction, setEditingTransaction] = useState<AnyTransaction | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { showSuccess, showError } = useToast();

    const handleDelete = async (id: string, transactionType: 'expense' | 'income' | 'balance', description: string) => {
        if (!window.confirm("Are you sure you want to delete this transaction?")) return;

        const collectionName = transactionType === 'expense' ? 'expenses' :
            transactionType === 'income' ? 'incomes' : 'balances';

        const docRef = doc(db, 'artifacts', appId, 'users', userId, collectionName, id);
        try {
            await deleteDoc(docRef);
            const transactionTypeName = transactionType === 'expense' ? 'Expense' :
                transactionType === 'income' ? 'Income' : 'Balance';
            showSuccess(`${transactionTypeName} "${description}" deleted successfully!`);
        } catch (error) {
            console.error("Error deleting document: ", error);
            showError('Failed to delete transaction. Please try again.');
        }
    };

    const handleEdit = (transaction: AnyTransaction) => {
        setEditingTransaction(transaction);
        setIsEditModalOpen(true);
    };

    const handleEditModalClose = () => {
        setIsEditModalOpen(false);
        setEditingTransaction(null);
    };

    const handleEditUpdate = () => {
        // The modal will close automatically after successful update
        // The transaction list will refresh due to Firebase real-time updates
    };

    const handleToggleTransfer = async (transaction: AnyTransaction) => {
        const transactionType = 'category' in transaction ? 'expense' :
            'type' in transaction && (transaction as Balance).type === 'balance' ? 'balance' : 'income';

        const collectionName = transactionType === 'expense' ? 'expenses' :
            transactionType === 'income' ? 'incomes' : 'balances';

        const docRef = doc(db, 'artifacts', appId, 'users', userId, collectionName, transaction.id);

        try {
            await updateDoc(docRef, {
                isTransfer: !transaction.isTransfer
            });

            const status = !transaction.isTransfer ? 'marked as transfer' : 'unmarked as transfer';
            showSuccess(`Transaction "${transaction.description}" ${status}!`);
        } catch (error) {
            console.error("Error updating transfer status: ", error);
            showError('Failed to update transfer status. Please try again.');
        }
    };

    return (
        <div className="transaction-list-container">
            <table className="transaction-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Category/Source</th>
                        <th>Date & Time</th>
                        <th className="text-right">Amount</th>
                        <th className="text-right">Running Balance</th>
                        <th className="text-center">Note</th>
                        <th className="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.length === 0 ? (
                        <tr><td colSpan={7} className="text-center" style={{ padding: '2rem' }}>No transactions logged for this month yet.</td></tr>
                    ) : (
                        transactions.map(t => {
                            const isExpense = 'category' in t;
                            const isBalance = 'type' in t && (t as Balance).type === 'balance';
                            return (
                                <tr key={t.id} className={t.isTransfer ? 'transfer-row' : ''}>
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
                                    <td>{formatDateTimeToIST(t.date)}</td>
                                    <td className={`text-right ${isExpense ? 'amount-expense' :
                                        isBalance ? 'amount-balance' :
                                            'amount-income'
                                        }`}>
                                        {isExpense ? '-' : isBalance ? '±' : '+'} ₹{t.amount.toFixed(2)}
                                    </td>
                                    <td className="text-right">
                                        ₹{t.runningBalance.toFixed(2)}
                                    </td>
                                    <td className="text-left">
                                        {t.note}
                                    </td>
                                    <td className="text-center">
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => handleEdit(t)}
                                                className="edit-button"
                                                aria-label="Edit transaction"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const transactionType = isExpense ? 'expense' : isBalance ? 'balance' : 'income';
                                                    handleDelete(t.id, transactionType, t.description);
                                                }}
                                                className="delete-button"
                                                aria-label="Delete transaction"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleToggleTransfer(t)}
                                                className={`exclude-button ${t.isTransfer ? 'excluded' : ''}`}
                                            >
                                                {t.isTransfer ? 'Included' : 'Exclude from expense'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>

            <EditTransactionModal
                transaction={editingTransaction}
                isOpen={isEditModalOpen}
                onClose={handleEditModalClose}
                onUpdate={handleEditUpdate}
                userId={userId}
            />
        </div>
    );
};

export default TransactionList;
