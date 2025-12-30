'use client';

import { Card, ProgressBar } from '@/components/ui';
import { formatCurrency } from '@/lib/tax';
import type { TaxCalculationResult } from '@/types/tax';

interface TaxBreakdownProps {
  result: TaxCalculationResult;
}

export function TaxBreakdown({ result }: TaxBreakdownProps) {
  return (
    <div className="space-y-4">
      {/* Income Breakdown */}
      <Card title="รายได้และค่าใช้จ่าย">
        <div className="space-y-3">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">รายได้รวม</span>
            <span className="font-medium">{formatCurrency(result.grossIncome)} บาท</span>
          </div>
          <div className="flex justify-between py-2 text-red-600">
            <span>หัก: ค่าใช้จ่าย (50% ไม่เกิน 100,000)</span>
            <span>-{formatCurrency(result.employmentExpenseDeduction)} บาท</span>
          </div>
          <div className="flex justify-between py-2 border-t border-gray-200 font-semibold">
            <span>เงินได้หลังหักค่าใช้จ่าย</span>
            <span>{formatCurrency(result.netIncomeAfterExpense)} บาท</span>
          </div>
        </div>
      </Card>

      {/* Personal Allowances */}
      <Card title="ค่าลดหย่อนส่วนตัว">
        <div className="space-y-2">
          <div className="flex justify-between py-1.5">
            <span className="text-gray-600">ส่วนตัว</span>
            <span>{formatCurrency(result.personalAllowances.self)} บาท</span>
          </div>
          {result.personalAllowances.spouse > 0 && (
            <div className="flex justify-between py-1.5">
              <span className="text-gray-600">คู่สมรส</span>
              <span>{formatCurrency(result.personalAllowances.spouse)} บาท</span>
            </div>
          )}
          {result.personalAllowances.children > 0 && (
            <div className="flex justify-between py-1.5">
              <span className="text-gray-600">บุตร</span>
              <span>{formatCurrency(result.personalAllowances.children)} บาท</span>
            </div>
          )}
          {result.personalAllowances.parents > 0 && (
            <div className="flex justify-between py-1.5">
              <span className="text-gray-600">บิดามารดา</span>
              <span>{formatCurrency(result.personalAllowances.parents)} บาท</span>
            </div>
          )}
          {result.personalAllowances.disabled > 0 && (
            <div className="flex justify-between py-1.5">
              <span className="text-gray-600">ผู้พิการ/ทุพพลภาพ</span>
              <span>{formatCurrency(result.personalAllowances.disabled)} บาท</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t border-gray-200 font-semibold">
            <span>รวมค่าลดหย่อนส่วนตัว</span>
            <span className="text-green-600">
              {formatCurrency(result.personalAllowances.total)} บาท
            </span>
          </div>
        </div>
      </Card>

      {/* Retirement Deductions */}
      <Card title="ค่าลดหย่อนเพื่อเกษียณ">
        <div className="space-y-3">
          <ProgressBar
            value={result.deductions.retirement.totalEffectiveDeduction}
            max={result.deductions.retirement.maxRetirementDeduction}
            label="ใช้สิทธิ์แล้ว"
            showPercentage
            showValues
            color={
              result.deductions.retirement.totalEffectiveDeduction >=
              result.deductions.retirement.maxRetirementDeduction
                ? 'green'
                : 'blue'
            }
          />

          <div className="space-y-2 pt-2">
            {result.deductions.retirement.components.map((comp) =>
              comp.inputAmount > 0 ? (
                <div key={comp.componentId} className="flex justify-between py-1.5">
                  <span className="text-gray-600">{comp.componentName}</span>
                  <span>
                    {formatCurrency(comp.effectiveAmount)} บาท
                    {comp.inputAmount > comp.effectiveAmount && (
                      <span className="text-xs text-amber-600 ml-1">
                        (จาก {formatCurrency(comp.inputAmount)})
                      </span>
                    )}
                  </span>
                </div>
              ) : null
            )}
          </div>

          <div className="flex justify-between py-2 border-t border-gray-200 font-semibold">
            <span>รวมลดหย่อนเพื่อเกษียณ</span>
            <span className="text-green-600">
              {formatCurrency(result.deductions.retirement.totalEffectiveDeduction)} บาท
            </span>
          </div>

          {result.deductions.retirement.remainingCapacity > 0 && (
            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              ยังเหลือสิทธิ์อีก {formatCurrency(result.deductions.retirement.remainingCapacity)} บาท
              ({formatCurrency(result.deductions.retirement.monthlyRemainingCapacity)}/เดือน)
            </p>
          )}
        </div>
      </Card>

      {/* Insurance Deductions */}
      <Card title="ค่าลดหย่อนประกันภัย">
        <div className="space-y-2">
          {result.deductions.lifeInsurance.inputAmount > 0 && (
            <div className="flex justify-between py-1.5">
              <span className="text-gray-600">ประกันชีวิต</span>
              <span>{formatCurrency(result.deductions.lifeInsurance.effectiveDeduction)} บาท</span>
            </div>
          )}
          {result.deductions.healthInsurance.inputAmount > 0 && (
            <div className="flex justify-between py-1.5">
              <span className="text-gray-600">ประกันสุขภาพ</span>
              <span>{formatCurrency(result.deductions.healthInsurance.effectiveDeduction)} บาท</span>
            </div>
          )}
          {result.deductions.parentHealthInsurance.inputAmount > 0 && (
            <div className="flex justify-between py-1.5">
              <span className="text-gray-600">ประกันสุขภาพบิดามารดา</span>
              <span>
                {formatCurrency(result.deductions.parentHealthInsurance.effectiveDeduction)} บาท
              </span>
            </div>
          )}
          {result.deductions.socialSecurity.inputAmount > 0 && (
            <div className="flex justify-between py-1.5">
              <span className="text-gray-600">ประกันสังคม</span>
              <span>{formatCurrency(result.deductions.socialSecurity.effectiveDeduction)} บาท</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t border-gray-200 font-semibold">
            <span>รวมลดหย่อนประกัน</span>
            <span className="text-green-600">
              {formatCurrency(
                result.deductions.lifeInsurance.effectiveDeduction +
                  result.deductions.healthInsurance.effectiveDeduction +
                  result.deductions.parentHealthInsurance.effectiveDeduction +
                  result.deductions.socialSecurity.effectiveDeduction
              )}{' '}
              บาท
            </span>
          </div>
        </div>
      </Card>

      {/* Other Deductions */}
      {(result.deductions.otherDeductions.total > 0 || result.deductions.donations.total > 0) && (
        <Card title="ค่าลดหย่อนอื่นๆ">
          <div className="space-y-2">
            {result.deductions.otherDeductions.homeLoanInterest > 0 && (
              <div className="flex justify-between py-1.5">
                <span className="text-gray-600">ดอกเบี้ยเงินกู้บ้าน</span>
                <span>{formatCurrency(result.deductions.otherDeductions.homeLoanInterest)} บาท</span>
              </div>
            )}
            {result.deductions.otherDeductions.easyEReceipt > 0 && (
              <div className="flex justify-between py-1.5">
                <span className="text-gray-600">ช้อปดีมีคืน</span>
                <span>{formatCurrency(result.deductions.otherDeductions.easyEReceipt)} บาท</span>
              </div>
            )}
            {result.deductions.donations.education.input > 0 && (
              <div className="flex justify-between py-1.5">
                <span className="text-gray-600">บริจาคการศึกษา (x2)</span>
                <span>{formatCurrency(result.deductions.donations.education.effective)} บาท</span>
              </div>
            )}
            {result.deductions.donations.general.input > 0 && (
              <div className="flex justify-between py-1.5">
                <span className="text-gray-600">บริจาคทั่วไป</span>
                <span>{formatCurrency(result.deductions.donations.general.effective)} บาท</span>
              </div>
            )}
            {result.deductions.donations.political.input > 0 && (
              <div className="flex justify-between py-1.5">
                <span className="text-gray-600">บริจาคพรรคการเมือง</span>
                <span>{formatCurrency(result.deductions.donations.political.effective)} บาท</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t border-gray-200 font-semibold">
              <span>รวมค่าลดหย่อนอื่นๆ</span>
              <span className="text-green-600">
                {formatCurrency(
                  result.deductions.otherDeductions.total + result.deductions.donations.total
                )}{' '}
                บาท
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Total Deductions Summary */}
      <Card className="bg-gray-50">
        <div className="flex justify-between py-2 text-lg font-bold">
          <span>รวมค่าลดหย่อนทั้งหมด</span>
          <span className="text-green-600">
            {formatCurrency(result.deductions.totalDeductions)} บาท
          </span>
        </div>
      </Card>

      {/* Tax Calculation */}
      <Card title="การคำนวณภาษี">
        <div className="space-y-2">
          <div className="flex justify-between py-1.5">
            <span className="text-gray-600">เงินได้สุทธิ</span>
            <span>{formatCurrency(result.taxableIncome)} บาท</span>
          </div>

          <div className="border-t border-gray-100 pt-2">
            <p className="text-sm font-medium text-gray-700 mb-2">ภาษีตามขั้นบันได:</p>
            {result.bracketBreakdown
              .filter((b) => b.taxableInBracket > 0)
              .map((b, i) => (
                <div key={i} className="flex justify-between py-1 text-sm">
                  <span className="text-gray-500">
                    {formatCurrency(b.bracket.minIncome)} -{' '}
                    {b.bracket.maxIncome ? formatCurrency(b.bracket.maxIncome) : 'ขึ้นไป'} @{' '}
                    {(b.bracket.rate * 100).toFixed(0)}%
                  </span>
                  <span>{formatCurrency(b.taxInBracket)} บาท</span>
                </div>
              ))}
          </div>

          <div className="flex justify-between py-2 border-t border-gray-200 font-semibold">
            <span>ภาษีที่คำนวณได้</span>
            <span className="text-blue-600">{formatCurrency(result.taxBeforeCredits)} บาท</span>
          </div>

          <div className="flex justify-between py-1.5 text-green-600">
            <span>หัก: ภาษีหัก ณ ที่จ่าย</span>
            <span>-{formatCurrency(result.withholdingTaxPaid)} บาท</span>
          </div>

          <div
            className={`flex justify-between py-2 border-t border-gray-200 text-lg font-bold ${
              result.isRefund ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <span>{result.isRefund ? 'เงินคืน' : 'ภาษีที่ต้องจ่ายเพิ่ม'}</span>
            <span>
              {formatCurrency(result.isRefund ? result.refundAmount : result.finalTaxPayable)} บาท
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
