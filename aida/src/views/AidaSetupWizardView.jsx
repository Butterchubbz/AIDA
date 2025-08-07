import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createCollections, finalizeSetup, collections } from '@/lib/setupService';

const STEPS = {
    INTRODUCTION: 1,
    CONFIGURATION: 2,
    SUMMARY: 3,
    COMPLETED: 4,
};

function AidaSetupWizardView({ onSetupComplete }) {
    const [currentStep, setCurrentStep] = useState(STEPS.INTRODUCTION);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { pb } = useAuth();

    const handleStart = () => setCurrentStep(STEPS.CONFIGURATION);

    const handleConfirmAndCreate = async () => {
        setIsLoading(true);
        setError('');
        try {
            await createCollections(pb);
            await finalizeSetup(pb);
            setCurrentStep(STEPS.COMPLETED);
        } catch (err) {
            setError('An unexpected error occurred during setup. Please check the console.');
            console.error('Setup wizard error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case STEPS.INTRODUCTION:
                return <IntroductionStep onNext={handleStart} />;
            case STEPS.CONFIGURATION:
                return <ConfigurationStep onNext={() => setCurrentStep(STEPS.SUMMARY)} />;
            case STEPS.SUMMARY:
                return <SummaryStep onConfirm={handleConfirmAndCreate} onBack={() => setCurrentStep(STEPS.CONFIGURATION)} isLoading={isLoading} />;
            case STEPS.COMPLETED:
                return <CompletedStep onFinish={onSetupComplete} />;
            default:
                return <p>Unknown step.</p>;
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <div className="w-full max-w-3xl p-8 space-y-8 bg-slate-800 rounded-xl shadow-2xl">
                {error && <p className="text-sm text-center text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                {renderStep()}
            </div>
        </div>
    );
}

const IntroductionStep = ({ onNext }) => (
    <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-100">Welcome to AIDA</h1>
        <p className="text-slate-400 text-lg">This wizard will guide you through setting up the necessary database collections for your application.</p>
        <p className="text-slate-500">Click 'Next' to review the collections that will be created.</p>
        <button onClick={onNext} className="px-6 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-800">
            Next
        </button>
    </div>
);

const ConfigurationStep = ({ onNext }) => (
    <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-center text-slate-100">Database Configuration</h2>
        <p className="text-center text-slate-400">The following collections will be created. This is a one-time setup.</p>
        <div className="space-y-4">
            {collections.map(col => (
                <div key={col.name} className="p-4 bg-slate-700/50 rounded-lg">
                    <h3 className="font-bold text-slate-200">{col.name}</h3>
                    <p className="text-sm text-slate-400">{col.schema.map(field => field.name).join(', ')}</p>
                </div>
            ))}
        </div>
        <div className="flex justify-end">
            <button onClick={onNext} className="px-6 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-800">
                Next
            </button>
        </div>
    </div>
);

const SummaryStep = ({ onConfirm, onBack, isLoading }) => (
    <div className="text-center space-y-6">
        <h2 className="text-2xl font-semibold text-slate-100">Ready to Go?</h2>
        <p className="text-slate-400">The wizard will now create the database collections. This action cannot be undone.</p>
        <div className="flex justify-center space-x-4">
            <button onClick={onBack} disabled={isLoading} className="px-6 py-2 font-semibold text-slate-300 bg-slate-600 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-800">
                Back
            </button>
            <button onClick={onConfirm} disabled={isLoading} className="px-6 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-slate-800">
                {isLoading ? 'Creating...' : 'Confirm and Create Collections'}
            </button>
        </div>
    </div>
);

const CompletedStep = ({ onFinish }) => (
    <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-green-400">Setup Complete!</h1>
        <p className="text-slate-300">Your database has been configured. You can now start using AIDA.</p>
        <button onClick={onFinish} className="px-8 py-3 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-800">
            Go to Dashboard
        </button>
    </div>
);

export default AidaSetupWizardView;
