'use client';

import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { Card, Input, Toggle } from '@/components/ui';
import type { TaxpayerInputForm } from '@/lib/validation';
import { createNumberChangeHandler, type WithFieldChange } from '@/lib/forms';

interface PersonalAllowanceFormProps extends WithFieldChange<TaxpayerInputForm> {
  register: UseFormRegister<TaxpayerInputForm>;
  errors: FieldErrors<TaxpayerInputForm>;
  watch: UseFormWatch<TaxpayerInputForm>;
  setValue: (name: keyof TaxpayerInputForm, value: number | boolean) => void;
}

export function PersonalAllowanceForm({
  register,
  errors,
  watch,
  setValue,
  onFieldChange,
}: PersonalAllowanceFormProps) {
  const hasSpouse = watch('hasSpouse');
  const numberOfChildren = watch('numberOfChildren');

  const handleChange = createNumberChangeHandler<TaxpayerInputForm>(onFieldChange);

  return (
    <Card title="ค่าลดหย่อนส่วนตัว" subtitle="สถานะครอบครัวและผู้อยู่ในอุปการะ">
      <div className="space-y-4">
        <Toggle
          label="มีคู่สมรส"
          description="สมรสถูกต้องตามกฎหมาย"
          checked={hasSpouse}
          onChange={(checked) => {
            // setValue already syncs to calculator via setValueWithSync
            setValue('hasSpouse', checked);
            if (!checked) {
              setValue('spouseHasIncome', false);
              setValue('spouseLifeInsurance', 0);
            }
          }}
        />

        {hasSpouse && (
          <Toggle
            label="คู่สมรสมีรายได้"
            description="หากคู่สมรสไม่มีรายได้ สามารถหักลดหย่อนได้ 60,000 บาท"
            checked={watch('spouseHasIncome')}
            onChange={(checked) => {
              // setValue already syncs to calculator via setValueWithSync
              setValue('spouseHasIncome', checked);
            }}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="จำนวนบุตร"
            type="number"
            min={0}
            {...register('numberOfChildren', { onChange: handleChange('numberOfChildren') })}
            error={errors.numberOfChildren?.message}
            hint="ลดหย่อนได้คนละ 30,000 บาท"
          />

          <Input
            label="บุตรเกิดตั้งแต่ปี 2561"
            type="number"
            min={0}
            max={numberOfChildren}
            {...register('childrenBornFrom2018', { onChange: handleChange('childrenBornFrom2018') })}
            error={errors.childrenBornFrom2018?.message}
            hint="ลดหย่อนเพิ่ม 30,000 บาท/คน"
          />
        </div>

        <Input
          label="จำนวนบิดามารดาที่อุปการะ"
          type="number"
          min={0}
          max={4}
          {...register('numberOfParents', { onChange: handleChange('numberOfParents') })}
          error={errors.numberOfParents?.message}
          hint="อายุ 60 ปีขึ้นไป รายได้ไม่เกิน 30,000 บาท/ปี (ไม่เกิน 4 คน)"
        />

        <Input
          label="จำนวนผู้พิการ/ทุพพลภาพที่อุปการะ"
          type="number"
          min={0}
          {...register('numberOfDisabledDependents', { onChange: handleChange('numberOfDisabledDependents') })}
          error={errors.numberOfDisabledDependents?.message}
          hint="ลดหย่อนได้คนละ 60,000 บาท"
        />
      </div>
    </Card>
  );
}
