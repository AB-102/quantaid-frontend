import React from 'react';

interface SettingOption {
  label: string;
  key: 'sound' | 'answers' | 'time';
  enabled: boolean;
}

interface QuizSettingsDropdownProps {
  dropdownRef: React.Ref<HTMLDivElement>;
  position: { x: number; y: number };
  settings: SettingOption[];
  onToggle: (key: 'sound' | 'answers' | 'time', currentValue: boolean) => void;
}

const QuizSettingsDropdown: React.FC<QuizSettingsDropdownProps> = ({
  dropdownRef,
  position,
  settings,
  onToggle,
}) => {
  return (
    <div
      ref={dropdownRef}
      className="
        z-1000 min-w-62.5 rounded-lg border border-brand-border bg-brand-mid p-3
        shadow-[0_4px_12px_rgba(0,0,0,0.3)]
      "
      style={{ position: 'fixed', left: position.x - 30, top: position.y, right: 'auto' }}
    >
      {settings.map(({ label, key, enabled }) => (
        <div
          key={key}
          className="
            mb-1 flex cursor-pointer items-center justify-between rounded-md
            p-0.5 transition-[background-color] duration-200
          "
          onClick={() => onToggle(key, enabled)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggle(key, enabled);
            }
          }}
          aria-label={`${label} ${enabled ? 'on' : 'off'}`}
        >
          <div className="flex items-center gap-3">
            <span className="font-inter text-sm font-normal text-brand-gray-mid">{label}</span>
          </div>
          <div className="flex items-center">
            <div
              className="
                relative h-4 w-8 rounded-2xl transition-[background-color]
                duration-200
              "
              style={{ backgroundColor: enabled ? '#7BA8ED' : '#424E62' }}
            >
              <div
                className="
                  absolute top-0.5 size-3 rounded-full bg-white
                  shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-[transform]
                  duration-200
                "
                style={{ transform: enabled ? 'translateX(16px)' : 'translateX(2px)' }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuizSettingsDropdown;
