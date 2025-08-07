// src/components/MessageBox.js
import React, { useState, useContext, createContext, useCallback, useEffect } from 'react';

// Create the context
const MessageBoxContext = createContext();

// Custom hook for easy consumption
export const useMessageBox = () => useContext(MessageBoxContext);

// The visual component for the confirmation dialog
const ConfirmationDialog = ({ title, message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md text-slate-100">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">{title}</h3>
            <p className="text-slate-300 mb-6">{message}</p>
            <div className="flex justify-end space-x-4">
                <button onClick={onCancel} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-md">Cancel</button>
                <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md">Confirm</button>
            </div>
        </div>
    </div>
);

// The visual component for a single toast message
const Toast = ({ message, type, onDismiss }) => {
    const typeClasses = {
        error: "bg-red-500",
        warning: "bg-yellow-500",
        info: "bg-blue-500",
        success: "bg-green-500",
    };

    useEffect(() => {
        const timer = setTimeout(onDismiss, 5000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className={`p-4 rounded-md shadow-lg text-white ${typeClasses[type]}`}>
            {message}
        </div>
    );
};

// The provider component
export const MessageBoxProvider = ({ children }) => {
    const [dialog, setDialog] = useState(null);
    const [toasts, setToasts] = useState([]);

    const showMessageBox = useCallback((title, message, isConfirmation) => {
        return new Promise((resolve) => {
            if (isConfirmation) {
                setDialog({
                    title,
                    message,
                    onConfirm: () => {
                        setDialog(null);
                        resolve(true);
                    },
                    onCancel: () => {
                        setDialog(null);
                        resolve(false);
                    },
                });
            } else {
                // Simple alert-style message box
                setDialog({
                    title,
                    message,
                    onConfirm: () => {
                        setDialog(null);
                        resolve(true);
                    },
                    onCancel: null, // No cancel button
                });
            }
        });
    }, []);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const value = { showMessageBox, showToast };

    return (
        <MessageBoxContext.Provider value={value}>
            {children}
            {dialog && <ConfirmationDialog {...dialog} />}
            {/* Toast container */}
            <div className="fixed bottom-5 right-5 space-y-2 z-50">
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} onDismiss={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
                ))}
            </div>
        </MessageBoxContext.Provider>
    );
};