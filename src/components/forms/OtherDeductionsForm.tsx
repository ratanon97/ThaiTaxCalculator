'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Card, Input } from '@/components/ui';
import type { TaxpayerInputForm } from '@/lib/validation';
import type { TaxRulesConfig } from '@/types/tax';
import { createNumberChangeHandler, type WithFieldChange } from '@/lib/forms';

interface OtherDeductionsFormProps extends WithFieldChange<TaxpayerInputForm> {
  register: UseFormRegister<TaxpayerInputForm>;
  errors: FieldErrors<TaxpayerInputForm>;
  rules: TaxRulesConfig;
}

export function OtherDeductionsForm({ register, errors, rules, onFieldChange }: OtherDeductionsFormProps) {
  const { homeLoanInterest, easyEReceipt } = rules.otherDeductions;
  const { education, general, politicalParty } = rules.donations;

  const handleChange = createNumberChangeHandler<TaxpayerInputForm>(onFieldChange);

  return (
    <Card title="ค่าลดหย่อนอื่นๆ" subtitle="ดอกเบี้ยบ้าน, เงินบริจาค และอื่นๆ">
      <div className="space-y-6">
        {/* Home Loan Interest */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">ดอกเบี้ยเงินกู้ยืม</h4>
          <Input
            label="ดอกเบี้ยเงินกู้ซื้อบ้าน"
            placeholder="0"
            suffix="บาท"
            type="number"
            {...register('homeLoanInterest', { onChange: handleChange('homeLoanInterest') })}
            error={errors.homeLoanInterest?.message}
            hint={`สูงสุด ${homeLoanInterest.absoluteLimit.toLocaleString()} บาท`}
          />
        </div>

        {/* Easy E-Receipt */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900">ช้อปดีมีคืน</h4>
          <Input
            label="Easy E-Receipt"
            placeholder="0"
            suffix="บาท"
            type="number"
            {...register('easyEReceipt', { onChange: handleChange('easyEReceipt') })}
            error={errors.easyEReceipt?.message}
            hint={`สูงสุด ${easyEReceipt.absoluteLimit.toLocaleString()} บาท (ต้องมีใบกำกับภาษีอิเล็กทรอนิกส์)`}
          />
        </div>

        {/* Donations */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900">เงินบริจาค</h4>

          <Input
            label="เงินบริจาคเพื่อการศึกษา/กีฬา"
            placeholder="0"
            suffix="บาท"
            type="number"
            {...register('educationDonation', { onChange: handleChange('educationDonation') })}
            error={errors.educationDonation?.message}
            hint={`หักได้ 2 เท่า แต่ไม่เกิน ${(education.maxPercentOfNetIncome * 100).toFixed(0)}% ของเงินได้หลังหักค่าใช้จ่าย`}
          />

          <Input
            label="เงินบริจาคทั่วไป"
            placeholder="0"
            suffix="บาท"
            type="number"
            {...register('generalDonation', { onChange: handleChange('generalDonation') })}
            error={errors.generalDonation?.message}
            hint={`หักได้ตามจริง แต่ไม่เกิน ${(general.maxPercentOfNetIncome * 100).toFixed(0)}% ของเงินได้หลังหักค่าใช้จ่าย`}
          />

          <Input
            label="เงินบริจาคพรรคการเมือง"
            placeholder="0"
            suffix="บาท"
            type="number"
            {...register('politicalDonation', { onChange: handleChange('politicalDonation') })}
            error={errors.politicalDonation?.message}
            hint={`สูงสุด ${politicalParty.absoluteLimit.toLocaleString()} บาท`}
          />
        </div>
      </div>
    </Card>
  );
}
