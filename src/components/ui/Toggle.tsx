'use client';

import { forwardRef } from 'react';

interface ToggleProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ label, description, checked, onChange, disabled }, ref) => {
    return (
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          disabled={disabled}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer
            rounded-full border-2 border-transparent
            transition-colors duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${checked ? 'bg-blue-600' : 'bg-gray-200'}
          `}
        >
          <span
            className={`
              pointer-events-none inline-block h-5 w-5
              transform rounded-full bg-white shadow ring-0
              transition duration-200 ease-in-out
              ${checked ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';
