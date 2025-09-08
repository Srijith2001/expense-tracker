import { useEffect, useState } from 'react';
import { deleteUserAccount, getUserProfile, setupAuth, signInWithGoogle, signOutUser } from '../config/firebase';

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
            } catch (err) {
                console.error(err);
                alert("Failed to delete account: " + (err as Error).message);
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
