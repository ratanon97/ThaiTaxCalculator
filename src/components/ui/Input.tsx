'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            className={`
              w-full px-3 py-2.5 rounded-lg border bg-white
              text-gray-900 text-sm
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
              ${prefix ? 'pl-8' : ''}
              ${suffix ? 'pr-12' : ''}
              ${className}
            `}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {hint && !error && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
