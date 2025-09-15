import { useEffect, useState } from 'react';
import { deleteUserAccount, getUserProfile, setupAuth, signInWithGoogle, signOutUser } from '../config/firebase';
import { useToast } from '../contexts/ToastContext';

interface UserProfile {
    name: string;
    initialBalance: number;
}

export const useAuth = () => {
    const [userId, setUserId] = useState<string | null>(null);
    const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [loading, setLoading] = useState<boolean>(true);
    const { showSuccess, showError } = useToast();

    useEffect(() => {
        const unsubscribe = setupAuth(setUserId);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                const userProfile = await getUserProfile(userId);
                if (!userProfile) {
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

    const handleGoogleSignIn = async () => {
        setIsSigningIn(true);
        try {
            await signInWithGoogle();
            showSuccess('Successfully signed in!');
        } catch (error) {
            console.error('Sign in failed:', error);
            showError('Failed to sign in. Please try again.');
        } finally {
            setIsSigningIn(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOutUser();
            showSuccess('Successfully signed out!');
        } catch (error) {
            console.error('Sign out failed:', error);
            showError('Failed to sign out. Please try again.');
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
            try {
                if (userId) {
                    await deleteUserAccount(userId);
                    showSuccess("Account deleted successfully");
                }
            } catch (err) {
                console.error(err);
                showError("Failed to delete account: " + (err as Error).message);
            }
        }
    };

    const handleProfileClose = (savedProfile: UserProfile | null) => {
        setProfile(savedProfile);
        setShowProfileModal(false);
    };

    return {
        userId,
        isSigningIn,
        profile,
        showProfileModal,
        loading,
        handleGoogleSignIn,
        handleSignOut,
        handleDeleteAccount,
        handleProfileClose
    };
};
