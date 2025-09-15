import { type FirebaseApp, initializeApp } from 'firebase/app';
import { type Auth, deleteUser, getAuth, GoogleAuthProvider, onAuthStateChanged, reauthenticateWithPopup, signInWithPopup, signOut } from 'firebase/auth';
import {
    collection,
    deleteDoc,
    doc, Firestore, getDoc,
    getDocs,
    getFirestore,
    onSnapshot,
    orderBy,
    query, setDoc, updateDoc, writeBatch
} from "firebase/firestore";
import type { Balance, Expense, Income } from './types';


// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const appId = import.meta.env.VITE_APP_ID || 'expense-tracker';

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// Debug: Log Firebase initialization
console.log('Firebase initialized:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
});

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Google sign-in failed:", error);
        throw error;
    }
};

export const signOutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Sign out failed:", error);
        throw error;
    }
};

// Authentication setup
export const setupAuth = (onUserChange: (userId: string | null) => void) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
        onUserChange(user ? user.uid : null);
    });
    return unsubscribe;
};

// Firestore subscriptions
export const subscribeToExpenses = (
    userId: string,
    onExpensesChange: (expenses: Expense[]) => void,
    onError?: (error: Error) => void
) => {
    const expensesCol = collection(db, 'artifacts', appId, 'users', userId, 'expenses');
    const expensesQuery = query(expensesCol, orderBy('date', 'desc'));

    return onSnapshot(expensesQuery, (snapshot) => {
        const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
        onExpensesChange(expensesData);
    }, (error) => {
        console.error("Error fetching expenses:", error);
        onError?.(error);
    });
};

export const subscribeToIncomes = (
    userId: string,
    onIncomesChange: (incomes: Income[]) => void,
    onError?: (error: Error) => void
) => {
    const incomesCol = collection(db, 'artifacts', appId, 'users', userId, 'incomes');
    const incomesQuery = query(incomesCol, orderBy('date', 'desc'));

    return onSnapshot(incomesQuery, (snapshot) => {
        const incomesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Income));
        onIncomesChange(incomesData);
    }, (error) => {
        console.error("Error fetching incomes:", error);
        onError?.(error);
    });
};

export const subscribeToBalances = (
    userId: string,
    onBalancesChange: (balances: Balance[]) => void,
    onError?: (error: Error) => void
) => {
    const balancesCol = collection(db, 'artifacts', appId, 'users', userId, 'balances');
    const balancesQuery = query(balancesCol, orderBy('date', 'desc'));

    return onSnapshot(balancesQuery, (snapshot) => {
        const balancesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Balance));
        onBalancesChange(balancesData);
    }, (error) => {
        console.error("Error fetching balances:", error);
        onError?.(error);
    });
};


// --- User Profile Functions ---
export const getUserProfile = async (userId: string) => {
    const profileRef = doc(db, "artifacts", appId, "users", userId, "profile", "info");
    const snap = await getDoc(profileRef);
    return snap.exists() ? snap.data() as { name: string; initialBalance: number } : null;
};

export const saveUserProfile = async (userId: string, name: string, initialBalance: number) => {
    const profileDocRef = doc(db, "artifacts", appId, "users", userId, "profile", "info");
    await setDoc(profileDocRef, { name, initialBalance });
};

// --- Delete Account ---
async function deleteCollection(userId: string, collectionName: string) {
    const colRef = collection(db, "artifacts", appId, "users", userId, collectionName);
    const snapshot = await getDocs(colRef);
    for (const docSnap of snapshot.docs) {
        await deleteDoc(docSnap.ref);
    }
}

export async function deleteUserAccount(userId: string) {
    try {
        // 1. Delete collections
        await deleteCollection(userId, "expenses");
        await deleteCollection(userId, "incomes");
        await deleteCollection(userId, "balances");

        // 2. Delete profile document
        const profileRef = doc(db, "artifacts", appId, "users", userId, "profile", "info");
        await deleteDoc(profileRef);

        // 3. Delete Firebase Auth user
        // 3. Reauthenticate before deleting auth user
        if (auth.currentUser) {
            const provider = new GoogleAuthProvider();
            await reauthenticateWithPopup(auth.currentUser, provider); // ask user to confirm login
            await deleteUser(auth.currentUser);
        }

        console.log("User account and all data deleted successfully.");
    } catch (err) {
        console.error("Failed to delete user account:", err);
        throw err;
    }
}

