'use client';

import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/tax';
import type { TaxCalculationResult, TaxRulesConfig } from '@/types/tax';

interface TaxExplanationProps {
  result: TaxCalculationResult;
  rules: TaxRulesConfig;
}

export function TaxExplanation({ result, rules }: TaxExplanationProps) {
  // Find the highest tax bracket used
  const activeBrackets = result.bracketBreakdown.filter((b) => b.taxableInBracket > 0);
  const highestBracket = activeBrackets[activeBrackets.length - 1];

  return (
    <Card title="อธิบายภาษีของคุณ" subtitle="เข้าใจง่ายๆ ว่าภาษีคำนวณอย่างไร">
      <div className="space-y-6">
        {/* Step 1: Income */}
        <section>
          <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              1
            </span>
            รายได้ของคุณ
          </h4>
          <p className="text-gray-600 text-sm leading-relaxed pl-8">
            คุณมีรายได้รวมทั้งปี <strong>{formatCurrency(result.grossIncome)} บาท</strong>
            {result.grossIncome > 0 && (
              <>
                {' '}ซึ่งเทียบเท่ากับเดือนละ{' '}
                <strong>{formatCurrency(result.grossIncome / 12)} บาท</strong>
              </>
            )}
          </p>
        </section>

        {/* Step 2: Expense Deduction */}
        <section>
          <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              2
            </span>
            หักค่าใช้จ่าย
          </h4>
          <p className="text-gray-600 text-sm leading-relaxed pl-8">
            ก่อนคำนวณภาษี กฎหมายอนุญาตให้หักค่าใช้จ่ายได้ 50% ของรายได้ แต่ไม่เกิน 100,000 บาท
            คุณจึงหักได้ <strong>{formatCurrency(result.employmentExpenseDeduction)} บาท</strong>
            เหลือเงินได้หลังหักค่าใช้จ่าย{' '}
            <strong>{formatCurrency(result.netIncomeAfterExpense)} บาท</strong>
          </p>
        </section>

        {/* Step 3: Deductions */}
        <section>
          <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              3
            </span>
            ค่าลดหย่อน
          </h4>
          <div className="text-gray-600 text-sm leading-relaxed pl-8 space-y-2">
            <p>คุณมีค่าลดหย่อนรวม <strong>{formatCurrency(result.deductions.totalDeductions)} บาท</strong> ประกอบด้วย:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>ค่าลดหย่อนส่วนตัวและครอบครัว: {formatCurrency(result.personalAllowances.total)} บาท</li>
              {result.deductions.retirement.totalEffectiveDeduction > 0 && (
                <li>
                  ค่าลดหย่อนเพื่อเกษียณ: {formatCurrency(result.deductions.retirement.totalEffectiveDeduction)} บาท
                  {result.deductions.retirement.remainingCapacity > 0 && (
                    <span className="text-blue-600">
                      {' '}(ยังใช้สิทธิ์ได้อีก {formatCurrency(result.deductions.retirement.remainingCapacity)} บาท)
                    </span>
                  )}
                </li>
              )}
              {(result.deductions.lifeInsurance.effectiveDeduction +
                result.deductions.healthInsurance.effectiveDeduction +
                result.deductions.parentHealthInsurance.effectiveDeduction +
                result.deductions.socialSecurity.effectiveDeduction) > 0 && (
                <li>
                  ค่าลดหย่อนประกัน:{' '}
                  {formatCurrency(
                    result.deductions.lifeInsurance.effectiveDeduction +
                    result.deductions.healthInsurance.effectiveDeduction +
                    result.deductions.parentHealthInsurance.effectiveDeduction +
                    result.deductions.socialSecurity.effectiveDeduction
                  )}{' '}
                  บาท
                </li>
              )}
              {(result.deductions.otherDeductions.total + result.deductions.donations.total) > 0 && (
                <li>
                  ค่าลดหย่อนอื่นๆ และเงินบริจาค:{' '}
                  {formatCurrency(result.deductions.otherDeductions.total + result.deductions.donations.total)} บาท
                </li>
              )}
            </ul>
          </div>
        </section>

        {/* Step 4: Taxable Income */}
        <section>
          <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              4
            </span>
            เงินได้สุทธิ
          </h4>
          <p className="text-gray-600 text-sm leading-relaxed pl-8">
            เมื่อนำรายได้หลังหักค่าใช้จ่าย ({formatCurrency(result.netIncomeAfterExpense)} บาท)
            มาหักค่าลดหย่อน ({formatCurrency(result.deductions.totalDeductions)} บาท)
            จะได้เงินได้สุทธิที่ต้องเสียภาษี{' '}
            <strong>{formatCurrency(result.taxableIncome)} บาท</strong>
          </p>
        </section>

        {/* Step 5: Tax Calculation */}
        <section>
          <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              5
            </span>
            คำนวณภาษีแบบขั้นบันได
          </h4>
          <div className="text-gray-600 text-sm leading-relaxed pl-8 space-y-2">
            {result.taxableIncome <= 150000 ? (
              <p>
                เนื่องจากเงินได้สุทธิของคุณไม่เกิน 150,000 บาท คุณจึง
                <strong className="text-green-600">ไม่ต้องเสียภาษี</strong>
              </p>
            ) : (
              <>
                <p>ภาษีจะคำนวณแบบขั้นบันได โดยแต่ละช่วงเงินได้จะเสียภาษีในอัตราที่ต่างกัน:</p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  {activeBrackets.map((b, i) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        {b.bracket.rate === 0
                          ? '0 - 150,000 บาท (ยกเว้นภาษี)'
                          : `${formatCurrency(b.bracket.minIncome)} - ${
                              b.bracket.maxIncome
                                ? formatCurrency(b.bracket.maxIncome)
                                : 'ขึ้นไป'
                            } บาท @ ${(b.bracket.rate * 100).toFixed(0)}%`}
                      </span>
                      <span className="font-medium">{formatCurrency(b.taxInBracket)} บาท</span>
                    </div>
                  ))}
                </div>
                <p>
                  รวมภาษีที่ต้องจ่าย <strong>{formatCurrency(result.taxBeforeCredits)} บาท</strong>
                </p>
                {highestBracket && highestBracket.bracket.rate > 0 && (
                  <p className="text-amber-600">
                    หมายเหตุ: รายได้ส่วนสุดท้ายของคุณอยู่ในขั้น {(highestBracket.bracket.rate * 100).toFixed(0)}%
                    หมายความว่าทุกๆ 1 บาทที่ลดหย่อนเพิ่ม คุณจะประหยัดภาษีได้{' '}
                    {(highestBracket.bracket.rate * 100).toFixed(0)} สตางค์
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        {/* Step 6: Final Result */}
        <section>
          <h4 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              6
            </span>
            สรุป
          </h4>
          <div className="text-gray-600 text-sm leading-relaxed pl-8">
            {result.withholdingTaxPaid > 0 ? (
              <>
                <p>
                  คุณถูกหักภาษี ณ ที่จ่ายไปแล้ว{' '}
                  <strong>{formatCurrency(result.withholdingTaxPaid)} บาท</strong> ตลอดปี
                </p>
                {result.isRefund ? (
                  <p className="mt-2 text-green-600 font-semibold">
                    เนื่องจากถูกหักไปมากกว่าภาษีที่ต้องจ่ายจริง คุณจะได้รับเงินคืน{' '}
                    <strong>{formatCurrency(result.refundAmount)} บาท</strong>
                  </p>
                ) : result.finalTaxPayable > 0 ? (
                  <p className="mt-2 text-red-600 font-semibold">
                    คุณต้องจ่ายภาษีเพิ่มอีก{' '}
                    <strong>{formatCurrency(result.finalTaxPayable)} บาท</strong>
                  </p>
                ) : (
                  <p className="mt-2 text-green-600 font-semibold">
                    ภาษีที่ถูกหักพอดีกับที่ต้องจ่าย ไม่ต้องจ่ายเพิ่มและไม่ได้คืน
                  </p>
                )}
              </>
            ) : result.taxBeforeCredits > 0 ? (
              <p className="text-red-600 font-semibold">
                คุณต้องจ่ายภาษี <strong>{formatCurrency(result.taxBeforeCredits)} บาท</strong>
              </p>
            ) : (
              <p className="text-green-600 font-semibold">คุณไม่ต้องเสียภาษี</p>
            )}
          </div>
        </section>

        {/* Optimization Tips */}
        {result.deductions.retirement.remainingCapacity > 0 && result.marginalTaxRate > 0 && (
          <section className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-base font-semibold text-blue-800 mb-2">
              💡 เคล็ดลับประหยัดภาษี
            </h4>
            <p className="text-blue-700 text-sm">
              คุณยังมีสิทธิ์ลดหย่อนเพื่อเกษียณเหลืออยู่{' '}
              <strong>{formatCurrency(result.deductions.retirement.remainingCapacity)} บาท</strong>
              {' '}หากใช้สิทธิ์เต็มที่ด้วยการซื้อ RMF หรือ SSF คุณจะประหยัดภาษีได้สูงสุด{' '}
              <strong>
                {formatCurrency(
                  result.deductions.retirement.remainingCapacity * result.marginalTaxRate
                )}{' '}
                บาท
              </strong>
              {' '}(คิดที่อัตรา {(result.marginalTaxRate * 100).toFixed(0)}%)
            </p>
          </section>
        )}
      </div>
    </Card>
  );
}
