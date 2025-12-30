'use client';

import { InputHTMLAttributes, forwardRef, useCallback } from 'react';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  value: number;
  min?: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  showValue?: boolean;
  hint?: string;
  presets?: { label: string; value: number }[];
  disabled?: boolean;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      label,
      value,
      min = 0,
      max,
      step = 1000,
      onChange,
      formatValue = (v) => v.toLocaleString('th-TH'),
      showValue = true,
      hint,
      presets,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(Number(e.target.value));
      },
      [onChange]
    );

    const percentage = max > 0 ? ((value - min) / (max - min)) * 100 : 0;

    return (
      <div className={`w-full ${className}`}>
        {(label || showValue) && (
          <div className="flex justify-between items-center mb-2">
            {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
            {showValue && (
              <span className="text-sm font-semibold text-blue-600">
                {formatValue(value)} บาท
              </span>
            )}
          </div>
        )}

        <div className="relative">
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={`
              w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:bg-blue-600
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-moz-range-thumb]:w-5
              [&::-moz-range-thumb]:h-5
              [&::-moz-range-thumb]:bg-blue-600
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:cursor-pointer
            `}
            style={{
              background: `linear-gradient(to right, #2563eb ${percentage}%, #e5e7eb ${percentage}%)`,
            }}
            {...props}
          />
        </div>

        {presets && presets.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange(Math.min(preset.value, max))}
                disabled={disabled}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-full
                  transition-colors duration-200
                  ${
                    value === preset.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}

        {hint && <p className="mt-2 text-xs text-gray-500">{hint}</p>}
      </div>
    );
  }
);

Slider.displayName = 'Slider';
