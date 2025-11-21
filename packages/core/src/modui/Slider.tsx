import React from 'react';
import './Slider.css';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  formatValue?: (value: number) => string;
  showButtons?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  controlClassName?: string;
  buttonClassName?: string;
  inputClassName?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit = '',
  formatValue,
  showButtons = true,
  disabled = false,
  className = '',
  labelClassName = '',
  valueClassName = '',
  controlClassName = '',
  buttonClassName = '',
  inputClassName = '',
}) => {
  const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;

  const handleDecrement = () => {
    if (disabled) return;
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    if (disabled) return;
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    onChange(parseFloat(e.target.value));
  };

  // Default styles that can be overridden
  const defaultStyles = {
    container: `modui-slider ${className}`,
    header: `modui-slider-header`,
    label: `modui-slider-label ${labelClassName}`,
    value: `modui-slider-value ${valueClassName}`,
    control: `modui-slider-control ${controlClassName}`,
    button: `modui-slider-button ${buttonClassName}`,
    input: `modui-slider-input ${inputClassName}`,
  };

  return (
    <div className={defaultStyles.container}>
      {label && (
        <div className={defaultStyles.header}>
          <span className={defaultStyles.label}>{label}</span>
          <span className={defaultStyles.value}>{displayValue}</span>
        </div>
      )}
      <div className={defaultStyles.control}>
        {showButtons && (
          <button
            className={`${defaultStyles.button} modui-slider-button-minus`}
            onClick={handleDecrement}
            disabled={disabled || value <= min}
            type="button"
            aria-label="Decrease"
          >
            −
          </button>
        )}
        <input
          type="range"
          className={defaultStyles.input}
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-label={label || 'Slider'}
        />
        {showButtons && (
          <button
            className={`${defaultStyles.button} modui-slider-button-plus`}
            onClick={handleIncrement}
            disabled={disabled || value >= max}
            type="button"
            aria-label="Increase"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
};

Slider.displayName = 'Slider';
