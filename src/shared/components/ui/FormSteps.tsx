import React, { createContext, useContext } from 'react';
import { cn } from '@/utils/helpers';

interface FormStepsContextValue {
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onBack?: () => void;
  onComplete?: () => void;
}

const FormStepsContext = createContext<FormStepsContextValue>({
  currentStep: 0,
  totalSteps: 0
});

interface FormStepsProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onBack?: () => void;
  onComplete?: () => void;
  className?: string;
}

export function FormSteps({ 
  children, 
  currentStep, 
  totalSteps,
  onNext,
  onBack,
  onComplete,
  className = '' 
}: FormStepsProps) {
  return (
    <FormStepsContext.Provider value={{ currentStep, totalSteps, onNext, onBack, onComplete }}>
      <div className={cn('space-y-6', className)}>
        {children}
      </div>
    </FormStepsContext.Provider>
  );
}

interface StepHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function StepHeader({ title, description, className = '' }: StepHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
    </div>
  );
}

interface StepContentProps {
  children: React.ReactNode;
  className?: string;
}

export function StepContent({ children, className = '' }: StepContentProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  );
}

interface StepActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function StepActions({ children, className = '' }: StepActionsProps) {
  const { currentStep, totalSteps, onNext, onBack } = useContext(FormStepsContext);
  
  return (
    <div className={cn('flex justify-between pt-4 border-t border-gray-200', className)}>
      <div>
        {currentStep > 0 && onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back
          </button>
        )}
      </div>
      
      <div className="flex gap-3">
        {children}
        {currentStep < totalSteps - 1 && onNext && (
          <button
            onClick={onNext}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

// Compound component pattern
FormSteps.Header = StepHeader;
FormSteps.Content = StepContent;
FormSteps.Actions = StepActions;
