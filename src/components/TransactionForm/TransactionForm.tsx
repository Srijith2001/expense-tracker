import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import { appId, db } from "../../config/firebase";
import { useToast } from "../../contexts/ToastContext";
import { getCurrentISTDate } from "../../utils/dateUtils";
import CustomDateSelector from "../CustomDateSelector/CustomDateSelector";
import CustomDropdown from "../CustomDropdown/CustomDropdown";
import './TransactionForm.css';

interface TransactionFormProps {
    userId: string;
    currentBalance: number;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ userId, currentBalance }) => {
    const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
    const [isTransfer, setIsTransfer] = useState<boolean>(false);
    const [description, setDescription] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [date, setDate] = useState<string>(getCurrentISTDate());
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


    const handleSubmit = async () => {
        if (!userId || isSubmitting) return;
        setIsSubmitting(true);

        try {
            if (transactionType === 'expense') {
                const expensesCol = collection(db, 'artifacts', appId, 'users', userId, 'expenses');
                await addDoc(expensesCol,
                    {
                        description,
                        category,
                        amount: parseFloat(amount),
                        runningBalance: currentBalance - parseFloat(amount),
                        note,
                        date,
                        isTransfer,
                        createdAt: serverTimestamp()
                    });
                showSuccess(`Expense "${description}" added successfully!`);
            } else if (transactionType === 'income') {
                const incomesCol = collection(db, 'artifacts', appId, 'users', userId, 'incomes');
                await addDoc(incomesCol,
                    {
                        description,
                        amount: parseFloat(amount),
                        runningBalance: currentBalance + parseFloat(amount),
                        note,
                        date,
                        isTransfer,
                        createdAt: serverTimestamp()
                    });
                showSuccess(`Income "${description}" added successfully!`);
            }
            setDescription('');
            setAmount('');
            setDate(getCurrentISTDate());
            setCategory('Food');
            setNote('');
            setIsTransfer(false);
        } catch (error) {
            console.error("Error adding document: ", error);
            showError('Failed to add transaction. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card">
            <div className="transaction-form-tabs">
                <button onClick={() => setTransactionType('expense')} className={`tab-button ${transactionType === 'expense' ? 'active-expense' : ''}`}>Expense</button>
                <button onClick={() => setTransactionType('income')} className={`tab-button ${transactionType === 'income' ? 'active-income' : ''}`}>Income</button>
            </div>
            <h2 className="card-title">
                {transactionType === 'expense' ? 'Add New Expense' : 'Add New Income'}
            </h2>
            <div>
                <div className="form-group">
                    <label htmlFor="description">
                        {transactionType === 'expense' ? 'Description' : 'Source'}
                    </label>
                    <input
                        type="text"
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={
                            transactionType === 'expense' ? "e.g., Coffee" : "e.g., Salary"
                        }
                        className="input"
                        required
                    />
                </div>
                {transactionType === 'expense' && (
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
                    <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min="0.01" step="0.01" className="input" required />
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
                    <label htmlFor="date">Note</label>
                    <input type="text" id="note" value={note} onChange={(e) => setNote(e.target.value)} className="input" />
                </div>
                <div className="form-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={isTransfer}
                            onChange={(e) => setIsTransfer(e.target.checked)}
                            className="checkbox-input"
                        />
                        <span className="checkbox-text">Exclude from expense summaries</span>
                    </label>
                </div>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`button ${transactionType === 'expense' ? 'button-expense' : 'button-income'}`}
                >
                    {isSubmitting ? 'Adding...' : `Add ${transactionType === 'expense' ? 'Expense' : 'Income'}`}
                </button>
            </div>
        </div>
    );
};

export default TransactionForm;
