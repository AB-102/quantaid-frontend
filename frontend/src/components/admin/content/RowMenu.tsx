// The ⋯ menu on an outline row: the row's less common actions, out of the way until needed

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';

export interface RowAction {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}

const RowMenu: React.FC<{ label: string; actions: RowAction[] }> = ({ label, actions }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const refs = useMemo(() => [menuRef], []);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(refs, close, open);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={`More actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="
          cursor-pointer rounded-sm border-none bg-transparent px-1.5 py-0.5
          text-sm leading-none text-[#8A94A6]
          hover:bg-brand-card hover:text-white
        "
      >
        ⋯
      </button>
      {open && (
        <div
          role="menu"
          onKeyDown={e => { if (e.key === 'Escape') close(); }}
          className="
            absolute top-full right-0 z-50 mt-1 min-w-36 rounded-md border
            border-brand-border-dark bg-brand-panel py-1 shadow-xl
          "
        >
          {actions.map(action => (
            <button
              key={action.label}
              role="menuitem"
              disabled={action.disabled}
              onClick={() => { close(); action.onSelect(); }}
              className={`
                block w-full cursor-pointer border-none bg-transparent px-3
                py-1.5 text-left font-inter text-[13px]
                hover:bg-brand-card
                disabled:cursor-not-allowed disabled:opacity-40
                ${action.danger ? 'text-error' : 'text-[#E5E7EB]'}
              `}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RowMenu;
