import type {
  TaxRulesConfig,
  TaxpayerInput,
  TaxCalculationResult,
  TaxBracketCalculation,
  RetirementBucketSummary,
  BucketCalculation,
  ComponentCalculation,
  DeductionSummary,
} from '@/types/tax';

/**
 * Pure tax calculation engine for Thai personal income tax
 * All calculations are deterministic and side-effect free
 */

// ============================================================================
// INCOME CALCULATIONS
// ============================================================================

export function calculateGrossIncome(input: TaxpayerInput): number {
  return input.annualSalary + input.otherIncome + input.bonus;
}

export function calculateEmploymentExpenseDeduction(
  grossIncome: number,
  rules: TaxRulesConfig
): number {
  const { rate, maxAmount } = rules.incomeRules.employmentExpenseDeduction;
  return Math.min(grossIncome * rate, maxAmount);
}

export function calculateNetIncomeAfterExpense(
  grossIncome: number,
  rules: TaxRulesConfig
): number {
  const expenseDeduction = calculateEmploymentExpenseDeduction(grossIncome, rules);
  return grossIncome - expenseDeduction;
}

// ============================================================================
// PERSONAL ALLOWANCES
// ============================================================================

export function calculatePersonalAllowances(
  input: TaxpayerInput,
  rules: TaxRulesConfig
): {
  self: number;
  spouse: number;
  children: number;
  parents: number;
  disabled: number;
  total: number;
} {
  const { personalAllowances } = rules;

  const self = personalAllowances.self.amount ?? 0;

  // Spouse allowance only if spouse has no income
  const spouse = input.hasSpouse && !input.spouseHasIncome
    ? (personalAllowances.spouse.amount ?? 0)
    : 0;

  // Child allowance: base amount + additional for children born from 2018
  const regularChildren = Math.max(0, input.numberOfChildren - input.childrenBornFrom2018);
  const post2018Children = input.childrenBornFrom2018;

  const children =
    regularChildren * personalAllowances.child.amountPerChild +
    post2018Children * (personalAllowances.child.amountPerChild + personalAllowances.child.additionalFor2018Onwards);

  // Parent care allowance (max 4 parents - own parents + spouse's parents)
  const parents = Math.min(input.numberOfParents, personalAllowances.parentCare.maxParents)
    * personalAllowances.parentCare.amountPerParent;

  // Disabled dependent allowance
  const disabled = input.numberOfDisabledDependents * (personalAllowances.disabledCare.amountPerPerson ?? 0);

  return {
    self,
    spouse,
    children,
    parents,
    disabled,
    total: self + spouse + children + parents + disabled,
  };
}

// ============================================================================
// RETIREMENT BUCKET CALCULATIONS
// ============================================================================

export function calculateMaxRetirementDeduction(
  eligibleIncome: number,
  rules: TaxRulesConfig
): {
  percentageLimit: number;
  absoluteLimit: number;
  maxDeduction: number;
  bindingConstraint: 'percentage' | 'absolute';
  constraintExplanation: string;
} {
  const { retirement } = rules.deductionBuckets;

  const percentageLimit = eligibleIncome * retirement.percentageLimit.rate;
  const absoluteLimit = retirement.absoluteLimit.amount;
  const maxDeduction = Math.min(percentageLimit, absoluteLimit);
  const bindingConstraint = percentageLimit <= absoluteLimit ? 'percentage' : 'absolute';

  const constraintExplanation = bindingConstraint === 'percentage'
    ? `จำกัดที่ ${(retirement.percentageLimit.rate * 100).toFixed(0)}% ของเงินได้ (${formatCurrency(percentageLimit)} บาท) เนื่องจากต่ำกว่าเพดาน ${formatCurrency(absoluteLimit)} บาท`
    : `จำกัดที่ ${formatCurrency(absoluteLimit)} บาท เนื่องจากต่ำกว่า ${(retirement.percentageLimit.rate * 100).toFixed(0)}% ของเงินได้ (${formatCurrency(percentageLimit)} บาท)`;

  return {
    percentageLimit,
    absoluteLimit,
    maxDeduction,
    bindingConstraint,
    constraintExplanation,
  };
}

