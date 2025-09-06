import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import { appId, db } from '../../config/firebase';
import CustomDateSelector from '../CustomDateSelector/CustomDateSelector';
import './BalanceDisplay.css';

interface BalanceDisplayProps {
    userId: string;
    currentBalance: number;
    onBalanceUpdate: (newBalance: number) => void;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ userId, currentBalance, onBalanceUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(currentBalance.toString());
    const [editDate, setEditDate] = useState(new Date().toISOString().slice(0, 16));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

    const handleEdit = () => {
        setIsEditing(true);
        setEditValue(currentBalance.toString());
        setEditDate(new Date().toISOString().slice(0, 16));
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditValue(currentBalance.toString());
        setEditDate(new Date().toISOString().slice(0, 16));
    };

    const handleSave = async () => {
        const newBalance = parseFloat(editValue);

        if (isNaN(newBalance)) {
            alert('Please enter a valid number');
            return;
        }

        if (newBalance === currentBalance) {
            setIsEditing(false);
            return;
        }

        setIsSubmitting(true);

        try {
            const balanceDifference = newBalance - currentBalance;
            const description = balanceDifference > 0
                ? `Balance adjustment (+₹${balanceDifference.toFixed(2)})`
                : `Balance adjustment (₹${balanceDifference.toFixed(2)})`;

            // Create a balance transaction
            const balancesCol = collection(db, 'artifacts', appId, 'users', userId, 'balances');
            await addDoc(balancesCol, {
                description,
                amount: Math.abs(balanceDifference),
                date: editDate,
                runningBalance: newBalance,
                type: 'balance',
                createdAt: serverTimestamp()
            });

            onBalanceUpdate(newBalance);
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating balance:", error);
            alert('Failed to update balance. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    return (
        <div className="balance-display">
            <div className="balance-header">
                <h3 className="balance-title">Current Balance</h3>
                {!isEditing && (
                    <button
                        onClick={handleEdit}
                        className="edit-balance-button"
                        title="Edit balance"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                        </svg>
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="balance-edit">
                    <div className="balance-input-group">
                        <span className="currency-symbol">₹</span>
                        <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className="balance-input"
                            placeholder="Enter balance"
                            autoFocus
                            step="0.01"
                        />
                    </div>
                    <div className="balance-date-group">
                        <label className="balance-date-label">Date:</label>
                        <CustomDateSelector
                            value={editDate}
                            onChange={setEditDate}
                            placeholder="Select date and time"
                            max={new Date().toISOString().slice(0, 16)}
                            includeTime={true}
                            className="balance-date-selector"
                        />
                    </div>
                    <div className="balance-actions">
                        <button
                            onClick={handleSave}
                            className="save-button"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="cancel-button"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="balance-amount">
                    {formatCurrency(currentBalance)}
                </div>
            )}
        </div>
    );
};

export default BalanceDisplay;
