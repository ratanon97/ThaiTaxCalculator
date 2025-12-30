'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  highlight?: boolean;
}

export function Card({ children, className = '', title, subtitle, highlight }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border
        ${highlight ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className="px-4 py-3 border-b border-gray-100">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, subValue, trend, icon, className = '' }: StatCardProps) {
  const trendColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${trend ? trendColors[trend] : 'text-gray-900'}`}>
            {typeof value === 'number' ? value.toLocaleString('th-TH') : value}
          </p>
          {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </div>
  );
}
