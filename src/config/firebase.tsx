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
    query, setDoc
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

// Export Firebase instances
export { app, appId, auth, db };
