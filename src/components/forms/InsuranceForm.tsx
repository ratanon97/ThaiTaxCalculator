'use client';

import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { Card, Input, ProgressBar } from '@/components/ui';
import type { TaxpayerInputForm } from '@/lib/validation';
import type { TaxRulesConfig } from '@/types/tax';
import { createNumberChangeHandler, type WithFieldChange } from '@/lib/forms';

interface InsuranceFormProps extends WithFieldChange<TaxpayerInputForm> {
  register: UseFormRegister<TaxpayerInputForm>;
  errors: FieldErrors<TaxpayerInputForm>;
  watch: UseFormWatch<TaxpayerInputForm>;
  rules: TaxRulesConfig;
}

export function InsuranceForm({ register, errors, watch, rules, onFieldChange }: InsuranceFormProps) {
  const hasSpouse = watch('hasSpouse');
  const spouseHasIncome = watch('spouseHasIncome');
  const lifeInsurance = watch('lifeInsurance') || 0;
  const spouseLifeInsurance = watch('spouseLifeInsurance') || 0;
  const healthInsurance = watch('healthInsurance') || 0;
  const parentHealthInsurance = watch('parentHealthInsurance') || 0;
  const socialSecurity = watch('socialSecurity') || 0;

  const { lifeInsurance: lifeRules, healthInsurance: healthRules, parentHealthInsurance: parentRules, socialSecurity: ssRules } = rules.deductionBuckets;

  // Calculate effective amounts and remaining capacity
  const lifeEffective = Math.min(lifeInsurance, lifeRules.absoluteLimit);
  const spouseEffective = hasSpouse && !spouseHasIncome
    ? Math.min(spouseLifeInsurance, lifeRules.spouseLimit || 10000)
    : 0;
  const totalLifeEffective = lifeEffective + spouseEffective;

  // Health insurance combined limit with life insurance
  const combinedLimit = 'combinedWithLifeInsurance' in healthRules ? healthRules.combinedWithLifeInsurance.combinedLimit : 100000;
  const remainingCombined = Math.max(0, combinedLimit - lifeEffective);
  const healthEffective = Math.min(healthInsurance, healthRules.absoluteLimit, remainingCombined);

  const handleChange = createNumberChangeHandler<TaxpayerInputForm>(onFieldChange);

  return (
    <Card title="ประกันภัย" subtitle="เบี้ยประกันที่ลดหย่อนภาษีได้">
      <div className="space-y-6">
        {/* Life Insurance Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">ประกันชีวิต</h4>

          <Input
            label="เบี้ยประกันชีวิตตนเอง"
            placeholder="0"
            suffix="บาท"
            type="number"
            {...register('lifeInsurance', { onChange: handleChange('lifeInsurance') })}
            error={errors.lifeInsurance?.message}
            hint={`สูงสุด ${lifeRules.absoluteLimit.toLocaleString()} บาท`}
          />

          <ProgressBar
            value={lifeEffective}
            max={lifeRules.absoluteLimit}
            color={lifeEffective >= lifeRules.absoluteLimit ? 'green' : 'blue'}
            showValues
          />

          {hasSpouse && !spouseHasIncome && (
            <>
              <Input
                label="เบี้ยประกันชีวิตคู่สมรส"
                placeholder="0"
                suffix="บาท"
                type="number"
                {...register('spouseLifeInsurance', { onChange: handleChange('spouseLifeInsurance') })}
                error={errors.spouseLifeInsurance?.message}
                hint={`สูงสุด ${(lifeRules.spouseLimit || 10000).toLocaleString()} บาท`}
              />
              <ProgressBar
                value={spouseEffective}
                max={lifeRules.spouseLimit || 10000}
                color={spouseEffective >= (lifeRules.spouseLimit || 10000) ? 'green' : 'blue'}
                showValues
              />
            </>
          )}
        </div>

        {/* Health Insurance Section */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900">ประกันสุขภาพ</h4>

          <Input
            label="เบี้ยประกันสุขภาพตนเอง"
            placeholder="0"
            suffix="บาท"
            type="number"
            {...register('healthInsurance', { onChange: handleChange('healthInsurance') })}
            error={errors.healthInsurance?.message}
            hint={`สูงสุด ${healthRules.absoluteLimit.toLocaleString()} บาท (รวมประกันชีวิตไม่เกิน ${combinedLimit.toLocaleString()} บาท)`}
          />

          <ProgressBar
            value={healthEffective}
            max={healthRules.absoluteLimit}
            color={healthEffective >= healthRules.absoluteLimit ? 'green' : 'blue'}
            showValues
          />

          {remainingCombined < healthRules.absoluteLimit && healthInsurance > 0 && (
            <p className="text-xs text-amber-600">
              เหลือสิทธิ์จากเพดานรวมประกันชีวิต+สุขภาพ: {remainingCombined.toLocaleString()} บาท
            </p>
          )}

          <Input
            label="เบี้ยประกันสุขภาพบิดามารดา"
            placeholder="0"
            suffix="บาท"
            type="number"
            {...register('parentHealthInsurance', { onChange: handleChange('parentHealthInsurance') })}
            error={errors.parentHealthInsurance?.message}
            hint={`สูงสุด ${parentRules.absoluteLimit.toLocaleString()} บาท`}
          />

          <ProgressBar
            value={Math.min(parentHealthInsurance, parentRules.absoluteLimit)}
            max={parentRules.absoluteLimit}
            color={parentHealthInsurance >= parentRules.absoluteLimit ? 'green' : 'blue'}
            showValues
          />
        </div>

        {/* Social Security Section */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900">ประกันสังคม</h4>

          <Input
            label="เงินสมทบประกันสังคม"
            placeholder="0"
            suffix="บาท"
            type="number"
            {...register('socialSecurity', { onChange: handleChange('socialSecurity') })}
            error={errors.socialSecurity?.message}
            hint={`สูงสุด ${ssRules.absoluteLimit.toLocaleString()} บาท (750 บาท/เดือน)`}
          />

          <ProgressBar
            value={Math.min(socialSecurity, ssRules.absoluteLimit)}
            max={ssRules.absoluteLimit}
            color={socialSecurity >= ssRules.absoluteLimit ? 'green' : 'blue'}
            showValues
          />
        </div>
      </div>
    </Card>
  );
}
