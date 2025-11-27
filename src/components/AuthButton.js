"use client";

import { useState, useEffect } from 'react';
import { supabase, signOut } from '@/lib/supabase';
import styles from './AuthButton.module.css';

export default function AuthButton({ onOpenAuth, user, onUserChange }) {
    const handleSignOut = async () => {
        try {
            await signOut();
            onUserChange(null);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    if (user) {
        return (
            <div className={styles.userMenu}>
                <div className={styles.userInfo}>
                    <div className={styles.userEmail}>{user.email}</div>
                </div>
                <button onClick={handleSignOut} className={styles.signOutButton}>
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <button onClick={onOpenAuth} className={styles.authButton}>
            Sign In
        </button>
    );
}
