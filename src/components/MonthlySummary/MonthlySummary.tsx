import React from 'react';
import CustomMonthSelector from '../CustomMonthSelector/CustomMonthSelector';
import Summary from '../Summary/Summary';
import './MonthlySummary.css';

interface MonthlySummaryProps {
    expenses: any[];
    incomes: any[];
    monthFilter: string;
    onMonthFilterChange: (month: string) => void;
}

const MonthlySummary: React.FC<MonthlySummaryProps> = ({
    expenses,
    incomes,
    monthFilter,
    onMonthFilterChange
}) => {
    return (
        <div className="card">
            <div className="monthly-summary-header">
                <h2 className="card-title">Monthly Summary</h2>
                <CustomMonthSelector
                    value={monthFilter}
                    onChange={onMonthFilterChange}
                    className="month-selector"
                />
            </div>
            <Summary expenses={expenses} incomes={incomes} />
        </div>
    );
};

export default MonthlySummary;