// --- Transaction Update Functions ---
export const updateTransaction = async (
    userId: string,
    transactionId: string,
    transactionType: 'expense' | 'income' | 'balance',
    updateData: any
) => {
    const collectionName = transactionType === 'expense' ? 'expenses' :
        transactionType === 'income' ? 'incomes' : 'balances';

    const docRef = doc(db, 'artifacts', appId, 'users', userId, collectionName, transactionId);
    await updateDoc(docRef, updateData);
};

export const recalculateRunningBalances = async (
    userId: string,
    editedTransactionId: string,
    editedTransactionType: 'expense' | 'income' | 'balance',
    editedTransactionDate: string,
    editedTransactionAmount: number,
    _isExpense: boolean
) => {
    try {
        // Get all transactions sorted by date (oldest first)
        const allTransactions: any[] = [];

        // Get expenses
        const expensesCol = collection(db, 'artifacts', appId, 'users', userId, 'expenses');
        const expensesQuery = query(expensesCol, orderBy('date', 'asc'));
        const expensesSnapshot = await getDocs(expensesQuery);
        expensesSnapshot.docs.forEach(doc => {
            allTransactions.push({ id: doc.id, ...doc.data(), type: 'expense' });
        });

        // Get incomes
        const incomesCol = collection(db, 'artifacts', appId, 'users', userId, 'incomes');
        const incomesQuery = query(incomesCol, orderBy('date', 'asc'));
        const incomesSnapshot = await getDocs(incomesQuery);
        incomesSnapshot.docs.forEach(doc => {
            allTransactions.push({ id: doc.id, ...doc.data(), type: 'income' });
        });

        // Get balances
        const balancesCol = collection(db, 'artifacts', appId, 'users', userId, 'balances');
        const balancesQuery = query(balancesCol, orderBy('date', 'asc'));
        const balancesSnapshot = await getDocs(balancesQuery);
        balancesSnapshot.docs.forEach(doc => {
            allTransactions.push({ id: doc.id, ...doc.data(), type: 'balance' });
        });

        // Create a copy of the edited transaction with updated values
        const editedTransaction = allTransactions.find(t => t.id === editedTransactionId);
        if (!editedTransaction) return;

        // Update the edited transaction in the array with new values
        const updatedEditedTransaction = {
            ...editedTransaction,
            amount: editedTransactionAmount,
            date: editedTransactionDate,
            type: editedTransactionType
        };

        // Replace the old transaction with the updated one
        const editedIndex = allTransactions.findIndex(t => t.id === editedTransactionId);
        allTransactions[editedIndex] = updatedEditedTransaction;

        // Sort all transactions by date and time again (in case date changed)
        allTransactions.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA === dateB) {
                // If same date, sort by creation time or ID for consistency
                return a.id.localeCompare(b.id);
            }
            return dateA - dateB;
        });

        // Find the new position of the edited transaction
        const newEditedIndex = allTransactions.findIndex(t => t.id === editedTransactionId);
        if (newEditedIndex === -1) return;

        // Recalculate ALL running balances from the beginning
        let runningBalance = 0;
        const batch = writeBatch(db);

        console.log(`Recalculating running balances for ${allTransactions.length} transactions`);

        for (let i = 0; i < allTransactions.length; i++) {
            const transaction = allTransactions[i];
            const oldRunningBalance = transaction.runningBalance;

            // Calculate running balance based on transaction type
            if (transaction.type === 'expense') {
                runningBalance -= transaction.amount;
            } else if (transaction.type === 'income') {
                runningBalance += transaction.amount;
            } else if (transaction.type === 'balance') {
                const isPositive = transaction.description.includes('+');
                runningBalance += isPositive ? transaction.amount : -transaction.amount;
            }

            // Update the running balance in the transaction object
            transaction.runningBalance = runningBalance;

            // Add to batch for database update
            const collectionName = transaction.type === 'expense' ? 'expenses' :
                transaction.type === 'income' ? 'incomes' : 'balances';
            const docRef = doc(db, 'artifacts', appId, 'users', userId, collectionName, transaction.id);
            batch.update(docRef, { runningBalance });

            // Log changes for debugging
            if (oldRunningBalance !== runningBalance) {
                console.log(`Transaction ${transaction.id} (${transaction.type}): ${oldRunningBalance} -> ${runningBalance}`);
            }
        }

        // Commit all updates
        await batch.commit();

        console.log('Successfully recalculated running balances for all transactions');

    } catch (error) {
        console.error("Error recalculating running balances:", error);
        throw error;
    }
};

// Export Firebase instances
export { app, appId, auth, db };