export function calculateRetirementBucket(
  input: TaxpayerInput,
  eligibleIncome: number,
  rules: TaxRulesConfig
): RetirementBucketSummary {
  const { retirement } = rules.deductionBuckets;
  const maxCalc = calculateMaxRetirementDeduction(eligibleIncome, rules);

  // Calculate individual component limits and effective amounts
  const components: ComponentCalculation[] = [];

  // Provident Fund (PVD)
  const pvdCap = input.annualSalary * (retirement.components.providentFund.percentageOfSalaryCap || 0.15);
  const pvdEffective = Math.min(input.providentFundContribution, pvdCap);
  components.push({
    componentId: retirement.components.providentFund.id,
    componentName: retirement.components.providentFund.name,
    inputAmount: input.providentFundContribution,
    effectiveAmount: pvdEffective,
    individualCap: pvdCap,
    isAtIndividualLimit: input.providentFundContribution >= pvdCap,
  });

  // Government Pension Fund (GPF)
  const gpfCap = input.annualSalary * (retirement.components.governmentPensionFund.percentageOfSalaryCap || 0.15);
  const gpfEffective = Math.min(input.governmentPensionFund, gpfCap);
  components.push({
    componentId: retirement.components.governmentPensionFund.id,
    componentName: retirement.components.governmentPensionFund.name,
    inputAmount: input.governmentPensionFund,
    effectiveAmount: gpfEffective,
    individualCap: gpfCap,
    isAtIndividualLimit: input.governmentPensionFund >= gpfCap,
  });

  // RMF
  const rmfPercentageCap = eligibleIncome * (retirement.components.rmf.percentageOfSalaryCap || 0.30);
  const rmfCap = retirement.components.rmf.individualCap
    ? Math.min(rmfPercentageCap, retirement.components.rmf.individualCap)
    : rmfPercentageCap;
  const rmfEffective = Math.min(input.rmfInvestment, rmfCap);
  components.push({
    componentId: retirement.components.rmf.id,
    componentName: retirement.components.rmf.name,
    inputAmount: input.rmfInvestment,
    effectiveAmount: rmfEffective,
    individualCap: rmfCap,
    isAtIndividualLimit: input.rmfInvestment >= rmfCap,
  });

  // SSF
  const ssfPercentageCap = eligibleIncome * (retirement.components.ssf.percentageOfSalaryCap || 0.30);
  const ssfIndividualCap = retirement.components.ssf.individualCap || 200000;
  const ssfCap = Math.min(ssfPercentageCap, ssfIndividualCap);
  const ssfEffective = Math.min(input.ssfInvestment, ssfCap);
  components.push({
    componentId: retirement.components.ssf.id,
    componentName: retirement.components.ssf.name,
    inputAmount: input.ssfInvestment,
    effectiveAmount: ssfEffective,
    individualCap: ssfCap,
    isAtIndividualLimit: input.ssfInvestment >= ssfCap,
  });

  // Pension Insurance
  const pensionPercentageCap = eligibleIncome * (retirement.components.pensionInsurance.percentageOfSalaryCap || 0.15);
  const pensionIndividualCap = retirement.components.pensionInsurance.individualCap || 200000;
  const pensionCap = Math.min(pensionPercentageCap, pensionIndividualCap);
  const pensionEffective = Math.min(input.pensionInsurance, pensionCap);
  components.push({
    componentId: retirement.components.pensionInsurance.id,
    componentName: retirement.components.pensionInsurance.name,
    inputAmount: input.pensionInsurance,
    effectiveAmount: pensionEffective,
    individualCap: pensionCap,
    isAtIndividualLimit: input.pensionInsurance >= pensionCap,
  });

  // NSF
  const nsfCap = retirement.components.nsf.individualCap || 30000;
  const nsfEffective = Math.min(input.nsfContribution, nsfCap);
  components.push({
    componentId: retirement.components.nsf.id,
    componentName: retirement.components.nsf.name,
    inputAmount: input.nsfContribution,
    effectiveAmount: nsfEffective,
    individualCap: nsfCap,
    isAtIndividualLimit: input.nsfContribution >= nsfCap,
  });

  // Calculate total effective deduction (clamped to combined limit)
  const totalComponentEffective = components.reduce((sum, c) => sum + c.effectiveAmount, 0);
  const totalEffectiveDeduction = Math.min(totalComponentEffective, maxCalc.maxDeduction);

  // Calculate remaining capacity
  const remainingCapacity = Math.max(0, maxCalc.maxDeduction - totalEffectiveDeduction);

  return {
    totalInput: components.reduce((sum, c) => sum + c.inputAmount, 0),
    totalEffectiveDeduction,
    percentageLimit: maxCalc.percentageLimit,
    absoluteLimit: maxCalc.absoluteLimit,
    bindingLimit: maxCalc.maxDeduction,
    bindingConstraint: maxCalc.bindingConstraint,
    remainingCapacity,
    monthlyRemainingCapacity: remainingCapacity / 12,
    constraintExplanation: maxCalc.constraintExplanation,
    maxRetirementDeduction: maxCalc.maxDeduction,
    components,
  };
}

