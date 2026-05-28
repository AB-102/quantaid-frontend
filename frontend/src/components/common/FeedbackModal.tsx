// src/components/FeedbackModal.tsx

import React, { useState, useRef, useEffect } from 'react';
import { MdClose, MdArrowBackIos } from 'react-icons/md';

import api from '@/api';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string; // For quiz modal to start at 'Quizzes'
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  initialCategory
}) => {
  const [currentStep, setCurrentStep] = useState<'category' | 'feedback'>(
    initialCategory ? 'feedback' : 'category'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || '');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const categories = [
    'Analogies and chat responses',
    'Lessons',
    'Quizzes',
    'Something didn\'t work as expected',
    'General thoughts or questions'
  ];

  useEffect(() => {
    if (isOpen) {
      const modalElement = modalRef.current;
      if (!modalElement) return;

      const focusableElements = modalElement.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKeyPress = (event: KeyboardEvent) => {
        if (event.key === 'Tab') {
          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      };

      const handleEscapeKeyPress = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          handleClose();
        }
      };

      modalElement.addEventListener('keydown', handleTabKeyPress);
      modalElement.addEventListener('keydown', handleEscapeKeyPress);

      firstElement.focus();

      return () => {
        modalElement.removeEventListener('keydown', handleTabKeyPress);
        modalElement.removeEventListener('keydown', handleEscapeKeyPress);
      };
    }
  }, [isOpen, currentStep]);

  const handleModalOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    setCurrentStep('category');
    setSelectedCategory('');
    setFeedbackText('');
    setSelectedFile(null);
    onClose();
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentStep('feedback');
  };

  const handleBack = () => {
    if (initialCategory) {
      handleClose();
    } else {
      setCurrentStep('category');
      setSelectedCategory('');
      setFeedbackText('');
      setSelectedFile(null);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = () => {
    const submit = async () => {
      try {
        if (selectedFile) {
          const formData = new FormData();
          formData.append('category', selectedCategory);
          formData.append('feedback', feedbackText);
          formData.append('screenshot', selectedFile);
          await api.post('/submit_feedback', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        } else {
          await api.post('/submit_feedback', { category: selectedCategory, feedback: feedbackText });
        }
        alert('Thank you for your feedback!');
        handleClose();
      } catch (err: unknown) {
        alert('An error occurred while submitting feedback.');
        console.error(err);
      }
    };
    void submit();
  };

  if (!isOpen) return null;

  return (
    <div
      className="
        fixed inset-0 z-9999 flex items-center justify-center bg-black/15
      "
      onClick={handleModalOverlayClick}
      ref={modalRef}
    >
      <div
        className="
          max-h-[80vh] w-[90%] max-w-125 overflow-y-auto rounded-2xl
          bg-brand-panel p-10 shadow-[0_15px_30px_rgba(0,0,0,0.5)]
        "
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
      >
        {currentStep === 'category' ? (
          <>
            <div className="relative mb-6 flex items-center justify-between">
              <h2
                id="feedback-modal-title"
                className="
                  m-0 flex-1 text-center font-inter text-2xl font-semibold
                  text-white
                "
              >
                Help us improve Quantaid
              </h2>
              <button
                onClick={handleClose}
                className="
                  absolute -top-7 -right-7 flex cursor-pointer items-center
                  justify-center border-none bg-transparent p-1
                "
                aria-label="Close"
              >
                <MdClose size={24} color="#FFFFFF" />
              </button>
            </div>

            <p className="
              m-0 mb-8 text-center font-inter text-base/relaxed font-normal
              text-white
            ">
              What would you like to give feedback on?
            </p>

            <div className="flex flex-col gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className="
                    feedback-category-button w-full cursor-pointer rounded-lg
                    border border-brand-border bg-transparent px-5 py-4
                    text-left font-inter text-base font-normal text-white
                    transition-all duration-200
                  "
                >
                  {category}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="relative mb-6 flex items-center justify-between">
              <button
                onClick={handleBack}
                className="
                  absolute -top-6 -left-7 flex cursor-pointer items-center
                  justify-center border-none bg-transparent p-1
                "
                aria-label="Go back to categories"
              >
                <MdArrowBackIos size={18} color="#FFFFFF" />
              </button>
              <h2
                id="feedback-modal-title"
                className="
                  m-0 flex-1 text-center font-inter text-2xl font-semibold
                  text-white
                "
              >
                {selectedCategory}
              </h2>
              <button
                onClick={handleClose}
                className="
                  absolute -top-7 -right-7 flex cursor-pointer items-center
                  justify-center border-none bg-transparent p-1
                "
                aria-label="Close"
              >
                <MdClose size={24} color="#FFFFFF" />
              </button>
            </div>

            <p className="
              m-0 mb-8 text-center font-inter text-base/relaxed font-normal
              text-white
            ">
              Tell us how we can improve
            </p>

            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Describe your experience here."
              className="
                feedback-textarea mb-6 box-border min-h-30 w-full resize-y
                rounded-lg border border-brand-border-dark bg-brand-bg p-4
                font-inter text-base font-normal text-[#9DA7B7] outline-none
              "
              aria-label="Feedback description"
            />

            <div className="flex flex-wrap items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                onClick={handleFileUpload}
                className="
                  feedback-screenshot-button min-w-37.5 flex-1 cursor-pointer
                  rounded-lg border border-brand-border-dark bg-transparent px-5
                  py-3 font-inter text-sm font-normal text-white transition-all
                  duration-200
                "
              >
                {selectedFile ? `Selected: ${selectedFile.name}` : 'Add a screen shot'}
              </button>

              <button
                onClick={handleSubmit}
                disabled={!feedbackText.trim()}
                style={{
                  opacity: feedbackText.trim() ? 1 : 0.5,
                  cursor: feedbackText.trim() ? 'pointer' : 'not-allowed'
                }}
                className="
                  feedback-submit-button min-w-25 rounded-2xl border-none
                  bg-brand-border-dark px-6 py-3 font-inter text-base
                  font-medium text-white transition-all duration-200
                "
              >
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
