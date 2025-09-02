import React, { useMemo } from 'react';
import type { Expense, Income } from '../../config/types';
import './Summary.css';

interface SummaryProps {
    expenses: Expense[];
    incomes: Income[];
}
const Summary: React.FC<SummaryProps> = ({ expenses, incomes }) => {
    const totalExp = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
    const totalInc = useMemo(() => incomes.reduce((sum, i) => sum + i.amount, 0), [incomes]);
    const net = totalInc - totalExp;

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

    return (
        <div>
            <div className="summary-item summary-item-income">
                <span>Total Income:</span>
                <span>{formatCurrency(totalInc)}</span>
            </div>
            <div className="summary-item summary-item-expense">
                <span>Total Expenses:</span>
                <span>{formatCurrency(totalExp)}</span>
            </div>
            <div className="summary-item summary-item-net">
                <span>Net Flow:</span>
                <span className={net >= 0 ? 'net-positive' : 'net-negative'}>{formatCurrency(net)}</span>
            </div>
        </div>
    );
};

export default Summary;
