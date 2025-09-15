import { useEffect, useMemo, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import type { Expense, Income } from "../../config/types";
import { getCurrentISTDateOnly, getCurrentISTMonth } from "../../utils/dateUtils";
import { exportCategorySpendingToCSV, getCategoryColor } from "../../utils/helper";
import CustomDropdown from "../CustomDropdown/CustomDropdown";
import CustomMonthSelector from "../CustomMonthSelector/CustomMonthSelector";
import './Charts.css';

interface ChartsProps {
    expenses: Expense[];
    allIncomes: Income[];
    allExpenses: Expense[];
    monthFilter: string;
    onMonthFilterChange: (month: string) => void;
    onCustomRangeChange?: (range: { start: string; end: string }) => void;
    customRange?: { start: string; end: string };
    salaryCycleRange?: { start: string; end: string };
    onDetectSalary?: () => void;
}

const Charts: React.FC<ChartsProps> = ({
    expenses,
    allIncomes,
    allExpenses,
    monthFilter,
    onMonthFilterChange,
    onCustomRangeChange,
    customRange,
    salaryCycleRange,
    onDetectSalary
}) => {
    const [timeframe, setTimeframe] = useState<string>("5"); // Default to 5 months
    const [trendMode, setTrendMode] = useState<'monthly' | 'salary-cycle'>('monthly');
    const [chartKey, setChartKey] = useState(0);

    // Handle window resize to force chart redraw
    useEffect(() => {
        const handleResize = () => {
            setChartKey(prev => prev + 1);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const timeframeOptions = [
        { value: "3", label: "Last 3 months" },
        { value: "6", label: "Last 6 months" },
        { value: "12", label: "Last 12 months" },
        { value: "salary-cycle", label: "Salary Cycle" }
    ];

    const handleDownloadCategorySpending = () => {
        const filename = `category-spending-${getCurrentISTMonth()}.csv`;
        exportCategorySpendingToCSV(expenses, filename);
    };

    const handleTimeframeChange = (value: string) => {
        setTimeframe(value);
        if (value === 'salary-cycle') {
            setTrendMode('salary-cycle');
            // Automatically detect salary cycle when selected
            if (onDetectSalary) {
                onDetectSalary();
            }
        } else {
            setTrendMode('monthly');
        }
    };
    const categoryChartData = useMemo(() => {
        const totals = expenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
        }, {} as Record<string, number>);
        const labels = Object.keys(totals);
        return {
            labels,
            datasets: [{
                data: Object.values(totals),
                backgroundColor: labels.map(l => getCategoryColor(l)),
                borderColor: '#ffffff',
                borderWidth: 2,
            }]
        };
    }, [expenses]);

    const incomeExpenseTrendData = useMemo(() => {
        const labels: string[] = [];
        const incomeData: number[] = [];
        const expenseData: number[] = [];

        if (trendMode === 'salary-cycle') {
            // Salary cycle mode - group data by actual salary cycles
            const allTransactions = [...allIncomes, ...allExpenses];
            const salaryTransactions = allTransactions.filter(transaction =>
                transaction.description.toLowerCase().includes('salary')
            );

            if (salaryTransactions.length > 0) {
                // Sort salary transactions by date (oldest first)
                const sortedSalary = salaryTransactions.sort((a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                );

                // Create salary cycles
                const salaryCycles = [];
                for (let i = 0; i < sortedSalary.length; i++) {
                    const currentSalary = sortedSalary[i];
                    const nextSalary = sortedSalary[i + 1];

                    const cycleStart = currentSalary.date.split('T')[0];
                    const cycleEnd = nextSalary ? nextSalary.date.split('T')[0] : getCurrentISTDateOnly();

                    // Format the label
                    const startDate = new Date(cycleStart);
                    const endDate = new Date(cycleEnd);
                    const startMonth = startDate.toLocaleString('default', { month: 'short' });
                    const endMonth = endDate.toLocaleString('default', { month: 'short' });
                    const startDay = startDate.getDate();
                    const endDay = endDate.getDate();

                    let label;
                    if (startDate.getFullYear() === endDate.getFullYear()) {
                        if (startDate.getMonth() === endDate.getMonth()) {
                            label = `${startMonth} ${startDay}-${endDay}`;
                        } else {
                            label = `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
                        }
                    } else {
                        label = `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
                    }

                    salaryCycles.push({
                        start: cycleStart,
                        end: cycleEnd,
                        label: label
                    });
                }

                salaryCycles.forEach(cycle => {
                    labels.push(cycle.label);

                    const cycleIncome = allIncomes.filter(inc => {
                        const incDate = inc.date.split('T')[0];
                        return incDate >= cycle.start && incDate <= cycle.end;
                    }).reduce((sum, inc) => sum + inc.amount, 0);

                    const cycleExpense = allExpenses.filter(exp => {
                        const expDate = exp.date.split('T')[0];
                        return expDate >= cycle.start && expDate <= cycle.end;
                    }).reduce((sum, exp) => sum + exp.amount, 0);

                    incomeData.push(cycleIncome);
                    expenseData.push(cycleExpense);
                });
            } else {
                // No salary transactions found
                labels.push('No Salary Data');
                incomeData.push(0);
                expenseData.push(0);
            }
        } else {
            // Monthly mode - existing logic
            const today = new Date();
            const monthsToShow = timeframe === 'salary-cycle' ? 5 : Number(timeframe);

            for (let i = monthsToShow - 1; i >= 0; i--) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                const monthKey = `${year}-${String(month).padStart(2, '0')}`;
                const monthName = date.toLocaleString('default', { month: 'short' });
                const yearLabel = date.getFullYear();
                labels.push(`${monthName} ${yearLabel}`);

                const monthlyIncome = allIncomes.filter(inc => inc.date.startsWith(monthKey)).reduce((sum, inc) => sum + inc.amount, 0);
                const monthlyExpense = allExpenses.filter(exp => exp.date.startsWith(monthKey)).reduce((sum, exp) => sum + exp.amount, 0);

                incomeData.push(monthlyIncome);
                expenseData.push(monthlyExpense);
            }
        }

        return {
            labels, datasets: [
                { label: 'Income', data: incomeData, backgroundColor: 'rgb(34, 197, 94)' },
                { label: 'Expense', data: expenseData, backgroundColor: 'rgb(239, 68, 68)' }
            ]
        };
    }, [allIncomes, allExpenses, timeframe, trendMode]);

    return (
        <div className="charts-grid">
            <div className="card">
                <div className="chart-header">
                    <h3 className="chart-title">Category-wise Spend</h3>
                    <div className="chart-header-controls">
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
                            onClick={handleDownloadCategorySpending}
                            className="download-button"
                            disabled={expenses.length === 0}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" width="16" height="16">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="chart-container">
                    {categoryChartData.labels.length > 0 ? <Pie key={`pie-${chartKey}`} data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false }} /> : <p style={{ textAlign: 'center', paddingTop: '6rem' }}>No expense data for this month.</p>}
                </div>
            </div>
            <div className="card">
                <div className="chart-header">
                    <h3 className="chart-title">Income vs Expense Trend</h3>
                    <div className="chart-header-controls" style={{ width: '200px' }}>
                        <CustomDropdown
                            options={timeframeOptions}
                            value={timeframe}
                            onChange={handleTimeframeChange}
                            placeholder="Select timeframe"
                        />
                    </div>
                </div>
                <div className="chart-container">
                    <Bar key={`bar-${chartKey}`} data={incomeExpenseTrendData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: 'Amount' } } } }} />
                </div>
            </div>
        </div>
    );
};

export default Charts;
