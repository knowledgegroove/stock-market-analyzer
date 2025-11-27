"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './AuthModal.module.css';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
    const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'signup') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('Check your email for the confirmation link!');
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
            onAuthSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });
            if (error) throw error;
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>×</button>

                <h2 className={styles.title}>
                    {mode === 'signin' ? 'Sign In' : 'Sign Up'}
                </h2>

                <p className={styles.subtitle}>
                    {mode === 'signin'
                        ? 'Welcome back! Sign in to access your watchlist.'
                        : 'Create an account to save your watchlist across devices.'}
                </p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleEmailAuth} className={styles.form}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={styles.input}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className={styles.input}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className={styles.submitButton}
                    >
                        {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div className={styles.divider}>
                    <span>OR</span>
                </div>

                <button
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className={styles.googleButton}
                >
                    <svg width="18" height="18" viewBox="0 0 18 18">
                        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                        <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z" />
                        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                    </svg>
                    Continue with Google
                </button>

                <div className={styles.toggle}>
                    {mode === 'signin' ? (
                        <>
                            Don't have an account?{' '}
                            <button onClick={() => setMode('signup')} className={styles.toggleButton}>
                                Sign Up
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <button onClick={() => setMode('signin')} className={styles.toggleButton}>
                                Sign In
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
