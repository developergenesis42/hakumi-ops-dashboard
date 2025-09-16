import React from 'react';
import { LoadingButton } from '@/shared/components/ui';
import type { Therapist } from '@/types';
import { useSessionModal } from '@/hooks/useSessionModal';
import { useApp } from '@/hooks/useApp';
import {
  ServiceCategoryStep,
  ServicePackageStep,
  SecondTherapistStep,
  RoomSelectionStep,
  DiscountStep,
  TimeSelectionStep,
  ConfirmStep
} from '@/features/sessions';
import { FormSteps, IconButton } from '@/shared/components/ui';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapist: Therapist;
  isManualAdd?: boolean;
}

function SessionModal({ isOpen, onClose, therapist, isManualAdd = false }: SessionModalProps) {
  const { state } = useApp();
  const {
    currentStep,
    selectedServiceCategory,
    selectedService,
    selectedRoom,
    selectedTherapist2,
    discount,
    startTime,
    endTime,
    isSubmitting,
    setSelectedServiceCategory,
    setSelectedService,
    setSelectedRoom,
    setSelectedTherapist2,
    setDiscount,
    setStartTime,
    setEndTime,
    handleNext,
    handleBack,
    handleSubmit,
    availableRooms,
    availableTherapists
  } = useSessionModal(isOpen, onClose, therapist, isManualAdd);



  if (!isOpen) return null;

  // Calculate current step index for FormSteps
  const allSteps = ['service-category', 'service-package', 'therapist2', 'room-select', 'discount', 'time-select', 'confirm'];
  const visibleSteps = selectedServiceCategory === 'Double' 
    ? allSteps 
    : allSteps.filter(step => step !== 'therapist2');
  
  // For manual add, always include time selection step
  const finalSteps = isManualAdd ? visibleSteps : visibleSteps.filter(step => step !== 'time-select');
  
  const currentStepIndex = visibleSteps.indexOf(currentStep);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto modal-content">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {isManualAdd ? 'Manual Add Session' : 'Save Session'}
            </h2>
            <IconButton
              onClick={onClose}
              variant="ghost"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
            />
          </div>
          <p className="text-gray-600 mt-1">Therapist: {therapist.name}</p>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-2">
            {visibleSteps.map((step, index) => {
              const isActive = currentStep === step;
              const isCompleted = currentStepIndex > index;
              
              return (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isActive ? 'bg-blue-600 text-white' : 
                    isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  {index < visibleSteps.length - 1 && <div className="w-8 h-1 bg-gray-200 mx-2"></div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content using FormSteps compound component */}
        <FormSteps
          currentStep={currentStepIndex}
          totalSteps={finalSteps.length}
          onNext={handleNext}
          onBack={handleBack}
          onComplete={handleSubmit}
          className="px-6 py-6"
        >
          <FormSteps.Content>
            {/* Step 1: Package Category Selection */}
            {currentStep === 'service-category' && (
              <ServiceCategoryStep
                selectedServiceCategory={selectedServiceCategory}
                onSelectCategory={setSelectedServiceCategory}
              />
            )}

            {/* Step 2: Package Selection */}
            {currentStep === 'service-package' && selectedServiceCategory && (
              <ServicePackageStep
                selectedServiceCategory={selectedServiceCategory}
                selectedService={selectedService}
                services={state.services}
                onSelectService={setSelectedService}
              />
            )}

            {/* Step 3: Second Therapist Selection (Double only) */}
            {currentStep === 'therapist2' && selectedService?.category === 'Double' && (
              <SecondTherapistStep
                selectedTherapist2={selectedTherapist2}
                availableTherapists={availableTherapists}
                onSelectTherapist2={setSelectedTherapist2}
              />
            )}

            {/* Step 4: Room Selection */}
            {currentStep === 'room-select' && (
              <RoomSelectionStep
                selectedService={selectedService}
                selectedRoom={selectedRoom}
                availableRooms={availableRooms}
                sessions={state.sessions}
                onSelectRoom={setSelectedRoom}
                isManualAdd={isManualAdd}
              />
            )}

            {/* Step 5: Discount */}
            {currentStep === 'discount' && (
              <DiscountStep
                selectedService={selectedService}
                discount={discount}
                onDiscountChange={setDiscount}
              />
            )}

            {/* Step 6: Time Selection (Manual Add Only) */}
            {currentStep === 'time-select' && selectedService && (
              <TimeSelectionStep
                selectedService={selectedService}
                startTime={startTime}
                endTime={endTime}
                onStartTimeChange={setStartTime}
                onEndTimeChange={setEndTime}
              />
            )}

            {/* Step 7: Confirmation */}
            {currentStep === 'confirm' && (
              <ConfirmStep
                selectedService={selectedService}
                selectedRoom={selectedRoom}
                selectedTherapist2={selectedTherapist2}
                therapist={therapist}
                discount={discount}
                startTime={isManualAdd ? startTime : undefined}
                endTime={isManualAdd ? endTime : undefined}
              />
            )}
          </FormSteps.Content>

          <FormSteps.Actions>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            
            {currentStep === 'confirm' && (
              <LoadingButton
                onClick={handleSubmit}
                loading={isSubmitting}
                className="px-6 py-2 rounded-lg"
                variant="primary"
              >
                {isManualAdd ? 'Add Session' : 'Save Session'}
              </LoadingButton>
            )}
          </FormSteps.Actions>
        </FormSteps>
      </div>
    </div>
  );
}

export default React.memo(SessionModal);
