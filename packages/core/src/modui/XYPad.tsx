import React, { useRef, useState, useEffect } from 'react';
import './XYPad.css';

export interface XYPadProps {
  valueX: number;
  valueY: number;
  onChangeX: (value: number) => void;
  onChangeY: (value: number) => void;
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  stepX?: number;
  stepY?: number;
  labelX?: string;
  labelY?: string;
  formatValueX?: (value: number) => string;
  formatValueY?: (value: number) => string;
  size?: number;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  padClassName?: string;
}

export const XYPad: React.FC<XYPadProps> = ({
  valueX,
  valueY,
  onChangeX,
  onChangeY,
  minX = 0,
  maxX = 100,
  minY = 0,
  maxY = 100,
  stepX = 1,
  stepY = 1,
  labelX,
  labelY,
  formatValueX,
  formatValueY,
  size = 200,
  disabled = false,
  className = '',
  labelClassName = '',
  padClassName = '',
}) => {
  const padRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const displayValueX = formatValueX ? formatValueX(valueX) : valueX.toString();
  const displayValueY = formatValueY ? formatValueY(valueY) : valueY.toString();

  // Convert values to positions (0-1 range)
  const normalizedX = (valueX - minX) / (maxX - minX);
  const normalizedY = (valueY - minY) / (maxY - minY);

  // Convert to pixel positions (Y is inverted: bottom = 0, top = 1)
  const posX = normalizedX * 100; // percentage
  const posY = (1 - normalizedY) * 100; // inverted for screen coordinates

  const updateValues = (clientX: number, clientY: number) => {
    if (!padRef.current || disabled) return;

    const rect = padRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    // Convert to value range (Y inverted)
    let newValueX = minX + x * (maxX - minX);
    let newValueY = minY + (1 - y) * (maxY - minY);

    // Snap to step
    newValueX = Math.round(newValueX / stepX) * stepX;
    newValueY = Math.round(newValueY / stepY) * stepY;

    // Clamp to range
    newValueX = Math.max(minX, Math.min(maxX, newValueX));
    newValueY = Math.max(minY, Math.min(maxY, newValueY));

    if (newValueX !== valueX) onChangeX(newValueX);
    if (newValueY !== valueY) onChangeY(newValueY);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValues(e.clientX, e.clientY);
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    updateValues(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, valueX, valueY]);

  const defaultStyles = {
    container: `modui-xypad ${className}`,
    label: `modui-xypad-label ${labelClassName}`,
    pad: `modui-xypad-surface ${padClassName} ${isDragging ? 'modui-xypad-dragging' : ''} ${disabled ? 'modui-xypad-disabled' : ''}`,
  };

  return (
    <div className={defaultStyles.container}>
      <div className="modui-xypad-header">
        {labelX && <span className={defaultStyles.label}>{labelX}: {displayValueX}</span>}
        {labelY && <span className={defaultStyles.label}>{labelY}: {displayValueY}</span>}
      </div>
      <div
        ref={padRef}
        className={defaultStyles.pad}
        onMouseDown={handleMouseDown}
        style={{
          width: size,
          height: size,
          cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'crosshair',
        }}
        role="slider"
        aria-label={`${labelX || 'X'} and ${labelY || 'Y'} control`}
        aria-valuemin={minX}
        aria-valuemax={maxX}
        aria-valuenow={valueX}
        tabIndex={disabled ? -1 : 0}
      >
        {/* Grid lines */}
        <div className="modui-xypad-grid">
          <div className="modui-xypad-grid-line modui-xypad-grid-line-v" style={{ left: '25%' }} />
          <div className="modui-xypad-grid-line modui-xypad-grid-line-v" style={{ left: '50%' }} />
          <div className="modui-xypad-grid-line modui-xypad-grid-line-v" style={{ left: '75%' }} />
          <div className="modui-xypad-grid-line modui-xypad-grid-line-h" style={{ top: '25%' }} />
          <div className="modui-xypad-grid-line modui-xypad-grid-line-h" style={{ top: '50%' }} />
          <div className="modui-xypad-grid-line modui-xypad-grid-line-h" style={{ top: '75%' }} />
        </div>

        {/* Crosshair */}
        <div
          className="modui-xypad-crosshair"
          style={{
            left: `${posX}%`,
            top: `${posY}%`,
          }}
        >
          <div className="modui-xypad-crosshair-h" />
          <div className="modui-xypad-crosshair-v" />
          <div className="modui-xypad-handle" />
        </div>
      </div>
    </div>
  );
};

XYPad.displayName = 'XYPad';
