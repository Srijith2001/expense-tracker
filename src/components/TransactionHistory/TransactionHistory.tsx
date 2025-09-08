import React from 'react';
import type { AnyTransaction } from '../../config/types';
import { exportToCSV } from '../../utils/helper';
import CustomMonthSelector from '../CustomMonthSelector/CustomMonthSelector';
import TransactionList from '../TransactionList/TransactionList';
import './TransactionHistory.css';

interface TransactionHistoryProps {
    transactions: AnyTransaction[];
    userId: string;
    monthFilter: string;
    onMonthFilterChange: (month: string) => void;
    onCustomRangeChange?: (range: { start: string; end: string }) => void;
    customRange?: { start: string; end: string };
    salaryCycleRange?: { start: string; end: string };
    onDetectSalary?: () => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
    transactions,
    userId,
    monthFilter,
    onMonthFilterChange,
    onCustomRangeChange,
    customRange,
    salaryCycleRange,
    onDetectSalary
}) => {
    const handleDownloadTransactions = () => {
        let filename = 'transaction-history';

        if (monthFilter === 'custom-range' && customRange) {
            filename += `-${customRange.start}-to-${customRange.end}`;
        } else if (monthFilter === 'salary-cycle' && salaryCycleRange) {
            filename += `-salary-cycle-${salaryCycleRange.start}-to-${salaryCycleRange.end}`;
        } else {
            filename += `-${monthFilter}`;
        }

        filename += '.csv';
        exportToCSV(transactions, filename);
    };

    return (
        <div className="grid-col-span-2 card">
            <div className="transaction-history-header">
                <h2 className="card-title">Transaction History</h2>
                <div className="transaction-history-controls">
                    <CustomMonthSelector
                        value={monthFilter}
                        onChange={onMonthFilterChange}
                        onCustomRangeChange={onCustomRangeChange}
                        customRange={customRange}
                        salaryCycleRange={salaryCycleRange}
                        onDetectSalary={onDetectSalary}
                        className="month-selector"
                    />
                    <button
                        onClick={handleDownloadTransactions}
                        className="download-button"
                        disabled={transactions.length === 0}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" width="16" height="16">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Download CSV
                    </button>
                </div>
            </div>
            {userId && <TransactionList transactions={transactions} userId={userId} />}
        </div>
    );
};

export default TransactionHistory;
