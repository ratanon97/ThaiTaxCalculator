'use client';

import { useState, useMemo, useCallback } from 'react';
import { calculateTax, getDefaultInput, loadTaxRules, getLatestTaxYear } from '@/lib/tax';
import type { TaxpayerInput, TaxCalculationResult, TaxRulesConfig } from '@/types/tax';

export function useTaxCalculation(taxYear?: number) {
  const year = taxYear ?? getLatestTaxYear();
  const rules = useMemo(() => loadTaxRules(year), [year]);

  const [input, setInput] = useState<TaxpayerInput>(getDefaultInput());

  const updateInput = useCallback((updates: Partial<TaxpayerInput>) => {
    setInput((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetInput = useCallback(() => {
    setInput(getDefaultInput());
  }, []);

  const result = useMemo(() => {
    return calculateTax(input, rules);
  }, [input, rules]);

  // Calculate baseline (no flexible retirement contributions)
  const baselineResult = useMemo(() => {
    const baselineInput: TaxpayerInput = {
      ...input,
      rmfInvestment: 0,
      ssfInvestment: 0,
      pensionInsurance: 0,
    };
    return calculateTax(baselineInput, rules);
  }, [input, rules]);

  return {
    input,
    setInput,
    updateInput,
    resetInput,
    result,
    baselineResult,
    rules,
    taxYear: year,
  };
}
