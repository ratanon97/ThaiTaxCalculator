import { z } from 'zod';

const nonNegativeNumber = z.number().min(0, 'ต้องไม่ติดลบ').default(0);
const nonNegativeInt = z.number().int().min(0, 'ต้องไม่ติดลบ').default(0);

export const taxpayerInputSchema = z.object({
  // Income
  annualSalary: nonNegativeNumber,
  otherIncome: nonNegativeNumber,
  bonus: nonNegativeNumber,

  // Personal status
  hasSpouse: z.boolean().default(false),
  spouseHasIncome: z.boolean().default(false),
  numberOfChildren: nonNegativeInt.refine((v) => v <= 20, 'จำนวนบุตรเกินกว่าที่กำหนด'),
  childrenBornFrom2018: nonNegativeInt,
  numberOfParents: nonNegativeInt.refine((v) => v <= 4, 'ไม่เกิน 4 คน'),
  numberOfDisabledDependents: nonNegativeInt.refine((v) => v <= 10, 'จำนวนเกินกว่าที่กำหนด'),

  // Retirement deductions
  providentFundContribution: nonNegativeNumber,
  governmentPensionFund: nonNegativeNumber,
  rmfInvestment: nonNegativeNumber,
  ssfInvestment: nonNegativeNumber,
  pensionInsurance: nonNegativeNumber,
  nsfContribution: nonNegativeNumber,

  // Insurance
  lifeInsurance: nonNegativeNumber,
  spouseLifeInsurance: nonNegativeNumber,
  healthInsurance: nonNegativeNumber,
  parentHealthInsurance: nonNegativeNumber,
  socialSecurity: nonNegativeNumber,

  // Other deductions
  homeLoanInterest: nonNegativeNumber,
  easyEReceipt: nonNegativeNumber,

  // Donations
  educationDonation: nonNegativeNumber,
  generalDonation: nonNegativeNumber,
  politicalDonation: nonNegativeNumber,

  // Withholding tax
  withholdingTaxPaid: nonNegativeNumber,
}).refine(
  (data) => data.childrenBornFrom2018 <= data.numberOfChildren,
  {
    message: 'จำนวนบุตรที่เกิดตั้งแต่ปี 2561 ต้องไม่เกินจำนวนบุตรทั้งหมด',
    path: ['childrenBornFrom2018'],
  }
);

export type TaxpayerInputForm = z.infer<typeof taxpayerInputSchema>;
