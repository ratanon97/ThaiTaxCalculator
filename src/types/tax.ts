// Tax Rules Configuration Types
export interface TaxRulesConfig {
  taxYear: number;
  yearLabel: string;
  effectiveFrom: string;
  effectiveTo: string;
  incomeRules: IncomeRules;
  personalAllowances: PersonalAllowances;
  deductionBuckets: DeductionBuckets;
  otherDeductions: OtherDeductions;
  donations: DonationRules;
  taxBrackets: TaxBracket[];
  withholdingTax: WithholdingTaxInfo;
}

export interface IncomeRules {
  employmentExpenseDeduction: {
    rate: number;
    maxAmount: number;
    description: string;
  };
}

export interface PersonalAllowances {
  self: AllowanceItem;
  spouse: AllowanceItem & { conditions: string[] };
  child: ChildAllowance;
  parentCare: ParentCareAllowance;
  disabledCare: AllowanceItem;
}

export interface AllowanceItem {
  amount?: number;
  amountPerPerson?: number;
  description: string;
}

export interface ChildAllowance {
  amountPerChild: number;
  additionalFor2018Onwards: number;
  maxChildren: number | null;
  description: string;
}

export interface ParentCareAllowance {
  amountPerParent: number;
  maxParents: number;
  description: string;
  conditions: string[];
}

export interface DeductionBuckets {
  retirement: RetirementBucket;
  lifeInsurance: InsuranceBucket;
  healthInsurance: HealthInsuranceBucket;
  parentHealthInsurance: InsuranceBucket;
  socialSecurity: InsuranceBucket;
}

export interface RetirementBucket {
  type: 'combined';
  description: string;
  percentageLimit: {
    rate: number;
    baseDescription: string;
  };
  absoluteLimit: {
    amount: number;
    description: string;
  };
  components: RetirementComponents;
}

export interface RetirementComponents {
  providentFund: RetirementComponent;
  governmentPensionFund: RetirementComponent;
  rmf: RetirementComponent;
  ssf: RetirementComponent;
  pensionInsurance: RetirementComponent;
  nsf: RetirementComponent;
}

export interface RetirementComponent {
  id: string;
  name: string;
  nameShort: string;
  individualCap: number | null;
  percentageOfSalaryCap?: number;
  description: string;
}

export interface InsuranceBucket {
  type: 'individual';
  id: string;
  name: string;
  description: string;
  absoluteLimit: number;
  spouseLimit?: number;
  spouseCondition?: string;
  notes?: string;
  conditions?: string[];
}

export interface HealthInsuranceBucket extends InsuranceBucket {
  combinedWithLifeInsurance: {
    enabled: boolean;
    combinedLimit: number;
    description: string;
  };
}

export interface OtherDeductions {
  homeLoanInterest: OtherDeductionItem;
  easyEReceipt: OtherDeductionItem;
}

export interface OtherDeductionItem {
  id: string;
  name: string;
  absoluteLimit: number;
  description: string;
  conditions?: string[];
  temporaryMeasure?: boolean;
}

export interface DonationRules {
  education: DonationItem;
  general: DonationItem;
  politicalParty: PoliticalDonationItem;
}

export interface DonationItem {
  id: string;
  name: string;
  multiplier: number;
  maxPercentOfNetIncome: number;
  description: string;
}

export interface PoliticalDonationItem {
  id: string;
  name: string;
  absoluteLimit: number;
  description: string;
}

export interface TaxBracket {
  minIncome: number;
  maxIncome: number | null;
  rate: number;
  description: string;
}

export interface WithholdingTaxInfo {
  description: string;
  calculationMethod: string;
  notes: string;
}

// User Input Types
export interface TaxpayerInput {
  // Income
  annualSalary: number;
  otherIncome: number;
  bonus: number;

  // Personal status
  hasSpouse: boolean;
  spouseHasIncome: boolean;
  numberOfChildren: number;
  childrenBornFrom2018: number;
  numberOfParents: number;
  numberOfDisabledDependents: number;