// ============================================================================
// INSURANCE BUCKET CALCULATIONS
// ============================================================================

export function calculateLifeInsuranceBucket(
  input: TaxpayerInput,
  rules: TaxRulesConfig
): BucketCalculation {
  const { lifeInsurance } = rules.deductionBuckets;

  // Self life insurance
  const selfEffective = Math.min(input.lifeInsurance, lifeInsurance.absoluteLimit);

  // Spouse life insurance (only if spouse has no income)
  const spouseLimit = lifeInsurance.spouseLimit || 10000;
  const spouseEffective = input.hasSpouse && !input.spouseHasIncome
    ? Math.min(input.spouseLifeInsurance, spouseLimit)
    : 0;

  const totalEffective = selfEffective + spouseEffective;
  const totalCap = lifeInsurance.absoluteLimit + (input.hasSpouse && !input.spouseHasIncome ? spouseLimit : 0);
  const remainingCapacity = Math.max(0, totalCap - totalEffective);

  return {
    bucketId: lifeInsurance.id,
    bucketName: lifeInsurance.name,
    inputAmount: input.lifeInsurance + input.spouseLifeInsurance,
    effectiveDeduction: totalEffective,
    cappedAmount: totalCap,
    remainingCapacity,
    monthlyRemainingCapacity: remainingCapacity / 12,
    bindingConstraint: totalEffective >= totalCap ? 'absolute' : 'none',
    constraintExplanation: `เบี้ยประกันชีวิตตนเองไม่เกิน ${formatCurrency(lifeInsurance.absoluteLimit)} บาท${input.hasSpouse && !input.spouseHasIncome ? ` และคู่สมรสไม่เกิน ${formatCurrency(spouseLimit)} บาท` : ''}`,
    isAtLimit: totalEffective >= totalCap,
  };
}

export function calculateHealthInsuranceBucket(
  input: TaxpayerInput,
  lifeInsuranceEffective: number,
  rules: TaxRulesConfig
): BucketCalculation {
  const { healthInsurance, lifeInsurance } = rules.deductionBuckets;

  // Health insurance has its own cap of 25,000
  const healthCap = healthInsurance.absoluteLimit;
  let effectiveHealth = Math.min(input.healthInsurance, healthCap);

  // Combined limit with life insurance (100,000 total)
  if ('combinedWithLifeInsurance' in healthInsurance && healthInsurance.combinedWithLifeInsurance.enabled) {
    const combinedLimit = healthInsurance.combinedWithLifeInsurance.combinedLimit;
    const lifeUsed = Math.min(lifeInsuranceEffective, lifeInsurance.absoluteLimit);
    const remainingCombined = Math.max(0, combinedLimit - lifeUsed);
    effectiveHealth = Math.min(effectiveHealth, remainingCombined);
  }

  const remainingCapacity = Math.max(0, healthCap - effectiveHealth);
  const bindingConstraint = effectiveHealth < input.healthInsurance ? 'combined' :
                           effectiveHealth >= healthCap ? 'absolute' : 'none';

  return {
    bucketId: healthInsurance.id,
    bucketName: healthInsurance.name,
    inputAmount: input.healthInsurance,
    effectiveDeduction: effectiveHealth,
    cappedAmount: healthCap,
    remainingCapacity,
    monthlyRemainingCapacity: remainingCapacity / 12,
    bindingConstraint,
    constraintExplanation: `เบี้ยประกันสุขภาพไม่เกิน ${formatCurrency(healthCap)} บาท และรวมกับประกันชีวิตไม่เกิน ${formatCurrency(100000)} บาท`,
    isAtLimit: bindingConstraint !== 'none',
  };
}

