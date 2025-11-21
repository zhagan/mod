import React, { useEffect, useRef } from 'react';
import './SpectrumAnalyzer.css';

export interface SpectrumAnalyzerProps {
  dataArray: Uint8Array;
  bufferLength: number;
  width?: number | string;
  height?: number | string;
  barGap?: number;
  backgroundColor?: string;
  colorMode?: 'gradient' | 'solid';
  color?: string;
  className?: string;
  canvasClassName?: string;
}

export const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({
  dataArray,
  bufferLength,
  width = '100%',
  height = 150,
  barGap = 2,
  backgroundColor = '#0a0a0a',
  colorMode = 'gradient',
  color = '#00ff88',
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

      const barWidth = (canvasWidth / bufferLength) - barGap;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvasHeight;
        const x = i * (barWidth + barGap);
        const y = canvasHeight - barHeight;

        if (colorMode === 'gradient') {
          // Create gradient for each bar based on frequency
          const gradient = ctx.createLinearGradient(x, y, x, canvasHeight);
          const hue = (i / bufferLength) * 120; // 0 (red) to 120 (green)
          gradient.addColorStop(0, `hsl(${hue + 120}, 100%, 60%)`);
          gradient.addColorStop(1, `hsl(${hue + 120}, 100%, 30%)`);
          ctx.fillStyle = gradient;

          ctx.fillRect(x, y, barWidth, barHeight);

          // Add glow effect
          ctx.shadowBlur = 10;
          ctx.shadowColor = `hsl(${hue + 120}, 100%, 50%)`;
          ctx.fillRect(x, y, barWidth, barHeight);
          ctx.shadowBlur = 0;
        } else {
          // Solid color
          ctx.fillStyle = color;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Add glow effect
          ctx.shadowBlur = 10;
          ctx.shadowColor = color;
          ctx.fillRect(x, y, barWidth, barHeight);
          ctx.shadowBlur = 0;
        }
      }
    };

    draw();
  }, [dataArray, bufferLength, barGap, backgroundColor, colorMode, color]);

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
    'modui-spectrum-analyzer',
    className,
  ].filter(Boolean).join(' ');

  const canvasClasses = [
    'modui-spectrum-analyzer-canvas',
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
