import React from 'react';
import './Login.css';

interface LoginProps {
    isSigningIn: boolean;
    onGoogleSignIn: () => void;
}

const Login: React.FC<LoginProps> = ({ isSigningIn, onGoogleSignIn }) => {
    return (
        <main className="container">
            <header className="header">
                <h1>Your Financial Dashboard</h1>
                <p>Sign in to access your expense tracker</p>
            </header>
            <div className="login-container">
                <div className="login-card">
                    <h2 className="card-title">Welcome</h2>
                    <p>Sign in with Google to access your financial dashboard</p>
                    <button
                        onClick={onGoogleSignIn}
                        disabled={isSigningIn}
                        className="button button-signin"
                    >
                        {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
                    </button>
                </div>
            </div>
        </main>
    );
};

export default Login;
