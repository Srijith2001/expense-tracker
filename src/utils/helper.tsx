// --- Helper Functions ---
import type { AnyTransaction, Expense } from '../config/types';
import { formatDateToIST } from './dateUtils';

const getCategoryColor = (category: string): string => ({
    'Food': '#34D399', 'Grocery': '#60A5FA', 'Rent': '#F97316', 'Utilities': '#FBBF24',
    'Entertainment': '#A78BFA', 'Splitwise Settlements': '#EC4899', 'EMI / Loan': '#14B8A6',
    'Credit Card Bill': '#EF4444', 'Family': '#8B5CF6', 'Others': '#94A3B8'
}[category] || '#94A3B8');

const getCategoryClass = (category: string): string => {
    const sanitized = category.replace(/ \/ /g, ' ').replace(/\s+/g, '');
    return `category-${sanitized}`;
};

// CSV Export Function
const exportToCSV = (transactions: AnyTransaction[], filename: string = 'transaction-history.csv') => {
    if (transactions.length === 0) {
        alert('No transactions to export');
        return;
    }

    try {
        // CSV Headers
        const headers = ['Date', 'Type', 'Description', 'Category/Source', 'Amount', 'Running Balance'];

        // Convert transactions to CSV rows
        const csvRows = transactions.map(transaction => {
            const isExpense = 'category' in transaction;
            const type = isExpense ? 'Expense' : 'Income';
            const category = isExpense ? (transaction as Expense).category : 'Income';
            const amount = isExpense ? `-${transaction.amount.toFixed(2)}` : `+${transaction.amount.toFixed(2)}`;
            const runningBalance = transaction.runningBalance.toFixed(2);

            return [
                formatDateToIST(transaction.date),
                type,
                `"${transaction.description.replace(/"/g, '""')}"`, // Escape quotes in description
                category,
                amount,
                runningBalance
            ].join(',');
        });

        // Combine headers and rows
        const csvContent = [headers.join(','), ...csvRows].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        // Show success message
        console.log(`Successfully exported ${transactions.length} transactions to ${filename}`);
    } catch (error) {
        console.error('Error exporting transactions:', error);
        alert('Failed to export transactions. Please try again.');
    }
};

// Category-wise Spending Export Function
const exportCategorySpendingToCSV = (expenses: Expense[], filename: string = 'category-spending.csv') => {
    if (expenses.length === 0) {
        alert('No expense data to export');
        return;
    }

    try {
        // Calculate category totals
        const categoryTotals = expenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {} as Record<string, number>);

        const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

        // CSV Headers
        const headers = ['Category', 'Amount', 'Percentage', 'Transaction Count'];

        // Convert category data to CSV rows
        const csvRows = Object.entries(categoryTotals)
            .map(([category, amount]) => {
                const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                const count = expenses.filter(e => e.category === category).length;

                return [
                    `"${category}"`,
                    amount.toFixed(2),
                    percentage.toFixed(2),
                    count.toString()
                ].join(',');
            })
            .sort((a, b) => {
                // Sort by amount (descending)
                const amountA = parseFloat(a.split(',')[1]);
                const amountB = parseFloat(b.split(',')[1]);
                return amountB - amountA;
            });

        // Combine headers and rows
        const csvContent = [headers.join(','), ...csvRows].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        // Show success message
        console.log(`Successfully exported category spending data to ${filename}`);
    } catch (error) {
        console.error('Error exporting category spending data:', error);
        alert('Failed to export category spending data. Please try again.');
    }
};

const formatToINRText = (num: number) => {
    if (!num) return "";
    const units = ["", "Thousand", "Lakh", "Crore"];
    let n = Math.floor(num);
    let str = "";
    let unitIndex = 0;

    while (n > 0 && unitIndex < units.length) {
        let divider = unitIndex === 0 ? 1000 : 100;
        const rem = n % divider;
        if (rem) str = rem + " " + units[unitIndex] + " " + str;
        n = Math.floor(n / divider);
        unitIndex++;
    }

    return str.trim() + " Rupees";
};

export { exportCategorySpendingToCSV, exportToCSV, formatToINRText, getCategoryClass, getCategoryColor };
