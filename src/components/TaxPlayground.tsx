'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useTaxCalculation } from '@/hooks/useTaxCalculation';
import type { TaxpayerInputForm } from '@/lib/validation';
import { getDefaultInput } from '@/lib/tax';
import { Button } from '@/components/ui';
import { IncomeForm, PersonalAllowanceForm, InsuranceForm, OtherDeductionsForm } from '@/components/forms';
import { RetirementSimulator } from '@/components/simulator';
import { TaxSummary, TaxBreakdown, TaxExplanation, TaxChart } from '@/components/results';

type TabType = 'input' | 'simulator' | 'results' | 'explanation';

export function TaxPlayground() {
  const [activeTab, setActiveTab] = useState<TabType>('input');
  const { input, updateInput, result, rules, taxYear } = useTaxCalculation();

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TaxpayerInputForm>({
    defaultValues: getDefaultInput() as TaxpayerInputForm,
    mode: 'onChange',
  });

  // Create wrapped setValue that also updates calculation
  const setValueWithSync = useCallback(
    (name: keyof TaxpayerInputForm, value: number | boolean) => {
      setValue(name, value as any);
      updateInput({ [name]: value });
    },
    [setValue, updateInput]
  );

  // Handle form field changes and sync to calculator
  const handleInputChange = useCallback(
    (name: keyof TaxpayerInputForm, value: number | boolean) => {
      updateInput({ [name]: value });
    },
    [updateInput]
  );

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'input', label: 'กรอกข้อมูล', icon: '📝' },
    { id: 'simulator', label: 'จำลองการลงทุน', icon: '🎯' },
    { id: 'results', label: 'ผลคำนวณ', icon: '📊' },
    { id: 'explanation', label: 'อธิบาย', icon: '💡' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Thai Tax Playground</h1>
              <p className="text-sm text-gray-500">คำนวณภาษีปี {taxYear}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                {result.isRefund ? '+' : '-'}
                {Math.abs(result.isRefund ? result.refundAmount : result.finalTaxPayable).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {result.isRefund ? 'เงินคืน' : 'ภาษีจ่ายเพิ่ม'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-[73px] z-40">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex overflow-x-auto -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Input Tab */}
        {activeTab === 'input' && (
          <div className="space-y-6">
            <IncomeForm register={register} errors={errors} onFieldChange={handleInputChange} />
            <PersonalAllowanceForm
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValueWithSync}
              onFieldChange={handleInputChange}
            />
            <InsuranceForm
              register={register}
              errors={errors}
              watch={watch}
              rules={rules}
              onFieldChange={handleInputChange}
            />
            <OtherDeductionsForm register={register} errors={errors} rules={rules} onFieldChange={handleInputChange} />

            <div className="flex gap-3">
              <Button
                onClick={() => setActiveTab('simulator')}
                variant="primary"
                className="flex-1"
              >
                ไปจำลองการลงทุน
              </Button>
              <Button
                onClick={() => setActiveTab('results')}
                variant="outline"
                className="flex-1"
              >
                ดูผลคำนวณ
              </Button>
            </div>
          </div>
        )}

        {/* Simulator Tab */}
        {activeTab === 'simulator' && (
          <RetirementSimulator
            input={input}
            rules={rules}
            onUpdate={(updates) => {
              Object.entries(updates).forEach(([key, value]) => {
                setValueWithSync(key as keyof TaxpayerInputForm, value);
              });
            }}
          />
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            <TaxSummary result={result} />
            <TaxChart result={result} />
            <TaxBreakdown result={result} />
          </div>
        )}

        {/* Explanation Tab */}
        {activeTab === 'explanation' && <TaxExplanation result={result} rules={rules} />}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex flex-col items-center py-2 text-xs
                ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'}
              `}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Spacer for bottom navigation */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
