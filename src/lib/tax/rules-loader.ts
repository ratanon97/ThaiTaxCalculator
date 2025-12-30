import type { TaxRulesConfig } from '@/types/tax';

// Import tax rules for each year
import rules2567 from '@/rules/TH-2567.json';

const rulesMap: Record<number, TaxRulesConfig> = {
  2567: rules2567 as TaxRulesConfig,
};

export function loadTaxRules(taxYear: number): TaxRulesConfig {
  const rules = rulesMap[taxYear];
  if (!rules) {
    throw new Error(`Tax rules for year ${taxYear} not found. Available years: ${Object.keys(rulesMap).join(', ')}`);
  }
  return rules;
}

export function getAvailableTaxYears(): number[] {
  return Object.keys(rulesMap).map(Number).sort((a, b) => b - a);
}

export function getLatestTaxYear(): number {
  const years = getAvailableTaxYears();
  return years[0];
}