export function calculateParentHealthInsuranceBucket(
  input: TaxpayerInput,
  rules: TaxRulesConfig
): BucketCalculation {
  const { parentHealthInsurance } = rules.deductionBuckets;
  const cap = parentHealthInsurance.absoluteLimit;
  const effective = Math.min(input.parentHealthInsurance, cap);
  const remainingCapacity = Math.max(0, cap - effective);

  return {
    bucketId: parentHealthInsurance.id,
    bucketName: parentHealthInsurance.name,
    inputAmount: input.parentHealthInsurance,
    effectiveDeduction: effective,
    cappedAmount: cap,
    remainingCapacity,
    monthlyRemainingCapacity: remainingCapacity / 12,
    bindingConstraint: effective >= cap ? 'absolute' : 'none',
    constraintExplanation: `เบี้ยประกันสุขภาพบิดามารดาไม่เกิน ${formatCurrency(cap)} บาท`,
    isAtLimit: effective >= cap,
  };
}

export function calculateSocialSecurityBucket(
  input: TaxpayerInput,
  rules: TaxRulesConfig
): BucketCalculation {
  const { socialSecurity } = rules.deductionBuckets;
  const cap = socialSecurity.absoluteLimit;
  const effective = Math.min(input.socialSecurity, cap);
  const remainingCapacity = Math.max(0, cap - effective);

  return {
    bucketId: socialSecurity.id,
    bucketName: socialSecurity.name,
    inputAmount: input.socialSecurity,
    effectiveDeduction: effective,
    cappedAmount: cap,
    remainingCapacity,
    monthlyRemainingCapacity: remainingCapacity / 12,
    bindingConstraint: effective >= cap ? 'absolute' : 'none',
    constraintExplanation: `เงินสมทบประกันสังคมไม่เกิน ${formatCurrency(cap)} บาท (750 บาท/เดือน)`,
    isAtLimit: effective >= cap,
  };
}

// ============================================================================
// DONATION CALCULATIONS
// ============================================================================

export function calculateDonations(
  input: TaxpayerInput,
  netIncomeAfterDeductions: number,
  rules: TaxRulesConfig
): {
  education: { input: number; effective: number; capped: number };
  general: { input: number; effective: number; capped: number };
  political: { input: number; effective: number };
  total: number;
} {
  const { donations } = rules;

  // Handle edge case of zero or negative net income
  const safeNetIncome = Math.max(0, netIncomeAfterDeductions);

  // Education donation (2x multiplier, max 10% of net income)
  const eduMultiplied = input.educationDonation * donations.education.multiplier;
  const eduCap = safeNetIncome * donations.education.maxPercentOfNetIncome;
  const eduEffective = Math.min(eduMultiplied, eduCap);

  // General donation (1x, max 10% of remaining net income after education donation)
  const remainingAfterEdu = Math.max(0, safeNetIncome - eduEffective);
  const generalCap = remainingAfterEdu * donations.general.maxPercentOfNetIncome;
  const generalEffective = Math.min(input.generalDonation, generalCap);

  // Political donation (fixed cap)
  const politicalEffective = Math.min(input.politicalDonation, donations.politicalParty.absoluteLimit);

  return {
    education: {
      input: input.educationDonation,
      effective: eduEffective,
      capped: eduCap,
    },
    general: {
      input: input.generalDonation,
      effective: generalEffective,
      capped: generalCap,
    },
    political: {
      input: input.politicalDonation,
      effective: politicalEffective,
    },
    total: eduEffective + generalEffective + politicalEffective,
  };
}

// ============================================================================
// TAX BRACKET CALCULATIONS
// ============================================================================

