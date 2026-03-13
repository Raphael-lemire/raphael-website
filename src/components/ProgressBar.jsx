import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ currentStep }) => {
    const steps = [
        { id: 1, label: 'Intake' },
        { id: 2, label: 'Booking' },
        { id: 3, label: 'Success' }
    ];

    return (
        <div className="progress-container fade-in">
            <div className="progress-steps">
                {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <div className={`step-item ${currentStep >= step.id ? 'active' : ''}`}>
                            <div className="step-number">
                                {currentStep > step.id ? '✓' : step.id}
                            </div>
                            <span className="step-label">{step.label}</span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`step-line ${currentStep > step.id ? 'active' : ''}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default ProgressBar;
