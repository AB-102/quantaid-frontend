// A centred dialog: Escape and the backdrop close it, and Tab stays inside it

import React, { useRef } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children, wide = false }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true, onClose);

  return (
    <div
      className="
        fixed inset-0 z-3000 flex items-center justify-center bg-black/60 p-6
      "
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`
          flex max-h-[85vh] w-full flex-col rounded-lg border
          border-brand-border-dark bg-brand-panel p-5 shadow-2xl
          ${wide ? 'max-w-4xl' : 'max-w-xl'}
        `}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="m-0 font-inter text-base font-semibold text-[#F9FAFB]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="
              cursor-pointer rounded-sm border-none bg-transparent px-2 text-lg
              text-[#9DA7B7]
              hover:text-white
            "
          >
            ×
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
