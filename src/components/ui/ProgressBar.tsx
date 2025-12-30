'use client';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  showValues?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({
  value,
  max,
  label,
  showPercentage = false,
  showValues = false,
  color = 'blue',
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const remaining = Math.max(0, max - value);

  const colorStyles = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-500',
    red: 'bg-red-600',
  };

  const bgColorStyles = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    red: 'bg-red-100',
  };

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm text-gray-500">{percentage.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div className={`w-full ${bgColorStyles[color]} rounded-full ${sizeStyles[size]}`}>
        <div
          className={`${colorStyles[color]} ${sizeStyles[size]} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValues && (
        <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
          <span>ใช้ไป {value.toLocaleString('th-TH')} บาท</span>
          <span>เหลือ {remaining.toLocaleString('th-TH')} บาท</span>
        </div>
      )}
    </div>
  );
}