export function calculateProgressiveTax(
  taxableIncome: number,
  rules: TaxRulesConfig
): {
  totalTax: number;
  bracketBreakdown: TaxBracketCalculation[];
  marginalRate: number;
} {
  const { taxBrackets } = rules;
  const bracketBreakdown: TaxBracketCalculation[] = [];
  let totalTax = 0;
  let marginalRate = 0;
  let previousMax = 0;

  for (const bracket of taxBrackets) {
    const bracketMin = bracket.minIncome;
    const bracketMax = bracket.maxIncome ?? Infinity;

    // Calculate the amount of income that falls within this bracket
    // Using simple clamped range method
    if (taxableIncome <= bracketMin) {
      // Income doesn't reach this bracket
      bracketBreakdown.push({
        bracket,
        taxableInBracket: 0,
        taxInBracket: 0,
        cumulativeTax: totalTax,
      });
    } else {
      // Calculate how much income falls in this bracket
      const incomeInBracket = Math.min(taxableIncome, bracketMax) - bracketMin;
      const taxableInBracket = Math.max(0, incomeInBracket);
      const taxInBracket = taxableInBracket * bracket.rate;

      totalTax += taxInBracket;

      if (taxableInBracket > 0) {
        marginalRate = bracket.rate;
      }

      bracketBreakdown.push({
        bracket,
        taxableInBracket,
        taxInBracket,
        cumulativeTax: totalTax,
      });
    }

    previousMax = bracketMax;
  }

  return {
    totalTax,
    bracketBreakdown,
    marginalRate,
  };
}

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

export function calculateTax(
  input: TaxpayerInput,
  rules: TaxRulesConfig
): TaxCalculationResult {
  // Step 1: Calculate gross income
  const grossIncome = calculateGrossIncome(input);

  // Step 2: Calculate employment expense deduction
  const employmentExpenseDeduction = calculateEmploymentExpenseDeduction(grossIncome, rules);
  const netIncomeAfterExpense = grossIncome - employmentExpenseDeduction;

  // Step 3: Calculate personal allowances
  const personalAllowances = calculatePersonalAllowances(input, rules);

  // Step 4: Calculate retirement bucket
  const retirementBucket = calculateRetirementBucket(input, grossIncome, rules);

  // Step 5: Calculate insurance buckets
  const lifeInsuranceBucket = calculateLifeInsuranceBucket(input, rules);
  const healthInsuranceBucket = calculateHealthInsuranceBucket(
    input,
    lifeInsuranceBucket.effectiveDeduction,
    rules
  );
  const parentHealthInsuranceBucket = calculateParentHealthInsuranceBucket(input, rules);
  const socialSecurityBucket = calculateSocialSecurityBucket(input, rules);

  // Step 6: Calculate other deductions
  const homeLoanInterest = Math.min(
    input.homeLoanInterest,
    rules.otherDeductions.homeLoanInterest.absoluteLimit
  );
  const easyEReceipt = Math.min(
    input.easyEReceipt,
    rules.otherDeductions.easyEReceipt.absoluteLimit
  );

  // Step 7: Calculate net income before donations
  const totalDeductionsBeforeDonations =
    personalAllowances.total +
    retirementBucket.totalEffectiveDeduction +
    lifeInsuranceBucket.effectiveDeduction +
    healthInsuranceBucket.effectiveDeduction +
    parentHealthInsuranceBucket.effectiveDeduction +
    socialSecurityBucket.effectiveDeduction +
    homeLoanInterest +
    easyEReceipt;

  const netIncomeBeforeDonations = netIncomeAfterExpense - totalDeductionsBeforeDonations;

  // Step 8: Calculate donations (based on net income before donations)
  const donationCalc = calculateDonations(input, netIncomeBeforeDonations, rules);

  // Step 9: Calculate taxable income
  const totalDeductions = totalDeductionsBeforeDonations + donationCalc.total;
  const taxableIncome = Math.max(0, netIncomeAfterExpense - totalDeductions);

  // Step 10: Calculate progressive tax
  const taxCalc = calculateProgressiveTax(taxableIncome, rules);

  // Step 11: Calculate final payable/refund
  const finalTaxPayable = Math.max(0, taxCalc.totalTax - input.withholdingTaxPaid);
  const refundAmount = Math.max(0, input.withholdingTaxPaid - taxCalc.totalTax);

  // Step 12: Calculate effective tax rate
  const effectiveTaxRate = grossIncome > 0 ? taxCalc.totalTax / grossIncome : 0;

  const deductions: DeductionSummary = {
    retirement: retirementBucket,
    lifeInsurance: lifeInsuranceBucket,
    healthInsurance: healthInsuranceBucket,
    parentHealthInsurance: parentHealthInsuranceBucket,
    socialSecurity: socialSecurityBucket,
    otherDeductions: {
      homeLoanInterest,
      easyEReceipt,
      total: homeLoanInterest + easyEReceipt,
    },
    donations: donationCalc,
    totalDeductions,
  };

  return {
    grossIncome,
    employmentExpenseDeduction,
    netIncomeAfterExpense,
    personalAllowances,
    deductions,
    taxableIncome,
    taxBeforeCredits: taxCalc.totalTax,
    bracketBreakdown: taxCalc.bracketBreakdown,
    withholdingTaxPaid: input.withholdingTaxPaid,
    finalTaxPayable,
    refundAmount,
    isRefund: refundAmount > 0,
    effectiveTaxRate,
    marginalTaxRate: taxCalc.marginalRate,
  };
}

