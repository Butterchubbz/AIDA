// src/components/ProgressBar.js
import React from 'react';

const ProgressBar = ({ progress, text }) => {
    return (
        <div className="w-full bg-slate-700 rounded-full h-6">
            <div
                className="bg-cyan-600 h-6 rounded-full text-center text-white text-sm leading-6"
                style={{ width: `${progress}%` }}
            >
                {text || `${Math.round(progress)}%`}
            </div>
        </div>
    );
};

export default ProgressBar;