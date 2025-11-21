import React, { useEffect, useRef } from 'react';
import './LevelMeter.css';

export interface LevelMeterProps {
  level: number;
  peak: number;
  isClipping: boolean;
  width?: number | string;
  height?: number | string;
  orientation?: 'horizontal' | 'vertical';
  backgroundColor?: string;
  showScale?: boolean;
  className?: string;
  canvasClassName?: string;
}

export const LevelMeter: React.FC<LevelMeterProps> = ({
  level,
  peak,
  isClipping,
  width = '100%',
  height = 60,
  orientation = 'horizontal',
  backgroundColor = '#0a0a0a',
  showScale = true,
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

      if (orientation === 'horizontal') {
        // Draw level bar (RMS)
        const levelWidth = level * canvasWidth;

        // Create gradient based on level
        const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
        gradient.addColorStop(0, '#00ff00');
        gradient.addColorStop(0.7, '#ffff00');
        gradient.addColorStop(0.9, '#ff8800');
        gradient.addColorStop(1, '#ff0000');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, levelWidth, canvasHeight);

        // Draw peak indicator
        if (peak > 0) {
          const peakX = peak * canvasWidth;
          ctx.fillStyle = isClipping ? '#ff0000' : '#ffffff';
          ctx.fillRect(peakX - 2, 0, 4, canvasHeight);

          // Add glow to peak
          if (isClipping) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff0000';
            ctx.fillRect(peakX - 2, 0, 4, canvasHeight);
            ctx.shadowBlur = 0;
          }
        }

        // Draw scale marks
        if (showScale) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';

          const marks = [0, 0.25, 0.5, 0.75, 1.0];
          marks.forEach(mark => {
            const x = mark * canvasWidth;
            ctx.fillRect(x, canvasHeight - 8, 1, 8);
            const db = mark === 0 ? '-∞' : `${Math.round(20 * Math.log10(mark))}`;
            ctx.fillText(db, x, canvasHeight - 10);
          });
        }

      } else {
        // Vertical orientation
        const levelHeight = level * canvasHeight;
        const y = canvasHeight - levelHeight;

        const gradient = ctx.createLinearGradient(0, canvasHeight, 0, 0);
        gradient.addColorStop(0, '#00ff00');
        gradient.addColorStop(0.7, '#ffff00');
        gradient.addColorStop(0.9, '#ff8800');
        gradient.addColorStop(1, '#ff0000');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, y, canvasWidth, levelHeight);

        // Draw peak indicator
        if (peak > 0) {
          const peakY = canvasHeight - (peak * canvasHeight);
          ctx.fillStyle = isClipping ? '#ff0000' : '#ffffff';
          ctx.fillRect(0, peakY - 2, canvasWidth, 4);

          if (isClipping) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff0000';
            ctx.fillRect(0, peakY - 2, canvasWidth, 4);
            ctx.shadowBlur = 0;
          }
        }

        // Draw scale marks for vertical
        if (showScale) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'right';

          const marks = [0, 0.25, 0.5, 0.75, 1.0];
          marks.forEach(mark => {
            const markY = canvasHeight - (mark * canvasHeight);
            ctx.fillRect(0, markY, 8, 1);
            const db = mark === 0 ? '-∞' : `${Math.round(20 * Math.log10(mark))}`;
            ctx.fillText(db, canvasWidth - 2, markY + 4);
          });
        }
      }
    };

    draw();
  }, [level, peak, isClipping, orientation, backgroundColor, showScale]);

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
    'modui-level-meter',
    `modui-level-meter-${orientation}`,
    className,
  ].filter(Boolean).join(' ');

  const canvasClasses = [
    'modui-level-meter-canvas',
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
