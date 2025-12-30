'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, ChartErrorBoundary } from '@/components/ui';
import { formatCurrency } from '@/lib/tax';
import type { TaxCalculationResult } from '@/types/tax';

// --- Chart Tooltip Types and Component ---
// Defined outside TaxChart to avoid recreation on each render

interface TooltipPayloadItem {
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 shadow-lg rounded border border-gray-200">
        <p className="text-sm font-medium">{payload[0].name}</p>
        <p className="text-sm text-gray-600">
          {formatCurrency(payload[0].value)} บาท
        </p>
      </div>
    );
  }
  return null;
}

// --- Main Component ---

interface TaxChartProps {
  result: TaxCalculationResult;
}

const COLORS = {
  tax: '#ef4444',
  refund: '#22c55e',
  deductions: '#3b82f6',
  income: '#6366f1',
  brackets: ['#f0f9ff', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985'],
};

export function TaxChart({ result }: TaxChartProps) {
  // Income allocation pie chart data
  const incomeAllocationData = useMemo(() => {
    const data = [
      {
        name: 'ค่าใช้จ่าย',
        value: result.employmentExpenseDeduction,
        color: '#94a3b8',
      },
      {
        name: 'ค่าลดหย่อน',
        value: result.deductions.totalDeductions,
        color: '#3b82f6',
      },
      {
        name: 'ภาษี',
        value: result.taxBeforeCredits,
        color: '#ef4444',
      },
      {
        name: 'เหลือใช้จ่าย',
        value: Math.max(
          0,
          result.grossIncome -
            result.employmentExpenseDeduction -
            result.deductions.totalDeductions -
            result.taxBeforeCredits
        ),
        color: '#22c55e',
      },
    ].filter((d) => d.value > 0);

    return data;
  }, [result]);

  // Tax brackets bar chart data
  const bracketData = useMemo(() => {
    return result.bracketBreakdown
      .filter((b) => b.taxableInBracket > 0)
      .map((b, i) => ({
        name:
          b.bracket.rate === 0
            ? 'ยกเว้น'
            : `${(b.bracket.rate * 100).toFixed(0)}%`,
        taxable: b.taxableInBracket,
        tax: b.taxInBracket,
        fill: COLORS.brackets[Math.min(i + 2, COLORS.brackets.length - 1)],
      }));
  }, [result]);

  // Deduction breakdown pie chart
  const deductionData = useMemo(() => {
    const data = [
      {
        name: 'ส่วนตัว',
        value: result.personalAllowances.total,
        color: '#8b5cf6',
      },
      {
        name: 'เพื่อเกษียณ',
        value: result.deductions.retirement.totalEffectiveDeduction,
        color: '#06b6d4',
      },
      {
        name: 'ประกัน',
        value:
          result.deductions.lifeInsurance.effectiveDeduction +
          result.deductions.healthInsurance.effectiveDeduction +
          result.deductions.parentHealthInsurance.effectiveDeduction +
          result.deductions.socialSecurity.effectiveDeduction,
        color: '#f59e0b',
      },
      {
        name: 'อื่นๆ',
        value:
          result.deductions.otherDeductions.total + result.deductions.donations.total,
        color: '#ec4899',
      },
    ].filter((d) => d.value > 0);

    return data;
  }, [result]);

  if (result.grossIncome <= 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Income Allocation */}
      <ChartErrorBoundary chartName="กราฟสัดส่วนรายได้">
        <Card title="สัดส่วนการใช้รายได้" subtitle="รายได้ถูกจัดสรรไปที่ไหนบ้าง">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeAllocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {incomeAllocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {incomeAllocationData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </ChartErrorBoundary>

      {/* Tax Brackets */}
      {bracketData.length > 0 && (
        <ChartErrorBoundary chartName="กราฟภาษีตามขั้นบันได">
          <Card title="ภาษีตามขั้นบันได" subtitle="แต่ละช่วงรายได้เสียภาษีเท่าไหร่">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bracketData} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis type="category" dataKey="name" width={60} />
                  <Tooltip
                    formatter={(value) => [
                      `${formatCurrency(value as number)} บาท`,
                      'ภาษี',
                    ]}
                  />
                  <Bar dataKey="tax" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </ChartErrorBoundary>
      )}

      {/* Deduction Breakdown */}
      {deductionData.length > 1 && (
        <ChartErrorBoundary chartName="กราฟค่าลดหย่อน">
          <Card title="สัดส่วนค่าลดหย่อน" subtitle="ลดหย่อนจากอะไรบ้าง">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deductionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {deductionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {deductionData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </ChartErrorBoundary>
      )}
    </div>
  );
}
