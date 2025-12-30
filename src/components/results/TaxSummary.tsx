'use client';

import { Card, StatCard } from '@/components/ui';
import { formatCurrency, formatPercent } from '@/lib/tax';
import type { TaxCalculationResult } from '@/types/tax';

interface TaxSummaryProps {
  result: TaxCalculationResult;
}

export function TaxSummary({ result }: TaxSummaryProps) {
  return (
    <div className="space-y-4">
      {/* Final Result - Most Important */}
      <Card
        highlight={result.isRefund}
        className={result.isRefund ? 'bg-green-50 border-green-500' : ''}
      >
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">
            {result.isRefund ? 'เงินคืนภาษีที่จะได้รับ' : 'ภาษีที่ต้องจ่ายเพิ่ม'}
          </p>
          <p
            className={`text-4xl font-bold ${
              result.isRefund ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatCurrency(result.isRefund ? result.refundAmount : result.finalTaxPayable)}
            <span className="text-lg font-normal text-gray-500 ml-2">บาท</span>
          </p>
        </div>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="รายได้รวม"
          value={formatCurrency(result.grossIncome)}
          subValue="บาท/ปี"
        />
        <StatCard
          label="เงินได้สุทธิ"
          value={formatCurrency(result.taxableIncome)}
          subValue="บาท"
        />
        <StatCard
          label="ภาษีที่คำนวณได้"
          value={formatCurrency(result.taxBeforeCredits)}
          subValue="บาท"
        />
        <StatCard
          label="ภาษีหัก ณ ที่จ่าย"
          value={formatCurrency(result.withholdingTaxPaid)}
          subValue="บาท"
        />
      </div>

      {/* Tax Rates */}
      <Card title="อัตราภาษี">
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-600">อัตราภาษีเฉลี่ย (Effective Rate)</span>
          <span className="font-semibold text-gray-900">
            {(result.effectiveTaxRate * 100).toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-t border-gray-100">
          <span className="text-gray-600">อัตราภาษีส่วนเพิ่ม (Marginal Rate)</span>
          <span className="font-semibold text-gray-900">
            {(result.marginalTaxRate * 100).toFixed(0)}%
          </span>
        </div>
      </Card>
    </div>
  );
}
