import React, { useRef, useState, useEffect } from 'react';
import './Knob.css';

export interface KnobProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  formatValue?: (value: number) => string;
  size?: number;
  showButtons?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  knobClassName?: string;
  buttonClassName?: string;
}

export const Knob: React.FC<KnobProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit = '',
  formatValue,
  size = 60,
  showButtons = true,
  disabled = false,
  className = '',
  labelClassName = '',
  valueClassName = '',
  knobClassName = '',
  buttonClassName = '',
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);

  const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;

  // Convert value to rotation angle (270 degrees of rotation)
  const valueToAngle = (val: number) => {
    const percentage = (val - min) / (max - min);
    return -135 + percentage * 270; // -135 to +135 degrees
  };

  const angle = valueToAngle(value);

  const calculateValueFromY = (clientY: number) => {
    const deltaY = startY - clientY; // Inverted: up = increase
    const sensitivity = 0.5; // Pixels per step
    const steps = Math.round(deltaY / sensitivity);
    const delta = steps * step;

    let newValue = startValue + delta;
    newValue = Math.max(min, Math.min(max, newValue));

    // Snap to step
    newValue = Math.round(newValue / step) * step;

    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    setIsDragging(true);
    setStartY(e.clientY);
    setStartValue(value);
    e.preventDefault();
    e.stopPropagation();
    console.log('knob pointerdown', e.pointerType, e.clientX, e.clientY);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging) return;
    console.log('knob pointermove', e.pointerType, e.clientX, e.clientY);

    calculateValueFromY(e.clientY);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    console.log('knob pointerup');
  };
 
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || e.touches.length === 0) return;
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setStartValue(value);
    e.preventDefault();
    e.stopPropagation();
    console.log('knob touchstart', e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || e.touches.length === 0) return;
    calculateValueFromY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    if (disabled) return;
    const newValue = Math.max(min, value - step);
    onChange(newValue);
    e.stopPropagation();
  };

  const handleIncrement = (e: React.MouseEvent) => {
    if (disabled) return;
    const newValue = Math.min(max, value + step);
    onChange(newValue);
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDragging, startY, startValue, value, step, min, max]);

  // Default styles
  const defaultStyles = {
    container: `modui-knob ${className}`,
    label: `modui-knob-label ${labelClassName}`,
    value: `modui-knob-value ${valueClassName}`,
    knob: `modui-knob-control ${knobClassName} ${isDragging ? 'modui-knob-dragging' : ''} ${disabled ? 'modui-knob-disabled' : ''}`,
  };

  return (
    <div className={defaultStyles.container}>
      {label && (
        <div className="modui-knob-header">
          <span className={defaultStyles.label}>{label}</span>
        </div>
      )}
      <div className="modui-knob-wrapper">
        {showButtons && (
          <button
            onClick={handleDecrement}
            disabled={disabled || value <= min}
            className={`modui-knob-button modui-knob-button-left ${buttonClassName}`}
            aria-label="Decrement"
          >
            −
          </button>
        )}
          <div
            ref={knobRef}
            className={defaultStyles.knob}
            onPointerDown={handlePointerDown}
            onTouchStart={handleTouchStart}
          style={{
            width: size,
            height: size,
            cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
          }}
          aria-label={label || 'Knob'}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          role="slider"
          tabIndex={disabled ? -1 : 0}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className="modui-knob-svg"
          >
            {/* Track (background arc) */}
            <path
              d="M 15,85 A 40 40 0 1 1 85,85"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="modui-knob-track"
            />

            {/* Value arc */}
            <path
              d="M 15,85 A 40 40 0 1 1 85,85"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${((value - min) / (max - min)) * 188.5} 188.5`}
              className="modui-knob-value-arc"
            />

            {/* Center circle */}
            <circle
              cx="50"
              cy="50"
              r="30"
              fill="currentColor"
              className="modui-knob-center"
            />

            {/* Indicator line */}
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="25"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              transform={`rotate(${angle} 50 50)`}
              className="modui-knob-indicator"
            />
          </svg>
        </div>
        {showButtons && (
          <button
            onClick={handleIncrement}
            disabled={disabled || value >= max}
            className={`modui-knob-button modui-knob-button-right ${buttonClassName}`}
            aria-label="Increment"
          >
            +
          </button>
        )}
      </div>
      <div className={defaultStyles.value}>{displayValue}</div>
    </div>
  );
};

Knob.displayName = 'Knob';
