import React, { useState, useRef, useEffect } from 'react';
import './ModuleWrapper.css';

interface Position {
  x: number;
  y: number;
}

interface Port {
  id: string;
  type: 'input' | 'output';
  label: string;
}

interface ModuleWrapperProps {
  id: string;
  type: string;
  position: Position;
  ports: Port[];
  color?: string;
  onMove: (id: string, position: Position) => void;
  onDelete: (id: string) => void;
  onPortMouseDown?: (moduleId: string, portId: string, portType: 'input' | 'output', event: React.PointerEvent<HTMLDivElement>) => void;
  onPortMouseEnter?: (moduleId: string, portId: string) => void;
  onPortMouseLeave?: () => void;
  isPortConnected?: (portId: string) => boolean;
  hoveredPortId?: string;
  enabled?: boolean;
  onEnabledToggle?: (id: string) => void;
  supportsEnabled?: boolean;
  children: React.ReactNode;
}

// Helper function to determine if a color is light or dark
const isLightColor = (color?: string): boolean => {
  if (!color) return false;

  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5;
};

export const ModuleWrapper = React.memo<ModuleWrapperProps>(({
  id,
  type,
  position,
  ports,
  color,
  onMove,
  onDelete,
  onPortMouseDown,
  onPortMouseEnter,
  onPortMouseLeave,
  isPortConnected,
  hoveredPortId,
  enabled = true,
  onEnabledToggle,
  supportsEnabled = false,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const moduleRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });

  const inputPorts = ports.filter(p => p.type === 'input');
  const outputPorts = ports.filter(p => p.type === 'output');

  const textColor = isLightColor(color) ? '#2a2a2a' : '#ffffff';

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Don't start dragging if clicking on a port or control
    if ((e.target as HTMLElement).closest('.port') ||
        (e.target as HTMLElement).closest('input') ||
        (e.target as HTMLElement).closest('button') ||
        (e.target as HTMLElement).closest('select') ||
        (e.target as HTMLElement).closest('.select-trigger') ||
        (e.target as HTMLElement).closest('.select-content') ||
        (e.target as HTMLElement).closest('.select-item')) {
=======
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const controlSelectors = [
      '.port',
      'input',
      'button',
      'select',
      '.modui-knob',
      '.modui-knob-control',
      '.modui-knob-center',
      '.modui-knob-wrapper',
      '.modui-knob-svg',
      '.modui-knob-track',
      '.modui-knob-value-arc',
      '.modui-knob-indicator',
      '.modui-knob-button',
      '.modui-knob-button-left',
      '.modui-knob-button-right',
      '.modui-slider',
      '.modui-slider-control',
      '.modui-slider-input',
      '.modui-slider-button',
      '.modui-slider-button-left',
      '.modui-slider-button-right',
      '.modui-button',
      '.modui-select',
      '.select-trigger',
      '.select-content',
      '.select-item',
      '.modui-text-input',
      'svg',
      'path',
      'circle',
      'line',
    ];

    if (controlSelectors.some(selector => Boolean(target.closest(selector)))) {
>>>>>>> Stashed changes
      return;
    }

    e.preventDefault();
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return undefined;

    const handlePointerMove = (e: PointerEvent) => {
      onMove(id, {
        x: e.clientX - dragOffsetRef.current.x,
        y: e.clientY - dragOffsetRef.current.y,
      });
    };

    const stopDragging = () => setIsDragging(false);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };
  }, [isDragging, id, onMove]);

  return (
    <div
      ref={moduleRef}
      className={`module-wrapper ${isDragging ? 'dragging' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        borderColor: color,
      }}
      onPointerDown={handlePointerDown}
    >
      <div className="module-wrapper-header" style={{ backgroundColor: color, color: textColor }}>
        <span className="module-wrapper-title">{type}</span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {supportsEnabled && onEnabledToggle && (
            <button
              className="module-wrapper-enabled-toggle"
              onClick={(e) => {
                e.stopPropagation();
                onEnabledToggle(id);
              }}
              title={enabled ? 'Bypass (disable)' : 'Enable'}
            >
              <span
                className="enabled-toggle-dot"
                style={{
                  backgroundColor: enabled ? '#00ff88' : '#ff4444',
                  boxShadow: enabled ? '0 0 6px rgba(0, 255, 136, 0.6)' : '0 0 6px rgba(255, 68, 68, 0.6)',
                }}
              />
            </button>
          )}
          <button
            className="module-wrapper-delete"
            style={{ color: textColor }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div className="module-wrapper-body">
        {/* Input ports on the left */}
        {inputPorts.length > 0 && (
          <div className="ports-column ports-left">
            {inputPorts.map((port) => {
              const connected = isPortConnected?.(port.id) || false;
              const hovered = hoveredPortId === port.id;
              return (
                <div
                  key={port.id}
                  className={`port port-input ${connected ? 'port-connected' : ''} ${hovered ? 'port-hovered' : ''}`}
                  data-module-id={id}
                  data-port-id={port.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onPortMouseDown?.(id, port.id, 'input', e);
                  }}
                  onMouseEnter={() => onPortMouseEnter?.(id, port.id)}
                  onMouseLeave={() => onPortMouseLeave?.()}
                  onPointerEnter={() => onPortMouseEnter?.(id, port.id)}
                  onPointerLeave={() => onPortMouseLeave?.()}
                  title={port.label}
                >
                  <div className="port-dot" />
                  <span className="port-label">{port.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Module content (audio component UI) */}
        <div className="module-wrapper-content">
          {children}
        </div>

        {/* Output ports on the right */}
        {outputPorts.length > 0 && (
          <div className="ports-column ports-right">
            {outputPorts.map((port) => {
              const connected = isPortConnected?.(port.id) || false;
              const hovered = hoveredPortId === port.id;
              return (
                <div
                  key={port.id}
                  className={`port port-output ${connected ? 'port-connected' : ''} ${hovered ? 'port-hovered' : ''}`}
                  data-module-id={id}
                  data-port-id={port.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onPortMouseDown?.(id, port.id, 'output', e);
                  }}
                  onMouseEnter={() => onPortMouseEnter?.(id, port.id)}
                  onMouseLeave={() => onPortMouseLeave?.()}
                  onPointerEnter={() => onPortMouseEnter?.(id, port.id)}
                  onPointerLeave={() => onPortMouseLeave?.()}
                  title={port.label}
                >
                  <div className="port-dot" />
                  <span className="port-label">{port.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
