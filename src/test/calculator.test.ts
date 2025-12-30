import { describe, it, expect, beforeAll } from 'vitest';
import {
  calculateGrossIncome,
  calculateEmploymentExpenseDeduction,
  calculateNetIncomeAfterExpense,
  calculatePersonalAllowances,
  calculateMaxRetirementDeduction,
  calculateRetirementBucket,
  calculateLifeInsuranceBucket,
  calculateHealthInsuranceBucket,
  calculateProgressiveTax,
  calculateTax,
  calculateMaximizeBenefit,
  getDefaultInput,
} from '@/lib/tax/calculator';
import { loadTaxRules } from '@/lib/tax/rules-loader';
import type { TaxRulesConfig, TaxpayerInput } from '@/types/tax';

describe('Tax Calculator', () => {
  let rules: TaxRulesConfig;

  beforeAll(() => {
    rules = loadTaxRules(2567);
  });

  describe('Income Calculations', () => {
    it('should calculate gross income correctly', () => {
      const input: TaxpayerInput = {
        ...getDefaultInput(),
        annualSalary: 600000,
        bonus: 100000,
        otherIncome: 50000,
      };
      expect(calculateGrossIncome(input)).toBe(750000);
    });

    it('should calculate employment expense deduction at 50% up to 100,000', () => {
      // For income 100,000 -> 50% = 50,000
      expect(calculateEmploymentExpenseDeduction(100000, rules)).toBe(50000);

      // For income 200,000 -> 50% = 100,000 (max cap)
      expect(calculateEmploymentExpenseDeduction(200000, rules)).toBe(100000);

      // For income 500,000 -> 50% = 250,000, but capped at 100,000
      expect(calculateEmploymentExpenseDeduction(500000, rules)).toBe(100000);
    });

    it('should calculate net income after expense deduction', () => {
      // 500,000 - 100,000 (capped expense) = 400,000
      expect(calculateNetIncomeAfterExpense(500000, rules)).toBe(400000);
    });
  });

  describe('Personal Allowances', () => {
    it('should calculate self allowance of 60,000', () => {
      const input: TaxpayerInput = {
        ...getDefaultInput(),
        annualSalary: 600000,
      };
      const allowances = calculatePersonalAllowances(input, rules);
      expect(allowances.self).toBe(60000);
    });

    it('should give spouse allowance only when spouse has no income', () => {
      const inputWithSpouseNoIncome: TaxpayerInput = {
        ...getDefaultInput(),
        hasSpouse: true,
        spouseHasIncome: false,
      };
      const inputWithSpouseHasIncome: TaxpayerInput = {
        ...getDefaultInput(),
        hasSpouse: true,
        spouseHasIncome: true,
      };

      expect(calculatePersonalAllowances(inputWithSpouseNoIncome, rules).spouse).toBe(60000);
      expect(calculatePersonalAllowances(inputWithSpouseHasIncome, rules).spouse).toBe(0);
    });

    it('should calculate child allowance with 2018 bonus', () => {
      const input: TaxpayerInput = {
        ...getDefaultInput(),
        numberOfChildren: 3,
        childrenBornFrom2018: 2, // 2 children born from 2018
      };
      const allowances = calculatePersonalAllowances(input, rules);
      // 1 child before 2018: 30,000
      // 2 children from 2018: 2 * (30,000 + 30,000) = 120,000
      // Total: 150,000
      expect(allowances.children).toBe(150000);
    });

    it('should cap parent allowance at 4 parents', () => {
      const input: TaxpayerInput = {
        ...getDefaultInput(),
        numberOfParents: 6, // More than max
      };
      const allowances = calculatePersonalAllowances(input, rules);
      // 4 * 30,000 = 120,000
      expect(allowances.parents).toBe(120000);
    });
  });

  describe('Retirement Bucket Calculations', () => {
    it('should calculate max retirement deduction correctly', () => {
      // For 600,000 income: 30% = 180,000 (binding constraint)
      const maxCalc1 = calculateMaxRetirementDeduction(600000, rules);
      expect(maxCalc1.percentageLimit).toBe(180000);
      expect(maxCalc1.absoluteLimit).toBe(500000);
      expect(maxCalc1.maxDeduction).toBe(180000);
      expect(maxCalc1.bindingConstraint).toBe('percentage');

      // For 2,000,000 income: 30% = 600,000, but capped at 500,000
      const maxCalc2 = calculateMaxRetirementDeduction(2000000, rules);
      expect(maxCalc2.percentageLimit).toBe(600000);
      expect(maxCalc2.absoluteLimit).toBe(500000);
      expect(maxCalc2.maxDeduction).toBe(500000);
      expect(maxCalc2.bindingConstraint).toBe('absolute');
    });

    it('should calculate retirement bucket with multiple components', () => {
      const input: TaxpayerInput = {
        ...getDefaultInput(),
        annualSalary: 1000000,
        providentFundContribution: 100000,
        rmfInvestment: 100000,
        ssfInvestment: 100000,
      };

      const bucket = calculateRetirementBucket(input, 1000000, rules);

      // Max deduction: min(30% of 1M = 300,000, 500,000) = 300,000
      expect(bucket.maxRetirementDeduction).toBe(300000);

      // Total input: 100,000 + 100,000 + 100,000 = 300,000
      expect(bucket.totalInput).toBe(300000);

      // All within limit, so effective = input
      expect(bucket.totalEffectiveDeduction).toBe(300000);

      // No remaining capacity
      expect(bucket.remainingCapacity).toBe(0);
    });

    it('should clamp SSF at individual cap of 200,000', () => {
      const input: TaxpayerInput = {
        ...getDefaultInput(),
        annualSalary: 2000000,
        ssfInvestment: 300000, // Over the 200,000 cap
      };

      const bucket = calculateRetirementBucket(input, 2000000, rules);
      const ssfComponent = bucket.components.find((c) => c.componentId === 'ssf');

      expect(ssfComponent?.effectiveAmount).toBe(200000);
      expect(ssfComponent?.isAtIndividualLimit).toBe(true);
    });
  });

  describe('Insurance Bucket Calculations', () => {
    it('should cap life insurance at 100,000', () => {
      const input: TaxpayerInput = {
        ...getDefaultInput(),
        lifeInsurance: 150000, // Over cap
      };

      const bucket = calculateLifeInsuranceBucket(input, rules);
      expect(bucket.effectiveDeduction).toBe(100000);
      expect(bucket.isAtLimit).toBe(true);
    });

    it('should add spouse life insurance when spouse has no income', () => {
      const input: TaxpayerInput = {
        ...getDefaultInput(),
        hasSpouse: true,
        spouseHasIncome: false,
        lifeInsurance: 100000,
        spouseLifeInsurance: 10000,
      };

      const bucket = calculateLifeInsuranceBucket(input, rules);
      expect(bucket.effectiveDeduction).toBe(110000); // 100,000 + 10,000
    });

    it('should respect combined limit of life + health insurance', () => {
      const input: TaxpayerInput = {
        ...getDefaultInput(),
        lifeInsurance: 90000,
        healthInsurance: 25000, // Would normally be 25,000 but limited by combined
      };

      const lifeBucket = calculateLifeInsuranceBucket(input, rules);
      const healthBucket = calculateHealthInsuranceBucket(input, lifeBucket.effectiveDeduction, rules);

      // Life: 90,000, Health cap: min(25,000, 100,000 - 90,000) = 10,000
      expect(healthBucket.effectiveDeduction).toBe(10000);
    });
  });

  describe('Progressive Tax Calculations', () => {
    it('should return 0 tax for income up to 150,000', () => {
      const result = calculateProgressiveTax(150000, rules);
      expect(result.totalTax).toBe(0);
    });

    it('should calculate tax correctly for 300,000 taxable income', () => {
      // 0 - 150,000: exempt (0)
      // 150,001 - 300,000: 5% of 150,000 = 7,500
      const result = calculateProgressiveTax(300000, rules);
      expect(result.totalTax).toBe(7500);
      expect(result.marginalRate).toBe(0.05);
    });

    it('should calculate tax correctly for 500,000 taxable income', () => {
      // 0 - 150,000: exempt (0)
      // 150,001 - 300,000: 5% of 150,000 = 7,500
      // 300,001 - 500,000: 10% of 200,000 = 20,000
      // Total: 27,500
      const result = calculateProgressiveTax(500000, rules);
      expect(result.totalTax).toBe(27500);
      expect(result.marginalRate).toBe(0.10);
    });

    it('should calculate tax correctly for 1,000,000 taxable income', () => {
      // 0 - 150,000: exempt (0)
      // 150,001 - 300,000: 5% of 150,000 = 7,500
      // 300,001 - 500,000: 10% of 200,000 = 20,000
      // 500,001 - 750,000: 15% of 250,000 = 37,500
      // 750,001 - 1,000,000: 20% of 250,000 = 50,000
      // Total: 115,000
      const result = calculateProgressiveTax(1000000, rules);
      expect(result.totalTax).toBe(115000);
      expect(result.marginalRate).toBe(0.20);
    });

    it('should never produce negative bracket values', () => {
      const testIncomes = [0, 100000, 150000, 200000, 500000, 1000000, 5000000];

      for (const income of testIncomes) {
        const result = calculateProgressiveTax(income, rules);
        for (const bracket of result.bracketBreakdown) {
          expect(bracket.taxableInBracket).toBeGreaterThanOrEqual(0);
          expect(bracket.taxInBracket).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('Full Tax Calculation', () => {
    it('should calculate complete tax for typical employee', () => {
      const input: TaxpayerInput = {
        ...getDefaultInput(),
        annualSalary: 600000,
        socialSecurity: 9000,
        withholdingTaxPaid: 30000,
      };

      const result = calculateTax(input, rules);

      // Gross income: 600,000
      expect(result.grossIncome).toBe(600000);

      // Expense deduction: 100,000 (50% capped)
      expect(result.employmentExpenseDeduction).toBe(100000);

      // Net after expense: 500,000
      expect(result.netIncomeAfterExpense).toBe(500000);

      // Personal allowance: 60,000
      expect(result.personalAllowances.self).toBe(60000);

      // Social security: 9,000
      expect(result.deductions.socialSecurity.effectiveDeduction).toBe(9000);
    });

    it('should calculate refund when withholding exceeds tax', () => {
      const input: TaxpayerInput = {
        ...getDefaultInput(),
        annualSalary: 600000,  // Higher income to ensure some tax is calculated
        withholdingTaxPaid: 50000, // High withholding
      };

      const result = calculateTax(input, rules);

      // Should have some tax calculated
      expect(result.taxBeforeCredits).toBeGreaterThan(0);
      // Withholding is higher than tax, so should get refund
      expect(result.isRefund).toBe(true);
      expect(result.refundAmount).toBeGreaterThan(0);
    });

    it('should calculate additional tax payable when withholding is insufficient', () => {
      const input: TaxpayerInput = {
        ...getDefaultInput(),
        annualSalary: 1200000,
        bonus: 200000,
        withholdingTaxPaid: 10000, // Very low withholding
      };

      const result = calculateTax(input, rules);

      // Should have significant tax
      expect(result.taxBeforeCredits).toBeGreaterThan(10000);
      expect(result.isRefund).toBe(false);
      expect(result.finalTaxPayable).toBeGreaterThan(0);
    });
  });

  describe('Maximize Benefit Calculation', () => {
    it('should calculate optimal retirement investment amounts', () => {
      const input: TaxpayerInput = {
        ...getDefaultInput(),
        annualSalary: 1000000,
        providentFundContribution: 50000, // Already contributing to PVD
      };

      const optimal = calculateMaximizeBenefit(input, rules);

      // Max deduction: 30% of 1M = 300,000
      // Already using: 50,000 (PVD)
      // Remaining: 250,000

      // Should fill SSF first (up to 200,000 cap)
      expect(optimal.optimalSsf).toBeLessThanOrEqual(200000);

      // Then pension insurance (up to 150,000 cap at 15%)
      expect(optimal.optimalPensionInsurance).toBeLessThanOrEqual(150000);

      // RMF takes the rest
      expect(optimal.optimalRmf + optimal.optimalSsf + optimal.optimalPensionInsurance).toBe(250000);

      // Should save some tax
      expect(optimal.taxSaved).toBeGreaterThan(0);
    });

    it('should respect all limits when maximizing', () => {
      const input: TaxpayerInput = {
        ...getDefaultInput(),
        annualSalary: 2000000,
      };

      const optimal = calculateMaximizeBenefit(input, rules);

      // Combined should not exceed 500,000 (absolute cap since 30% of 2M = 600K)
      expect(
        optimal.optimalRmf + optimal.optimalSsf + optimal.optimalPensionInsurance
      ).toBeLessThanOrEqual(500000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero income gracefully', () => {
      const input: TaxpayerInput = getDefaultInput();
      const result = calculateTax(input, rules);

      expect(result.grossIncome).toBe(0);
      expect(result.taxBeforeCredits).toBe(0);
      expect(result.effectiveTaxRate).toBe(0);
      expect(result.taxableIncome).toBe(0);
    });

    it('should handle very high income', () => {
      const input: TaxpayerInput = {
        ...getDefaultInput(),
        annualSalary: 10000000, // 10 million
      };

      const result = calculateTax(input, rules);

      // With 10M salary, taxable income after basic deductions should exceed 5M
      // Personal deduction (60k) + expense (100k) = 160k deduction
      // Taxable: 10M - 160k = ~9.84M which is in 35% bracket
      expect(result.taxableIncome).toBeGreaterThan(5000000);
      expect(result.marginalTaxRate).toBe(0.35);
    });

    it('should clamp donations at percentage limits', () => {
      const input: TaxpayerInput = {
        ...getDefaultInput(),
        annualSalary: 1000000,
        educationDonation: 50000, // Would be 100k after 2x multiplier
        generalDonation: 50000,
      };

      const result = calculateTax(input, rules);

      // Education donation (2x multiplier) is capped at 10% of net income before donations
      // Net income after expense: 1M - 100k = 900k
      // After personal allowance (60k): 840k
      // 10% of 840k = 84k - so 100k (2x50k) would be capped
      expect(result.deductions.donations.education.effective).toBeLessThanOrEqual(
        result.netIncomeAfterExpense * 0.1
      );
    });
  });
});
