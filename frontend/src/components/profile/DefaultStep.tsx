import React, { useState, useRef, useCallback } from 'react';
import { IoMdClose } from "react-icons/io";
import { LiaArrowLeftSolid } from "react-icons/lia";
import { useFocusTrap } from '@/hooks/useFocusTrap';
import QuizProgressBar from '../common/QuizProgressBar';
import type { StepConfig, FormData, FormHandlers, CommonProps } from './profileStepConfigs';

const DefaultStep: React.FC<{
  stepConfig: StepConfig;
  formData: FormData;
  handlers: FormHandlers;
  commonProps: CommonProps;
}> = ({ stepConfig, formData, handlers, commonProps }) => {
  const { step, setStep, totalSteps, skipOnboarding, handleSubmit } = commonProps;
  const hasSelection = stepConfig.hasSelection(formData);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const skipModalRef = useRef<HTMLDivElement>(null);

  const handleContinue = () => {
    if (stepConfig.isLast) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSkipButtonClick = () => {
    setShowSkipModal(true);
  };

  const handleCloseSkipModal = useCallback(() => {
    setShowSkipModal(false);
  }, []);

  const handleConfirmSkip = () => {
    setShowSkipModal(false);
    skipOnboarding();
  };

  const handleModalOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      setShowSkipModal(false);
    }
  };

  // Focus trapping + Escape key for skip modal
  useFocusTrap(skipModalRef, showSkipModal, handleCloseSkipModal);

  return (
    <div className="
      relative mx-auto flex size-full min-h-screen flex-col items-center
      justify-start overflow-hidden bg-brand-bg text-white
    " role="main" aria-label="Profile creation form">
      <div className="
        relative z-10 mt-12 mb-16 flex w-[70%] max-w-337.5 items-center
        justify-center
      " role="navigation" aria-label="Progress navigation">
        {!stepConfig.isFirst ? (
          <button
            className="
              z-10 inline-flex size-6 cursor-pointer items-center justify-center
              border-none bg-transparent p-0
            "
            onClick={handleBack}
            aria-label="Go back to previous step"
          >
            <LiaArrowLeftSolid size={24} color={'#FFFFFF'} />
          </button>
        ) : (
          <div className="size-6" />
        )}
        <QuizProgressBar
          currentIndex={step}
          totalQuestions={totalSteps}
          style={{
            width: '90%',
            height: 10,
            backgroundColor: '#424E62',
            borderRadius: 6,
            border: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            marginLeft: '2.5rem',
            marginRight: '2.5rem',
          }}
          fillColor="#7BA8ED"
          animationDuration={600}
        />
        <div className="size-6" />
      </div>

      {/* Skip Confirmation Modal */}
      {showSkipModal && (
        <div className="
          fixed inset-0 z-9999 flex items-center justify-center bg-black/15
        " onClick={handleModalOverlayClick} ref={skipModalRef}>
          <div className="
            w-[90%] max-w-110 rounded-2xl bg-brand-navy p-10 text-center
            shadow-[0_15px_30px_rgba(0,0,0,0.5)]
          " role="dialog" aria-modal="true" aria-labelledby="skip-modal-title">
            <div className="relative flex items-center justify-between">
              <h2 id="skip-modal-title" className="
                mt-0 mb-4 flex-1 text-center font-inter text-[22px] leading-snug
                font-semibold text-[#FEFEFE]
              ">Your answers help Quantaid teach in a way that clicks for <span className="
                italic
              ">you</span>.</h2>
              <button onClick={handleCloseSkipModal} className="
                absolute -top-7 -right-7 flex cursor-pointer items-center
                justify-center border-none bg-transparent p-1
              " aria-label="Close">
                <IoMdClose size={24} color="#FFFFFF" />
              </button>
            </div>
            <p className="
              mt-0 mb-8 font-inter text-sm/relaxed font-normal text-brand-cool
            ">
              Skipping means you'll get a more general experience for now, but you can update your preferences anytime in your profile settings.
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="
                  back-button min-w-30 cursor-pointer rounded-xl border-2
                  border-brand-border bg-transparent px-6 py-3 font-inter
                  text-base font-medium text-white transition-all duration-200
                "
                onClick={handleCloseSkipModal}
              >
                Go back
              </button>
              <button
                className="
                  skip-button min-w-30 cursor-pointer rounded-xl border-none
                  bg-[#3D4C65] px-6 py-3 font-inter text-base font-medium
                  text-white transition-all duration-200
                "
                onClick={handleConfirmSkip}
              >
                Skip anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="
        mx-auto box-border flex w-[62%] max-w-298.75 flex-1 flex-col
        items-center justify-start px-10 pt-15 pb-10
      ">
        <h2 className="
          mx-auto w-full max-w-298.75 text-center font-inter text-[34px]
          leading-relaxed font-normal tracking-[.02em] text-white
        ">{stepConfig.title}</h2>
        {stepConfig.subtitle && (
          <p className="text-center font-inter text-[1.2rem] text-white">{stepConfig.subtitle}</p>
        )}
        <div className="mt-12">
          {stepConfig.renderContent(formData, handlers)}
        </div>
      </div>

      <div className="
        relative z-10 mt-auto flex w-full items-center justify-center border-t
        border-[rgba(66,78,98,0.3)] transition-[background-color] duration-150
      ">
        <div className="my-6 flex w-[65%] max-w-337.5 items-center justify-end">
          <div className="flex h-15 items-center gap-4">
            <button
              className="
                profile-bottom-buttons skip-button min-w-20 cursor-pointer
                border-transparent bg-transparent px-10.5 py-3 font-sarabun
                text-[22px] font-medium text-[#AAABAF] transition-all
                duration-200
              "
              onClick={handleSkipButtonClick}
              aria-label="Skip onboarding questions"
            >
              SKIP FOR NOW
            </button>
            <button
              className="
                profile-bottom-buttons min-w-25 cursor-pointer rounded-2xl
                border-none px-10.5 py-3 font-sarabun text-[22px] font-medium
                text-white transition-all duration-200
              "
              style={{
                opacity: hasSelection ? 1 : 0.5,
                cursor: hasSelection ? 'pointer' : 'not-allowed',
                backgroundColor: hasSelection ? '#142748' : '#2A3A52',
              }}
              onClick={() => hasSelection && handleContinue()}
              disabled={!hasSelection}
              aria-label={stepConfig.isLast ? 'Submit profile' : 'Continue to next step'}
              aria-disabled={!hasSelection}
            >
              {stepConfig.isLast ? 'SAVE AND CONTINUE' : 'CONTINUE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefaultStep;
