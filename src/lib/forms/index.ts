import type { ChangeEvent } from 'react';

/**
 * Form utility types and helpers for handling input changes
 * Centralizes the common pattern of converting input values and syncing with state
 */

/**
 * Callback type for field changes that sync form values to calculator state
 */
export type FieldChangeCallback<T> = (name: keyof T, value: number | boolean) => void;

/**
 * Creates a change handler factory for numeric input fields.
 * Returns a function that, given a field name, returns an onChange handler
 * that parses the input value as a number and calls the provided callback.
 *
 * @example
 * ```tsx
 * const handleChange = createNumberChangeHandler<TaxpayerInputForm>(onFieldChange);
 *
 * <input
 *   onChange={handleChange('annualSalary')}
 *   type="number"
 * />
 * ```
 */
export function createNumberChangeHandler<T>(
  onFieldChange?: FieldChangeCallback<T>
) {
  return (name: keyof T) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value) || 0;
    onFieldChange?.(name, value);
  };
}

/**
 * Creates a change handler factory for boolean toggle fields.
 * Returns a function that, given a field name, returns an onChange handler
 * that calls the provided callback with the new boolean value.
 *
 * @example
 * ```tsx
 * const handleToggle = createBooleanChangeHandler<TaxpayerInputForm>(onFieldChange);
 *
 * <Toggle
 *   onChange={handleToggle('hasSpouse')}
 * />
 * ```
 */
export function createBooleanChangeHandler<T>(
  onFieldChange?: FieldChangeCallback<T>
) {
  return (name: keyof T) => (checked: boolean) => {
    onFieldChange?.(name, checked);
  };
}

/**
 * Common form field props that include change callback
 */
export interface WithFieldChange<T> {
  onFieldChange?: FieldChangeCallback<T>;
}
