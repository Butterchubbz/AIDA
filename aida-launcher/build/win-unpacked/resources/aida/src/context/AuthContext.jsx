// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import getPocketBase from '../lib/pocketbase';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [pb, setPb] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const initPb = async () => {
            const pbInstance = await getPocketBase();
            setPb(pbInstance);
            setCurrentUser(pbInstance.authStore.model);

            const unsubscribe = pbInstance.authStore.onChange((token, model) => {
                setCurrentUser(model);
                setUserRole(model?.role || null);
                setLoadingAuth(false);
            }, true);

            return () => {
                unsubscribe();
            };
        };

        initPb();
    }, []);

    const emailSignIn = useCallback(async (email, password) => {
        if (!pb) return;
        return await pb.collection('users').authWithPassword(email, password);
    }, [pb]);

    const emailSignUp = useCallback(async (email, password) => {
        if (!pb) return;
        const data = {
            email,
            password,
            passwordConfirm: password,
            role: 'Viewer',
        };
        try {
            return await pb.collection('users').create(data);
        } catch (err) {
            if (err.status === 403) {
                const setupError = new Error("User creation is disabled. The first admin account must be created from the backend Admin Panel.");
                setupError.isSetupError = true;
                throw setupError;
            }
            throw err;
        }
    }, [pb]);

    const googleSignIn = useCallback(async () => {
        if (!pb) return;
        return await pb.collection('users').authWithOAuth2({ provider: 'google' });
    }, [pb]);

    const signOut = useCallback(() => {
        if (!pb) return;
        pb.authStore.clear();
    }, [pb]);

    const value = {
        pb,
        currentUser,
        userRole,
        loadingAuth,
        emailSignIn,
        emailSignUp,
        googleSignIn,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};