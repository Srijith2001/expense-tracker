import { useEffect, useMemo, useState } from 'react';
import { subscribeToBalances, subscribeToExpenses, subscribeToIncomes } from '../config/firebase';
import type { AnyTransaction, Balance, Expense, Income } from '../config/types';
import { getCurrentISTDateOnly, getCurrentISTMonth } from '../utils/dateUtils';

export const useTransactions = (userId: string | null) => {
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [allIncomes, setAllIncomes] = useState<Income[]>([]);
    const [allBalances, setAllBalances] = useState<Balance[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [monthFilter, setMonthFilter] = useState<string>(getCurrentISTMonth());
    const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
        start: getCurrentISTMonth() + '-01',
        end: getCurrentISTMonth() + '-31'
    });
    const [salaryCycleRange, setSalaryCycleRange] = useState<{ start: string; end: string }>({
        start: '',
        end: getCurrentISTDateOnly()
    });

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribeExpenses = subscribeToExpenses(
            userId,
            (expenses: Expense[]) => {
                setAllExpenses(expenses);
                setLoading(false);
            }
        );

        const unsubscribeIncomes = subscribeToIncomes(
            userId,
            (incomes: Income[]) => {
                setAllIncomes(incomes);
            }
        );

        const unsubscribeBalances = subscribeToBalances(
            userId,
            (balances: Balance[]) => {
                setAllBalances(balances);
            }
        );

        return () => {
            unsubscribeExpenses();
            unsubscribeIncomes();
            unsubscribeBalances();
        };
    }, [userId]);

    // Function to detect latest salary transaction
    const detectLatestSalary = () => {
        const allTransactions = [...allExpenses, ...allIncomes, ...allBalances];
        const salaryTransactions = allTransactions.filter(transaction =>
            transaction.description.toLowerCase().includes('salary')
        );

        if (salaryTransactions.length > 0) {
            // Sort by date (most recent first)
            const sortedSalary = salaryTransactions.sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            const latestSalary = sortedSalary[0];
            const salaryDate = latestSalary.date.split('T')[0]; // Extract date part
            const today = getCurrentISTDateOnly();

            setSalaryCycleRange({
                start: salaryDate,
                end: today
            });

            return { start: salaryDate, end: today };
        }

        return null;
    };

    const { filteredExpenses, filteredIncomes, transactions, currentBalance } = useMemo(() => {
        const filterTransactions = (dateStr: string) => {
            const datePart = dateStr.split('T')[0]; // Extract date part from datetime

            if (monthFilter === 'custom-range') {
                return datePart >= customRange.start && datePart <= customRange.end;
            } else if (monthFilter === 'salary-cycle') {
                return datePart >= salaryCycleRange.start && datePart <= salaryCycleRange.end;
            } else {
                return datePart.startsWith(monthFilter);
            }
        };

        const filteredExpenses = allExpenses.filter(e => filterTransactions(e.date));
        const filteredIncomes = allIncomes.filter(i => filterTransactions(i.date));
        const filteredBalances = allBalances.filter(b => filterTransactions(b.date));

        // Filter out transactions marked as transfers for summaries and charts
        const filteredExpensesForSummary = filteredExpenses.filter(e => !e.isTransfer);
        const filteredIncomesForSummary = filteredIncomes.filter(i => !i.isTransfer);

        const transactions: AnyTransaction[] = [...filteredExpenses, ...filteredIncomes, ...filteredBalances]
            .sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateB - dateA;
            });

        // Calculate current balance: sum of all incomes + balance adjustments - sum of all expenses (including transfers)
        const totalIncome = allIncomes.reduce((sum, income) => sum + income.amount, 0);
        const totalExpenses = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const balanceAdjustments = allBalances.reduce((sum, balance) => {
            const isPositive = balance.description.includes('+');
            return sum + (isPositive ? balance.amount : -balance.amount);
        }, 0);

        const currentBalance = totalIncome + balanceAdjustments - totalExpenses;

        return {
            filteredExpenses: filteredExpensesForSummary,
            filteredIncomes: filteredIncomesForSummary,
            transactions,
            currentBalance
        };
    }, [allExpenses, allIncomes, allBalances, monthFilter, customRange, salaryCycleRange]);

    return {
        allExpenses,
        allIncomes,
        allBalances,
        filteredExpenses,
        filteredIncomes,
        transactions,
        currentBalance,
        monthFilter,
        setMonthFilter,
        customRange,
        setCustomRange,
        salaryCycleRange,
        setSalaryCycleRange,
        detectLatestSalary,
        loading
    };
};
