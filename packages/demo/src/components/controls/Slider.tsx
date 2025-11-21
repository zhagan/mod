import React from 'react';
import './Slider.css';

interface SliderProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (value: number) => string;
  labelColor?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  formatValue,
  labelColor
}) => {
  const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  return (
    <div className="slider-container">
      {label && (
        <div className="slider-header">
          <span className="slider-label" style={labelColor ? { color: labelColor } : undefined}>{label}</span>
          <span className="slider-value">{displayValue}</span>
        </div>
      )}
      <div className="slider-control">
        <button
          className="slider-button slider-button-minus"
          onClick={handleDecrement}
          disabled={value <= min}
          title="Decrease"
        >
          −
        </button>
        <input
          type="range"
          className="slider"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          min={min}
          max={max}
          step={step}
        />
        <button
          className="slider-button slider-button-plus"
          onClick={handleIncrement}
          disabled={value >= max}
          title="Increase"
        >
          +
        </button>
      </div>
    </div>
  );
};
