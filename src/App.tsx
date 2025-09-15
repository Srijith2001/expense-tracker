import './index.css';

// Chart.js Imports
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import './App.css';

// Components
import BalanceDisplay from './components/BalanceDisplay/BalanceDisplay';
import Charts from './components/Charts/Charts';
import Header from './components/Header/Header';
import Loading from './components/Loading/Loading';
import Login from './components/Login/Login';
import MonthlySummary from './components/MonthlySummary/MonthlySummary';
import ProfileModal from './components/ProfileModal/ProfileModal';
import TransactionForm from './components/TransactionForm/TransactionForm';
import TransactionHistory from './components/TransactionHistory/TransactionHistory';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useTransactions } from './hooks/useTransactions';

// Context
import { ToastProvider } from './contexts/ToastContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

function AppContent() {
  const {
    userId,
    isSigningIn,
    profile,
    showProfileModal,
    loading,
    handleGoogleSignIn,
    handleSignOut,
    handleDeleteAccount,
    handleProfileClose
  } = useAuth();

  const {
    allExpenses,
    allIncomes,
    filteredExpenses,
    filteredIncomes,
    transactions,
    currentBalance,
    monthFilter,
    setMonthFilter,
    customRange,
    setCustomRange,
    salaryCycleRange,
    detectLatestSalary,
    loading: transactionsLoading
  } = useTransactions(userId);

  const handleBalanceUpdate = (newBalance: number) => {
    console.log('Balance updated to:', newBalance);
  };

  if (loading || transactionsLoading) {
    return <Loading />;
  }

  if (!userId) {
    return <Login isSigningIn={isSigningIn} onGoogleSignIn={handleGoogleSignIn} />;
  }

  return (
    <main className="container">
      <Header
        profile={profile}
        onDeleteAccount={handleDeleteAccount}
        onSignOut={handleSignOut}
      />

      <div className="dashboard-grid">
        <div className="grid-col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <BalanceDisplay
            userId={userId}
            currentBalance={currentBalance}
            onBalanceUpdate={handleBalanceUpdate}
          />
          <MonthlySummary
            expenses={filteredExpenses}
            incomes={filteredIncomes}
            monthFilter={monthFilter}
            onMonthFilterChange={setMonthFilter}
          />
          <TransactionForm userId={userId} currentBalance={currentBalance} />
        </div>

        <div className="grid-col-span-1">
          <TransactionHistory
            transactions={transactions}
            userId={userId}
            monthFilter={monthFilter}
            onMonthFilterChange={setMonthFilter}
            onCustomRangeChange={setCustomRange}
            customRange={customRange}
            salaryCycleRange={salaryCycleRange}
            onDetectSalary={detectLatestSalary}
          />
        </div>
      </div>

      <Charts
        expenses={filteredExpenses}
        allIncomes={allIncomes}
        allExpenses={allExpenses}
        monthFilter={monthFilter}
        onMonthFilterChange={setMonthFilter}
        onCustomRangeChange={setCustomRange}
        customRange={customRange}
        salaryCycleRange={salaryCycleRange}
        onDetectSalary={detectLatestSalary}
      />

      {showProfileModal && userId && (
        <ProfileModal
          userId={userId}
          onClose={handleProfileClose}
        />
      )}
    </main>
  );
}

export default App;
