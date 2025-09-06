import { useEffect, useMemo, useState } from 'react';
import './index.css';

// Firebase Imports
import { deleteUserAccount, getUserProfile, setupAuth, signInWithGoogle, signOutUser, subscribeToBalances, subscribeToExpenses, subscribeToIncomes } from './config/firebase';

// Chart.js Imports
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import './App.css';
import BalanceDisplay from './components/BalanceDisplay/BalanceDisplay';
import Charts from './components/Charts/Charts';
import ProfileModal from './components/ProfileModal/ProfileModal';
import Summary from './components/Summary/Summary';
import TransactionForm from './components/TransactionForm/TransactionForm';
import TransactionList from './components/TransactionList/TransactionList';
import type { AnyTransaction, Balance, Expense, Income } from './config/types';
import { exportToCSV } from './utils/helper';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [allIncomes, setAllIncomes] = useState<Income[]>([]);
  const [allBalances, setAllBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [monthFilter, setMonthFilter] = useState<string>(new Date().toISOString().slice(0, 7));
  const [profile, setProfile] = useState<{ name: string; initialBalance: number } | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      try {
        const userProfile = await getUserProfile(userId);
        if (!userProfile) {
          // No profile yet → show modal
          setShowProfileModal(true);
        } else {
          setProfile(userProfile);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setShowProfileModal(true);
      }
    };

    fetchProfile();
  }, [userId]);


  useEffect(() => {
    const unsubscribe = setupAuth(setUserId);
    return () => unsubscribe();
  }, []);

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

  const { filteredExpenses, filteredIncomes, transactions, currentBalance } = useMemo(() => {
    const filteredExpenses = allExpenses.filter(e => e.date.startsWith(monthFilter));
    const filteredIncomes = allIncomes.filter(i => i.date.startsWith(monthFilter));
    const filteredBalances = allBalances.filter(b => b.date.startsWith(monthFilter));

    const transactions: AnyTransaction[] = [...filteredExpenses, ...filteredIncomes, ...filteredBalances]
      .sort((a, b) => {
        // Sort by date and time (most recent first)
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });

    // Calculate current balance: sum of all incomes + balance adjustments - sum of all expenses
    const totalIncome = allIncomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const balanceAdjustments = allBalances.reduce((sum, balance) => {
      // Balance adjustments can be positive or negative based on description
      const isPositive = balance.description.includes('+');
      return sum + (isPositive ? balance.amount : -balance.amount);
    }, 0);

    const currentBalance = totalIncome + balanceAdjustments - totalExpenses;

    return { filteredExpenses, filteredIncomes, transactions, currentBalance };
  }, [allExpenses, allIncomes, allBalances, monthFilter]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
      try {
        if (userId) {
          await deleteUserAccount(userId);
          alert("Account deleted successfully");
        }
        // Optionally redirect to login page
      } catch (err) {
        console.error(err);
        alert("Failed to delete account: " + (err as Error).message);
      }
    }
  };

  const handleDownloadTransactions = () => {
    const filename = `transaction-history-${monthFilter}.csv`;
    exportToCSV(transactions, filename);
  };

  const handleBalanceUpdate = (newBalance: number) => {
    // The balance will be updated through the Firebase subscription
    // This function is called after a successful balance update
    console.log('Balance updated to:', newBalance);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><p>Loading Dashboard...</p></div>;
  }


  if (!userId) {
    return (
      <main className="container">
        <header className="header">
          <h1>Your Financial Dashboard</h1>
          <p>Sign in to access your expense tracker</p>
        </header>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h2 className="card-title">Welcome</h2>
            <p>Sign in with Google to access your financial dashboard</p>
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="button button-signin"
              style={{ marginTop: '1rem' }}
            >
              {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <header className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 22 }}>{profile?.name ? `${profile.name}'s Financial Dashboard` : "Your Financial Dashboard"}</h1>
            <p>Your data is synced securely across all your devices.</p>
          </div>
          <div>
            {/* Delete Account Button */}
            <button
              onClick={handleDeleteAccount}
              className="button"
              style={{
                backgroundColor: '#d16626',
                color: 'white',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                width: 'auto',
                marginRight: 10
              }}
            >
              Delete Account
            </button>
            <button
              onClick={handleSignOut}
              className="button"
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                width: 'auto'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="grid-col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {userId && <BalanceDisplay userId={userId} currentBalance={currentBalance} onBalanceUpdate={handleBalanceUpdate} />}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="card-title" style={{ marginBottom: 0, marginRight: '1rem' }}>Monthly Summary</h2>
              <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="input" style={{ width: 'auto' }} />
            </div>
            <Summary expenses={filteredExpenses} incomes={filteredIncomes} />
          </div>
          {userId && <TransactionForm userId={userId} currentBalance={currentBalance} />}
        </div>

        <div className="grid-col-span-2 card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="card-title" style={{ marginBottom: 0 }}>Transaction History</h2>
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
          {userId && <TransactionList transactions={transactions} userId={userId} />}
        </div>
      </div>

      <Charts expenses={filteredExpenses} allIncomes={allIncomes} allExpenses={allExpenses} />

      {showProfileModal && userId && (
        <ProfileModal
          userId={userId}
          onClose={(savedProfile) => {
            setProfile(savedProfile);
            setShowProfileModal(false);
          }}
        />
      )}

    </main>
  );
}

export default App;
