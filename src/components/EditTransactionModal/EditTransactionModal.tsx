import React, { useEffect, useState } from "react";
import { recalculateRunningBalances, updateTransaction } from "../../config/firebase";
import type { AnyTransaction, Balance, Expense } from "../../config/types";
import { useToast } from "../../contexts/ToastContext";
import { getCurrentISTDate } from "../../utils/dateUtils";
import CustomDateSelector from "../CustomDateSelector/CustomDateSelector";
import CustomDropdown from "../CustomDropdown/CustomDropdown";
import './EditTransactionModal.css';

interface EditTransactionModalProps {
    transaction: AnyTransaction | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
    userId: string;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
    transaction,
    isOpen,
    onClose,
    onUpdate,
    userId
}) => {
    const [isExpense, setIsExpense] = useState<boolean>(true);
    const [description, setDescription] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [date, setDate] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [category, setCategory] = useState<string>('Food');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const { showSuccess, showError } = useToast();

    const categoryOptions = [
        { value: 'Food', label: 'Food' },
        { value: 'Grocery', label: 'Grocery' },
        { value: 'Rent', label: 'Rent' },
        { value: 'Utilities', label: 'Utilities' },
        { value: 'Entertainment', label: 'Entertainment' },
        { value: 'Splitwise Settlements', label: 'Splitwise Settlements' },
        { value: 'EMI / Loan', label: 'EMI / Loan' },
        { value: 'Credit Card Bill', label: 'Credit Card Bill' },
        { value: 'Family', label: 'Family' },
        { value: 'Investment', label: 'Investment' },
        { value: 'Shopping', label: 'Shopping' },
        { value: 'Travel', label: 'Travel' },
        { value: 'Others', label: 'Others' }
    ];

    // Initialize form when transaction changes
    useEffect(() => {
        if (transaction) {
            const isExpenseTransaction = 'category' in transaction;

            setIsExpense(isExpenseTransaction);
            setDescription(transaction.description);
            setAmount(transaction.amount.toString());
            setDate(transaction.date);
            setNote(transaction.note);

            if (isExpenseTransaction) {
                setCategory((transaction as Expense).category);
            }
        }
    }, [transaction]);

    const handleSubmit = async () => {
        if (!transaction || !userId || isSubmitting) return;

        // Validation
        if (!description.trim()) {
            alert('Please enter a description');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (!date) {
            alert('Please select a date');
            return;
        }

        setIsSubmitting(true);

        try {
            const transactionType = 'category' in transaction ? 'expense' :
                'type' in transaction && (transaction as Balance).type === 'balance' ? 'balance' : 'income';

            const newAmount = parseFloat(amount);
            const oldAmount = transaction.amount;

            // Check if amount or date changed (these affect running balance)
            const amountChanged = newAmount !== oldAmount;
            const dateChanged = date !== transaction.date;

            const updateData: any = {
                description: description.trim(),
                amount: newAmount,
                note: note.trim(),
                date,
                updatedAt: getCurrentISTDate()
            };

            if (isExpense) {
                updateData.category = category;
            }

            // Update the transaction
            await updateTransaction(userId, transaction.id, transactionType, updateData);

            // Recalculate running balances if amount or date changed
            if (amountChanged || dateChanged) {
                await recalculateRunningBalances(
                    userId,
                    transaction.id,
                    transactionType,
                    date,
                    newAmount,
                    isExpense
                );
            }

            const transactionTypeName = isExpense ? 'Expense' : 'type' in transaction && (transaction as Balance).type === 'balance' ? 'Balance' : 'Income';
            showSuccess(`${transactionTypeName} "${description}" updated successfully!`);

            onUpdate();
            onClose();
        } catch (error) {
            console.error("Error updating document: ", error);
            showError('Failed to update transaction. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    if (!isOpen || !transaction) return null;

    const isExpenseTransaction = 'category' in transaction;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        Edit {isExpenseTransaction ? 'Expense' : 'type' in transaction && (transaction as Balance).type === 'balance' ? 'Balance' : 'Income'}
                    </h2>
                    <button
                        className="modal-close-button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label htmlFor="description">
                            {isExpenseTransaction ? 'Description' : 'type' in transaction && (transaction as Balance).type === 'balance' ? 'Description' : 'Source'}
                        </label>
                        <input
                            type="text"
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={isExpenseTransaction ? "e.g., Coffee" : 'type' in transaction && (transaction as Balance).type === 'balance' ? "e.g., Balance Adjustment" : "e.g., Salary"}
                            className="input"
                            required
                        />
                    </div>

                    {isExpenseTransaction && (
                        <div className="form-group">
                            <label htmlFor="category">Category</label>
                            <CustomDropdown
                                options={categoryOptions}
                                value={category}
                                onChange={setCategory}
                                placeholder="Select a category"
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="amount">Amount</label>
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            min="0.01"
                            step="0.01"
                            className="input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="date">Date</label>
                        <CustomDateSelector
                            value={date}
                            onChange={setDate}
                            placeholder="Select date and time"
                            max={getCurrentISTDate()}
                            includeTime={true}
                            className="transaction-date-selector"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="note">Note</label>
                        <input
                            type="text"
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="input"
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="modal-button modal-button-secondary"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !description.trim() || !amount || parseFloat(amount) <= 0 || !date}
                        className={`modal-button ${isExpenseTransaction ? 'modal-button-expense' : 'type' in transaction && (transaction as Balance).type === 'balance' ? 'modal-button-balance' : 'modal-button-income'}`}
                    >
                        {isSubmitting ? 'Updating...' : `Update ${isExpenseTransaction ? 'Expense' : 'type' in transaction && (transaction as Balance).type === 'balance' ? 'Balance' : 'Income'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditTransactionModal;
