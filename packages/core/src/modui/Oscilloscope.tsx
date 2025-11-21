import React, { useEffect, useRef } from 'react';
import './Oscilloscope.css';

export interface OscilloscopeProps {
  dataArray: Uint8Array;
  bufferLength: number;
  width?: number | string;
  height?: number | string;
  color?: string;
  lineWidth?: number;
  backgroundColor?: string;
  gridColor?: string;
  showGrid?: boolean;
  className?: string;
  canvasClassName?: string;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  dataArray,
  bufferLength,
  width = '100%',
  height = 150,
  color = '#00ff88',
  lineWidth = 2,
  backgroundColor = '#0a0a0a',
  gridColor = '#1a1a1a',
  showGrid = true,
  className = '',
  canvasClassName = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const canvasWidth = canvas.width / window.devicePixelRatio;
      const canvasHeight = canvas.height / window.devicePixelRatio;

      // Clear canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw grid
      if (showGrid) {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;

        // Horizontal grid lines
        for (let i = 0; i <= 4; i++) {
          const y = (canvasHeight / 4) * i;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvasWidth, y);
          ctx.stroke();
        }

        // Vertical grid lines
        for (let i = 0; i <= 8; i++) {
          const x = (canvasWidth / 8) * i;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvasHeight);
          ctx.stroke();
        }
      }

      // Draw waveform
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.beginPath();

      const sliceWidth = canvasWidth / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // Normalize to 0-2
        const y = (v * canvasHeight) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvasWidth, canvasHeight / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    draw();
  }, [dataArray, bufferLength, color, lineWidth, backgroundColor, gridColor, showGrid]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const containerClasses = [
    'modui-oscilloscope',
    className,
  ].filter(Boolean).join(' ');

  const canvasClasses = [
    'modui-oscilloscope-canvas',
    canvasClassName,
  ].filter(Boolean).join(' ');

  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div className={containerClasses} style={containerStyle}>
      <canvas ref={canvasRef} className={canvasClasses} />
    </div>
  );
};
