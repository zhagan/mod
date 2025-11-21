import React from 'react';
import './ProgressBar.css';

export interface ProgressBarProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
  barClassName?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.1,
  disabled = false,
  showValue = false,
  formatValue,
  className = '',
  barClassName = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const percentage = ((value - min) / (max - min)) * 100;

  const containerClasses = [
    'modui-progress-bar',
    disabled && 'modui-progress-bar-disabled',
    className,
  ].filter(Boolean).join(' ');

  const barClasses = [
    'modui-progress-bar-input',
    barClassName,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div className="modui-progress-bar-track">
        <div
          className="modui-progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          className={barClasses}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          onMouseDown={handleMouseDown}
          disabled={disabled}
        />
      </div>
      {showValue && (
        <div className="modui-progress-bar-value">
          {formatValue ? formatValue(value) : value.toFixed(1)}
        </div>
      )}
    </div>
  );
};
