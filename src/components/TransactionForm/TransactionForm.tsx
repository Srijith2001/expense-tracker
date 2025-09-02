import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import { appId, db } from "../../config/firebase";
import CustomDropdown from "../CustomDropdown/CustomDropdown";
import './TransactionForm.css';

interface TransactionFormProps {
    userId: string;
    currentBalance: number;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ userId, currentBalance }) => {
    const [isExpense, setIsExpense] = useState<boolean>(true);
    const [description, setDescription] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [category, setCategory] = useState<string>('Food');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
        { value: 'Others', label: 'Others' }
    ];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!userId || isSubmitting) return;
        setIsSubmitting(true);

        try {
            if (isExpense) {
                const expensesCol = collection(db, 'artifacts', appId, 'users', userId, 'expenses');
                await addDoc(expensesCol, { description, category, amount: parseFloat(amount), runningBalance: currentBalance - parseInt(amount), date, createdAt: serverTimestamp() });
            } else {
                const incomesCol = collection(db, 'artifacts', appId, 'users', userId, 'incomes');
                await addDoc(incomesCol, { description, amount: parseFloat(amount), runningBalance: currentBalance + parseInt(amount), date, createdAt: serverTimestamp() });
            }
            setDescription('');
            setAmount('');
            setDate(new Date().toISOString().slice(0, 10));
            setCategory('Food');
        } catch (error) {
            console.error("Error adding document: ", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card">
            <div className="transaction-form-tabs">
                <button onClick={() => setIsExpense(true)} className={`tab-button ${isExpense ? 'active-expense' : ''}`}>Expense</button>
                <button onClick={() => setIsExpense(false)} className={`tab-button ${!isExpense ? 'active-income' : ''}`}>Income</button>
            </div>
            <h2 className="card-title">{isExpense ? 'Add New Expense' : 'Add New Income'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="description">{isExpense ? 'Description' : 'Source'}</label>
                    <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={isExpense ? "e.g., Coffee" : "e.g., Salary"} className="input" required />
                </div>
                {isExpense && (
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
                    <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" required />
                </div>
                <button type="submit" disabled={isSubmitting} className={`button ${isExpense ? 'button-expense' : 'button-income'}`}>
                    {isSubmitting ? 'Adding...' : `Add ${isExpense ? 'Expense' : 'Income'}`}
                </button>
            </form>
        </div>
    );
};

export default TransactionForm;