// ============================================================================
// SIMULATION FUNCTIONS
// ============================================================================

export function calculateTaxImpact(
  baselineResult: TaxCalculationResult,
  newResult: TaxCalculationResult
): {
  taxReduction: number;
  additionalRefund: number;
  taxDifference: number;
  refundDifference: number;
} {
  const taxReduction = baselineResult.taxBeforeCredits - newResult.taxBeforeCredits;
  const additionalRefund = newResult.refundAmount - baselineResult.refundAmount;

  return {
    taxReduction,
    additionalRefund,
    taxDifference: baselineResult.finalTaxPayable - newResult.finalTaxPayable,
    refundDifference: additionalRefund,
  };
}

export function calculateMaximizeBenefit(
  input: TaxpayerInput,
  rules: TaxRulesConfig
): {
  optimalRmf: number;
  optimalSsf: number;
  optimalPensionInsurance: number;
  maxDeductionUsed: number;
  taxSaved: number;
} {
  const grossIncome = calculateGrossIncome(input);
  const maxCalc = calculateMaxRetirementDeduction(grossIncome, rules);

  // Calculate current retirement contributions (excluding RMF, SSF, pension insurance)
  const currentFixed =
    input.providentFundContribution +
    input.governmentPensionFund +
    input.nsfContribution;

  const remainingCapacity = Math.max(0, maxCalc.maxDeduction - currentFixed);

  // Calculate individual caps
  const { retirement } = rules.deductionBuckets;
  const ssfCap = Math.min(
    grossIncome * (retirement.components.ssf.percentageOfSalaryCap || 0.30),
    retirement.components.ssf.individualCap || 200000
  );
  const pensionCap = Math.min(
    grossIncome * (retirement.components.pensionInsurance.percentageOfSalaryCap || 0.15),
    retirement.components.pensionInsurance.individualCap || 200000
  );

  // Prioritize filling SSF first (lower cap), then pension insurance, then RMF
  let remaining = remainingCapacity;

  const optimalSsf = Math.min(remaining, ssfCap);
  remaining -= optimalSsf;

  const optimalPensionInsurance = Math.min(remaining, pensionCap);
  remaining -= optimalPensionInsurance;

  const optimalRmf = remaining; // RMF takes the rest (no individual cap except combined limit)

  // Calculate tax saved
  const baselineInput = { ...input };
  const optimizedInput = {
    ...input,
    rmfInvestment: optimalRmf,
    ssfInvestment: optimalSsf,
    pensionInsurance: optimalPensionInsurance,
  };

  const baselineResult = calculateTax(baselineInput, rules);
  const optimizedResult = calculateTax(optimizedInput, rules);

  return {
    optimalRmf,
    optimalSsf,
    optimalPensionInsurance,
    maxDeductionUsed: optimalRmf + optimalSsf + optimalPensionInsurance + currentFixed,
    taxSaved: baselineResult.taxBeforeCredits - optimizedResult.taxBeforeCredits,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH').format(Math.round(amount));
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

export function getDefaultInput(): TaxpayerInput {
  return {
    annualSalary: 0,
    otherIncome: 0,
    bonus: 0,
    hasSpouse: false,
    spouseHasIncome: false,
    numberOfChildren: 0,
    childrenBornFrom2018: 0,
    numberOfParents: 0,
    numberOfDisabledDependents: 0,
    providentFundContribution: 0,
    governmentPensionFund: 0,
    rmfInvestment: 0,
    ssfInvestment: 0,
    pensionInsurance: 0,
    nsfContribution: 0,
    lifeInsurance: 0,
    spouseLifeInsurance: 0,
    healthInsurance: 0,
    parentHealthInsurance: 0,
    socialSecurity: 0,
    homeLoanInterest: 0,
    easyEReceipt: 0,
    educationDonation: 0,
    generalDonation: 0,
    politicalDonation: 0,
    withholdingTaxPaid: 0,
  };
}
