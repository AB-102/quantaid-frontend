import React from 'react';
import { IoMdClose } from 'react-icons/io';

interface ExitConfirmModalProps {
  exitModalRef: React.Ref<HTMLDivElement>;
  onClose: () => void;
  onConfirmExit: () => void;
  onOverlayClick: (e: React.MouseEvent) => void;
}

const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  exitModalRef,
  onClose,
  onConfirmExit,
  onOverlayClick,
}) => {
  return (
    <div className="
      fixed inset-0 z-9999 flex items-center justify-center bg-black/15
    " onClick={onOverlayClick}>
      <div
        ref={exitModalRef}
        className="
          w-[90%] max-w-110 rounded-2xl bg-brand-navy p-10 text-center
          shadow-[0_15px_30px_rgba(0,0,0,0.5)]
        "
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-modal-title"
      >
        <div className="relative mb-6 flex items-center justify-between">
          <h2 id="exit-modal-title" className="
            m-0 flex-1 text-center font-inter text-[28px] font-semibold
            text-white
          ">Exit Quiz?</h2>
          <button onClick={onClose} className="
            absolute -top-7 -right-7 flex cursor-pointer items-center
            justify-center border-none bg-transparent p-1
          " aria-label="Close">
            <IoMdClose size={24} color="#FFFFFF" />
          </button>
        </div>
        <p className="
          mt-0 mb-8 font-inter text-base/relaxed font-normal text-brand-cool
        ">
          Leaving now will reset your progress. You'll start fresh next time.
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={onClose} className="
            back-button min-w-30 cursor-pointer rounded-xl border-2
            border-brand-border bg-transparent px-6 py-3 font-inter text-base
            font-medium text-white transition-all duration-200
          ">
            Go back
          </button>
          <button onClick={onConfirmExit} className="
            skip-button min-w-30 cursor-pointer rounded-xl border-none
            bg-[#3D4C65] px-6 py-3 font-inter text-base font-medium text-white
            transition-all duration-200
          ">
            Exit quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmModal;
