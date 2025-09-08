import React from 'react';
import './Header.css';

interface HeaderProps {
    profile: { name: string; initialBalance: number } | null;
    onDeleteAccount: () => void;
    onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ profile, onDeleteAccount, onSignOut }) => {
    return (
        <header className="header">
            <div className="header-content">
                <div className="header-info">
                    <h1 className="header-title">
                        {profile?.name ? `${profile.name}'s Financial Dashboard` : "Your Financial Dashboard"}
                    </h1>
                    <p className="header-subtitle">Your data is synced securely across all your devices.</p>
                </div>
                <div className="header-actions">
                    <button
                        onClick={onDeleteAccount}
                        className="button button-delete"
                    >
                        Delete Account
                    </button>
                    <button
                        onClick={onSignOut}
                        className="button button-signout"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
