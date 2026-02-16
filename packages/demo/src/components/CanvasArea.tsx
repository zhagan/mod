import React, { useMemo } from 'react';
import { SidebarIcon } from 'lucide-react';
import { MODULE_DEFINITIONS } from '../moduleDefinitions';
import {
  Connection,
  Position,
  DraggingConnectionState,
  SidebarDragModuleState,
} from '../types';

interface CanvasAreaProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  canvasScaleRef: React.RefObject<HTMLDivElement>;
  contentSize: { width: number; height: number };
  layoutVersion: number;
  zoom: number;
  zoomPercent: number;
  minZoom: number;
  maxZoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  handleCanvasMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleCanvasMouseUp: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleCanvasDragOver: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleCanvasDrop: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleCanvasPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  handleCanvasPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  handleCanvasPointerUp: () => void;
  handleCanvasTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void;
  handleCanvasTouchMove: (event: React.TouchEvent<HTMLDivElement>) => void;
  handleCanvasTouchEnd: (event: React.TouchEvent<HTMLDivElement>) => void;
  draggingConnection: DraggingConnectionState | null;
  connections: Connection[];
  sidebarDragModule: SidebarDragModuleState | null;
  sidebarDragPoint: Position | null;
  getPortPosition: (moduleId: string, portId: string) => Position | null;
  handleWireClick: (connectionId: string, event: React.MouseEvent<SVGPathElement>) => void;
  isMobileView: boolean;
  toggleSidebar: () => void;
  handleUnlockAudio: () => void;
  breadcrumb?: string;
  onBack?: () => void;
  children: React.ReactNode;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  canvasRef,
  contentRef,
  canvasScaleRef,
  contentSize,
  layoutVersion,
  zoom,
  zoomPercent,
  minZoom,
  maxZoom,
  zoomIn,
  zoomOut,
  handleCanvasMouseMove,
  handleCanvasMouseUp,
  handleCanvasDragOver,
  handleCanvasDrop,
  handleCanvasPointerDown,
  handleCanvasPointerMove,
  handleCanvasPointerUp,
  handleCanvasTouchStart,
  handleCanvasTouchMove,
  handleCanvasTouchEnd,
  draggingConnection,
  connections,
  sidebarDragModule,
  sidebarDragPoint,
  getPortPosition,
  handleWireClick,
  isMobileView,
  toggleSidebar,
  handleUnlockAudio,
  breadcrumb,
  onBack,
  children,
}) => {
  const renderedConnections = useMemo(() => connections.map((conn) => {
    const fromPos = getPortPosition(conn.from.moduleId, conn.from.portId);
    const toPos = getPortPosition(conn.to.moduleId, conn.to.portId);
    if (!fromPos || !toPos) return null;
    const midX = (fromPos.x + toPos.x) / 2;
    return {
      id: conn.id,
      path: `M ${fromPos.x} ${fromPos.y} C ${midX} ${fromPos.y}, ${midX} ${toPos.y}, ${toPos.x} ${toPos.y}`,
    };
  }), [connections, layoutVersion, getPortPosition]);

  return (
    <div
      ref={canvasRef}
      className="canvas"
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onDragOver={handleCanvasDragOver}
      onDrop={handleCanvasDrop}
      onPointerDown={(event) => {
        handleUnlockAudio();
        handleCanvasPointerDown(event);
      }}
      onPointerMove={handleCanvasPointerMove}
      onPointerUp={handleCanvasPointerUp}
      onPointerCancel={handleCanvasPointerUp}
      onTouchStart={handleCanvasTouchStart}
      onTouchMove={handleCanvasTouchMove}
      onTouchEnd={handleCanvasTouchEnd}
      onTouchCancel={handleCanvasTouchEnd}
    >
      <div className="canvas-controls">
        {(onBack || breadcrumb) && (
          <div className="breadcrumb">
            {onBack && (
              <button
                type="button"
                className="breadcrumb-back"
                onClick={onBack}
                onPointerDown={(event) => event.stopPropagation()}
              >
                ← Back
              </button>
            )}
            {breadcrumb && <span className="breadcrumb-label">{breadcrumb}</span>}
          </div>
        )}
        <div className="zoom-controls">
          <button type="button" onClick={zoomOut} disabled={zoom <= minZoom} aria-label="Zoom out">
            −
          </button>
          <span className="zoom-label">{zoomPercent}%</span>
          <button type="button" onClick={zoomIn} disabled={zoom >= maxZoom} aria-label="Zoom in">
            +
          </button>
        </div>
        {isMobileView && (
          <button
            type="button"
            className="sidebar-toggle"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={toggleSidebar}
            aria-label="Toggle module list"
          >
            <SidebarIcon />
          </button>
        )}
      </div>
      <div
        ref={contentRef}
        className="canvas-content"
        style={{ width: contentSize.width || '100%', height: contentSize.height || '100%' }}
      >
        <div
          ref={canvasScaleRef}
          className="canvas-scale"
          style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}
        >
          <svg
            className="wires-svg"
            width="400%"
            height="400%"
          >
            {renderedConnections.map((conn) => {
              if (!conn) return null;
              return (
                <g key={conn.id}>
                  <path
                    d={conn.path}
                    stroke="transparent"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    style={{ cursor: 'pointer' }}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => handleWireClick(conn.id, event)}
                  />
                  <path
                    d={conn.path}
                    stroke="#4CAF50"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    style={{
                      filter: 'drop-shadow(0 0 4px rgba(76, 175, 80, 0.5))',
                      pointerEvents: 'none',
                    }}
                  />
                </g>
              );
            })}
            {draggingConnection && (() => {
              const fromPos = getPortPosition(draggingConnection.from.moduleId, draggingConnection.from.portId);
              if (!fromPos) return null;
              const midX = (fromPos.x + draggingConnection.mousePos.x) / 2;
              const path = `M ${fromPos.x} ${fromPos.y} C ${midX} ${fromPos.y}, ${midX} ${draggingConnection.mousePos.y}, ${draggingConnection.mousePos.x} ${draggingConnection.mousePos.y}`;
              return (
                <path
                  d={path}
                  stroke="#4CAF50"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.6"
                  strokeDasharray="5,5"
                  style={{ pointerEvents: 'none' }}
                />
              );
            })()}
          </svg>
          {sidebarDragPoint && sidebarDragModule && (
            <div
              className="sidebar-drag-preview"
              style={{
                left: sidebarDragPoint.x - 16,
                top: sidebarDragPoint.y - 16,
              }}
            >
              {MODULE_DEFINITIONS[sidebarDragModule.moduleType]?.label || 'Module'}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};
