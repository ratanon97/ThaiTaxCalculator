'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Card, Input } from '@/components/ui';
import type { TaxpayerInputForm } from '@/lib/validation';
import { createNumberChangeHandler, type WithFieldChange } from '@/lib/forms';

interface IncomeFormProps extends WithFieldChange<TaxpayerInputForm> {
  register: UseFormRegister<TaxpayerInputForm>;
  errors: FieldErrors<TaxpayerInputForm>;
}

export function IncomeForm({ register, errors, onFieldChange }: IncomeFormProps) {
  const handleChange = createNumberChangeHandler<TaxpayerInputForm>(onFieldChange);

  return (
    <Card title="รายได้" subtitle="กรอกรายได้ประจำปีของคุณ">
      <div className="space-y-4">
        <Input
          label="เงินเดือนรวมทั้งปี (ก่อนหักภาษี)"
          placeholder="0"
          suffix="บาท"
          type="number"
          {...register('annualSalary', { onChange: handleChange('annualSalary') })}
          error={errors.annualSalary?.message}
          hint="รวม 12 เดือน ไม่รวมโบนัส"
        />

        <Input
          label="โบนัส / เงินพิเศษ"
          placeholder="0"
          suffix="บาท"
          type="number"
          {...register('bonus', { onChange: handleChange('bonus') })}
          error={errors.bonus?.message}
        />

        <Input
          label="รายได้อื่น (เงินปันผล, ค่าเช่า ฯลฯ)"
          placeholder="0"
          suffix="บาท"
          type="number"
          {...register('otherIncome', { onChange: handleChange('otherIncome') })}
          error={errors.otherIncome?.message}
          hint="รายได้ที่ต้องนำมารวมคำนวณภาษี"
        />

        <Input
          label="ภาษีหัก ณ ที่จ่าย (ที่หักไปแล้วทั้งปี)"
          placeholder="0"
          suffix="บาท"
          type="number"
          {...register('withholdingTaxPaid', { onChange: handleChange('withholdingTaxPaid') })}
          error={errors.withholdingTaxPaid?.message}
          hint="ดูได้จากสลิปเงินเดือน หรือ หนังสือรับรองการหักภาษี ณ ที่จ่าย"
        />
      </div>
    </Card>
  );
}
