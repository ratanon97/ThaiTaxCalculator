'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Slider, Button, ProgressBar, StatCard } from '@/components/ui';
import {
  calculateMaxRetirementDeduction,
  calculateGrossIncome,
  calculateTax,
  calculateMaximizeBenefit,
  formatCurrency,
} from '@/lib/tax';
import type { TaxRulesConfig, TaxpayerInput, RetirementBucketSummary } from '@/types/tax';

interface RetirementSimulatorProps {
  input: TaxpayerInput;
  rules: TaxRulesConfig;
  onUpdate: (updates: Partial<TaxpayerInput>) => void;
}

export function RetirementSimulator({ input, rules, onUpdate }: RetirementSimulatorProps) {
  const grossIncome = useMemo(() => calculateGrossIncome(input), [input]);
  const maxCalc = useMemo(() => calculateMaxRetirementDeduction(grossIncome, rules), [grossIncome, rules]);

  // Calculate current fixed contributions (PVD, GPF, NSF)
  const fixedContributions = useMemo(() => {
    return input.providentFundContribution + input.governmentPensionFund + input.nsfContribution;
  }, [input.providentFundContribution, input.governmentPensionFund, input.nsfContribution]);

  // Remaining capacity for RMF, SSF, and pension insurance
  const remainingForFlexible = useMemo(() => {
    return Math.max(0, maxCalc.maxDeduction - fixedContributions);
  }, [maxCalc.maxDeduction, fixedContributions]);

  // Individual caps
  const ssfCap = useMemo(() => {
    const percentageCap = grossIncome * (rules.deductionBuckets.retirement.components.ssf.percentageOfSalaryCap || 0.30);
    const individualCap = rules.deductionBuckets.retirement.components.ssf.individualCap || 200000;
    return Math.min(percentageCap, individualCap);
  }, [grossIncome, rules]);

  const pensionCap = useMemo(() => {
    const percentageCap = grossIncome * (rules.deductionBuckets.retirement.components.pensionInsurance.percentageOfSalaryCap || 0.15);
    const individualCap = rules.deductionBuckets.retirement.components.pensionInsurance.individualCap || 200000;
    return Math.min(percentageCap, individualCap);
  }, [grossIncome, rules]);

  // Calculate baseline (without flexible contributions)
  const baselineTax = useMemo(() => {
    const baselineInput = {
      ...input,
      rmfInvestment: 0,
      ssfInvestment: 0,
      pensionInsurance: 0,
    };
    return calculateTax(baselineInput, rules);
  }, [input, rules]);

  // Calculate current tax
  const currentTax = useMemo(() => calculateTax(input, rules), [input, rules]);

  // Tax impact
  const taxReduction = useMemo(() => {
    return baselineTax.taxBeforeCredits - currentTax.taxBeforeCredits;
  }, [baselineTax, currentTax]);

  const refundChange = useMemo(() => {
    return currentTax.refundAmount - baselineTax.refundAmount;
  }, [baselineTax, currentTax]);

  // Monthly salary for presets
  const monthlySalary = useMemo(() => input.annualSalary / 12, [input.annualSalary]);

  // Create presets based on monthly salary
  const createPresets = useCallback(
    (max: number) => {
      const presets = [
        { label: '3%', value: Math.round(monthlySalary * 0.03 * 12) },
        { label: '5%', value: Math.round(monthlySalary * 0.05 * 12) },
        { label: '10%', value: Math.round(monthlySalary * 0.1 * 12) },
        { label: '15%', value: Math.round(monthlySalary * 0.15 * 12) },
      ].filter((p) => p.value <= max && p.value > 0);
      return presets;
    },
    [monthlySalary]
  );

  // Current total flexible contributions
  const currentFlexible = input.rmfInvestment + input.ssfInvestment + input.pensionInsurance;

  // Effective caps (respecting combined limit)
  const effectiveSsfCap = Math.min(ssfCap, remainingForFlexible);
  const effectivePensionCap = Math.min(pensionCap, remainingForFlexible);
  const effectiveRmfCap = remainingForFlexible;

  // Handle maximize benefit
  const handleMaximizeBenefit = useCallback(() => {
    const optimal = calculateMaximizeBenefit(input, rules);
    onUpdate({
      rmfInvestment: optimal.optimalRmf,
      ssfInvestment: optimal.optimalSsf,
      pensionInsurance: optimal.optimalPensionInsurance,
    });
  }, [input, rules, onUpdate]);

  // Reset to zero
  const handleReset = useCallback(() => {
    onUpdate({
      rmfInvestment: 0,
      ssfInvestment: 0,
      pensionInsurance: 0,
    });
  }, [onUpdate]);

  if (grossIncome <= 0) {
    return (
      <Card title="จำลองการลงทุนเพื่อเกษียณ" className="opacity-50">
        <p className="text-gray-500 text-center py-8">
          กรุณากรอกรายได้ก่อนใช้งานเครื่องมือจำลอง
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Maximum Retirement Deduction Display - THE KEY NUMBER */}
      <Card highlight className="bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">สิทธิ์ลดหย่อนเพื่อเกษียณสูงสุดของคุณ</p>
          <p className="text-4xl font-bold text-blue-600">
            {formatCurrency(maxCalc.maxDeduction)}
            <span className="text-lg font-normal text-gray-500 ml-2">บาท/ปี</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            ({formatCurrency(maxCalc.maxDeduction / 12)} บาท/เดือน)
          </p>

          <div className="mt-4 p-3 bg-white/60 rounded-lg">
            <p className="text-xs text-gray-600">
              {maxCalc.bindingConstraint === 'percentage' ? (
                <>
                  <span className="font-semibold text-amber-600">จำกัดที่ 30% ของเงินได้</span>
                  <br />
                  เพดาน 500,000 บาทยังไม่ถูกใช้เต็ม
                </>
              ) : (
                <>
                  <span className="font-semibold text-green-600">จำกัดที่เพดาน 500,000 บาท</span>
                  <br />
                  30% ของเงินได้ ({formatCurrency(maxCalc.percentageLimit)} บาท) มากกว่าเพดาน
                </>
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Current Usage */}
      <Card title="สถานะการใช้สิทธิ์">
        <ProgressBar
          value={fixedContributions + currentFlexible}
          max={maxCalc.maxDeduction}
          label="ใช้สิทธิ์แล้ว"
          showPercentage
          showValues
          color={
            fixedContributions + currentFlexible >= maxCalc.maxDeduction
              ? 'green'
              : fixedContributions + currentFlexible > maxCalc.maxDeduction * 0.8
              ? 'yellow'
              : 'blue'
          }
          size="lg"
        />

        {fixedContributions > 0 && (
          <div className="mt-3 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
            <p>สมทบประจำ (PVD/กบข./กอช.): {formatCurrency(fixedContributions)} บาท</p>
            <p>ลงทุนเพิ่มเติม (RMF/SSF/ประกันบำนาญ): {formatCurrency(currentFlexible)} บาท</p>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button onClick={handleMaximizeBenefit} variant="primary" className="flex-1">
          ใช้สิทธิ์เต็มที่
        </Button>
        <Button onClick={handleReset} variant="outline" className="flex-1">
          รีเซ็ต
        </Button>
      </div>

      {/* Tax Impact Display */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="ภาษีลดลง"
          value={formatCurrency(taxReduction)}
          subValue="บาท"
          trend={taxReduction > 0 ? 'positive' : 'neutral'}
        />
        <StatCard
          label={refundChange >= 0 ? 'เงินคืนเพิ่ม' : 'ภาษีจ่ายลด'}
          value={formatCurrency(Math.abs(refundChange))}
          subValue="บาท"
          trend={refundChange > 0 || (refundChange === 0 && taxReduction > 0) ? 'positive' : 'neutral'}
        />
      </div>

      {/* Sliders for RMF, SSF, Pension Insurance */}
      <Card title="ปรับจำนวนเงินลงทุน" subtitle="เลื่อนเพื่อดูผลกระทบทางภาษี">
        <div className="space-y-6">
          {/* SSF Slider */}
          <Slider
            label="กองทุน SSF"
            value={input.ssfInvestment}
            min={0}
            max={Math.min(ssfCap, remainingForFlexible + input.ssfInvestment)}
            step={1000}
            onChange={(value) => onUpdate({ ssfInvestment: value })}
            presets={createPresets(Math.min(ssfCap, remainingForFlexible + input.ssfInvestment))}
            hint={`เพดาน ${formatCurrency(ssfCap)} บาท (30% ของเงินได้ หรือ 200,000 บาท แล้วแต่อันใดจะต่ำกว่า)`}
          />

          {/* Pension Insurance Slider */}
          <Slider
            label="ประกันชีวิตแบบบำนาญ"
            value={input.pensionInsurance}
            min={0}
            max={Math.min(pensionCap, remainingForFlexible - input.ssfInvestment + input.pensionInsurance)}
            step={1000}
            onChange={(value) => onUpdate({ pensionInsurance: value })}
            presets={createPresets(Math.min(pensionCap, remainingForFlexible - input.ssfInvestment + input.pensionInsurance))}
            hint={`เพดาน ${formatCurrency(pensionCap)} บาท (15% ของเงินได้ หรือ 200,000 บาท แล้วแต่อันใดจะต่ำกว่า)`}
          />

          {/* RMF Slider */}
          <Slider
            label="กองทุน RMF"
            value={input.rmfInvestment}
            min={0}
            max={Math.max(0, remainingForFlexible - input.ssfInvestment - input.pensionInsurance + input.rmfInvestment)}
            step={1000}
            onChange={(value) => onUpdate({ rmfInvestment: value })}
            presets={createPresets(Math.max(0, remainingForFlexible - input.ssfInvestment - input.pensionInsurance + input.rmfInvestment))}
            hint="ไม่มีเพดานส่วนบุคคล ใช้ได้ถึงเพดานรวม"
          />
        </div>
      </Card>

      {/* Fixed Contributions Form */}
      <Card title="เงินสมทบประจำ" subtitle="กองทุนที่หักจากเงินเดือนอัตโนมัติ">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              กองทุนสำรองเลี้ยงชีพ (PVD)
            </label>
            <div className="relative">
              <input
                type="number"
                value={input.providentFundContribution || ''}
                onChange={(e) => onUpdate({ providentFundContribution: Number(e.target.value) || 0 })}
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">บาท/ปี</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              เพดาน {formatCurrency(input.annualSalary * 0.15)} บาท (15% ของเงินเดือน)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              กบข. (ข้าราชการ)
            </label>
            <div className="relative">
              <input
                type="number"
                value={input.governmentPensionFund || ''}
                onChange={(e) => onUpdate({ governmentPensionFund: Number(e.target.value) || 0 })}
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">บาท/ปี</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              กองทุนการออมแห่งชาติ (กอช.)
            </label>
            <div className="relative">
              <input
                type="number"
                value={input.nsfContribution || ''}
                onChange={(e) => onUpdate({ nsfContribution: Number(e.target.value) || 0 })}
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">บาท/ปี</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">เพดาน 30,000 บาท</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