  // Retirement deductions
  providentFundContribution: number;
  governmentPensionFund: number;
  rmfInvestment: number;
  ssfInvestment: number;
  pensionInsurance: number;
  nsfContribution: number;

  // Insurance
  lifeInsurance: number;
  spouseLifeInsurance: number;
  healthInsurance: number;
  parentHealthInsurance: number;
  socialSecurity: number;

  // Other deductions
  homeLoanInterest: number;
  easyEReceipt: number;

  // Donations
  educationDonation: number;
  generalDonation: number;
  politicalDonation: number;

  // Withholding tax already paid
  withholdingTaxPaid: number;
}

// Calculation Result Types
export interface BucketCalculation {
  bucketId: string;
  bucketName: string;
  inputAmount: number;
  effectiveDeduction: number;
  cappedAmount: number;
  remainingCapacity: number;
  monthlyRemainingCapacity: number;
  bindingConstraint: 'percentage' | 'absolute' | 'individual' | 'combined' | 'none';
  constraintExplanation: string;
  isAtLimit: boolean;
  components?: ComponentCalculation[];
}

export interface ComponentCalculation {
  componentId: string;
  componentName: string;
  inputAmount: number;
  effectiveAmount: number;
  individualCap: number | null;
  isAtIndividualLimit: boolean;
}

export interface RetirementBucketSummary {
  totalInput: number;
  totalEffectiveDeduction: number;
  percentageLimit: number;
  absoluteLimit: number;
  bindingLimit: number;
  bindingConstraint: 'percentage' | 'absolute';
  remainingCapacity: number;
  monthlyRemainingCapacity: number;
  constraintExplanation: string;
  maxRetirementDeduction: number;
  components: ComponentCalculation[];
}

export interface DeductionSummary {
  retirement: RetirementBucketSummary;
  lifeInsurance: BucketCalculation;
  healthInsurance: BucketCalculation;
  parentHealthInsurance: BucketCalculation;
  socialSecurity: BucketCalculation;
  otherDeductions: {
    homeLoanInterest: number;
    easyEReceipt: number;
    total: number;
  };
  donations: {
    education: { input: number; effective: number; capped: number };
    general: { input: number; effective: number; capped: number };
    political: { input: number; effective: number };
    total: number;
  };
  totalDeductions: number;
}

export interface TaxBracketCalculation {
  bracket: TaxBracket;
  taxableInBracket: number;
  taxInBracket: number;
  cumulativeTax: number;
}

export interface TaxCalculationResult {
  // Income breakdown
  grossIncome: number;
  employmentExpenseDeduction: number;
  netIncomeAfterExpense: number;

  // Allowances
  personalAllowances: {
    self: number;
    spouse: number;
    children: number;
    parents: number;
    disabled: number;
    total: number;
  };

  // Deductions summary
  deductions: DeductionSummary;

  // Taxable income
  taxableIncome: number;

  // Tax calculation
  taxBeforeCredits: number;
  bracketBreakdown: TaxBracketCalculation[];

  // Final amounts
  withholdingTaxPaid: number;
  finalTaxPayable: number;
  refundAmount: number;
  isRefund: boolean;

  // Impact metrics
  effectiveTaxRate: number;
  marginalTaxRate: number;
}

// Simulation Types
export interface SimulationScenario {
  rmfAmount: number;
  ssfAmount: number;
  pensionInsuranceAmount: number;
}

export interface SimulationResult {
  scenario: SimulationScenario;
  taxCalculation: TaxCalculationResult;
  taxReduction: number;
  additionalRefund: number;
  comparedToBaseline: {
    taxDifference: number;
    refundDifference: number;
  };
}

// Preset Types
export interface SalaryPreset {
  label: string;
  percentage: number;
}

// Explanation Types
export interface TaxExplanation {
  sections: ExplanationSection[];
}

export interface ExplanationSection {
  title: string;
  content: string;
  details?: string[];
  highlight?: boolean;
}
