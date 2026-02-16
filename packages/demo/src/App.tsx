import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import '@mode-7/mod/dist/index.css';
import {
  AudioProvider,
  useAudioContext,
  // Sources
  ToneGenerator,
  NoiseGenerator,
  Microphone,
  MP3Deck,
  StreamingAudioDeck,
  // CV
  LFO,
  ADSR,
  Sequencer,
  // Processors
  Filter,
  Delay,
  Reverb,
  Compressor,
  Distortion,
  DiodeFilter,
  Panner,
  EQ,
  Chorus,
  Phaser,
  Flanger,
  Tremolo,
  BitCrusher,
  Limiter,
  Gate,
  AutoWah,
  RingModulator,
  // Mixers
  CrossFade,
  Mixer,
  // Output
  Monitor,
  // Visualizations
  Oscilloscope,
  SpectrumAnalyzer,
  LevelMeter,
} from '@mode-7/mod';
import { ModuleWrapper } from './components/ModuleWrapper';
import { ModuleRenderer } from './components/ModuleRenderer';
import { Sidebar } from './components/Sidebar';
import { CanvasArea } from './components/CanvasArea';
import { MODULE_DEFINITIONS } from './moduleDefinitions';
import './App.css';
import {
  HoveredPort,
  Position,
  Port,
  ModuleData,
  Connection,
  SketchModule,
  SketchConnection,
  SketchData,
  DraggingConnectionState,
  SidebarDragModuleState,
} from './types';

function ModularSynth() {
  const audioContext = useAudioContext();
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [moduleParams, setModuleParams] = useState<Record<string, Record<string, any>>>({});
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [contentSize, setContentSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [requiresUserGesture, setRequiresUserGesture] = useState(false);
  const [draggingConnection, setDraggingConnection] = useState<DraggingConnectionState | null>(null);
  const [hoveredPort, setHoveredPort] = useState<HoveredPort | null>(null);
  const [sidebarDragModule, setSidebarDragModule] = useState<SidebarDragModuleState | null>(null);
  const [sidebarDragPoint, setSidebarDragPoint] = useState<Position | null>(null);
  const pendingSidebarDragRef = useRef<{ moduleType: string; startX: number; startY: number } | null>(null);
  const [isSidebarDragActive, setSidebarDragActive] = useState(false);
  const sidebarDragModuleRef = useRef<SidebarDragModuleState | null>(sidebarDragModule);
  const getIsMobileView = () => (typeof window !== 'undefined' ? window.innerWidth < 900 : false);
  const lastIsMobileRef = useRef(getIsMobileView());
  const [isMobileView, setIsMobileView] = useState(getIsMobileView);
  const [isSidebarOpen, setSidebarOpen] = useState(() => !getIsMobileView());
  const [zoom, setZoom] = useState(0.6);
  const zoomRef = useRef(0.6);
  const zoomStep = 0.05;
  const minZoom = 0.25;
  const maxZoom = 1;
  const pinchSensitivity = 600;
  const lastPinchDistanceRef = useRef<number | null>(null);
  const DRAG_THRESHOLD = 8;

  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasScaleRef = useRef<HTMLDivElement>(null);
  const mousePosRef = useRef<Position>({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0, pointerId: 0 });
  const isCanvasPanningRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const portPositionCacheRef = useRef<Map<string, Position>>(new Map());

  // Create stream refs map
  const streamRefs = useRef<Map<string, any>>(new Map());

  const getStreamRef = (portId: string) => {
    if (!streamRefs.current.has(portId)) {
      streamRefs.current.set(portId, { current: null });
    }
    return streamRefs.current.get(portId);
  };

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const clampZoom = (value: number) => Math.min(maxZoom, Math.max(minZoom, value));
  // const handleZoomChange = (value: number) => setZoom(() => clampZoom(value));
  const zoomIn = () => setZoom(prev => clampZoom(prev + zoomStep));
  const zoomOut = () => setZoom(prev => clampZoom(prev - zoomStep));
  const getPinchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const [touchA, touchB] = [touches[0], touches[1]];
    const dx = touchA.clientX - touchB.clientX;
    const dy = touchA.clientY - touchB.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleCanvasTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      lastPinchDistanceRef.current = getPinchDistance(event.touches);
      // event.preventDefault();
    }
  };

  const handleCanvasTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2 && lastPinchDistanceRef.current !== null) {
      const nextDistance = getPinchDistance(event.touches);
      const zoomDelta = (nextDistance - lastPinchDistanceRef.current) / pinchSensitivity;
      setZoom(prev => clampZoom(prev + zoomDelta));
      lastPinchDistanceRef.current = nextDistance;
      event.preventDefault();
    }
  };

  const handleCanvasTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length < 2) {
      lastPinchDistanceRef.current = null;
    }
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const toCanvasPoint = (clientX: number, clientY: number) => {
    const contentRect = contentRef.current?.getBoundingClientRect();
    const currentZoom = zoomRef.current || 1;
    if (!contentRect || currentZoom === 0) return null;
    return {
      x: (clientX - contentRect.left) / currentZoom,
      y: (clientY - contentRect.top) / currentZoom,
    };
  };

  const isPointOverCanvas = useCallback((clientX: number, clientY: number) => {
    const canvasRect = contentRef.current?.getBoundingClientRect();
    if (!canvasRect) return false;
    return clientX >= canvasRect.left
      && clientX <= canvasRect.right
      && clientY >= canvasRect.top
      && clientY <= canvasRect.bottom;
  }, []);

  const updateSidebarDragPoint = useCallback((clientX: number, clientY: number) => {
    if (!isPointOverCanvas(clientX, clientY)) {
      setSidebarDragPoint(null);
      return;
    }
    const point = toCanvasPoint(clientX, clientY);
    setSidebarDragPoint(point);
  }, [isPointOverCanvas]);

  const cloneParams = (params: Record<string, any>) => {
    try {
      return JSON.parse(JSON.stringify(params));
    } catch {
      return { ...params };
    }
  };

  const getDefaultParams = (type: string) => {
    const definition = MODULE_DEFINITIONS[type];
    return cloneParams(definition?.defaultParams ?? {});
  };

  const createModuleData = (type: string, position: Position, overrides?: { id?: string; enabled?: boolean }) => {
    const definition = MODULE_DEFINITIONS[type];
    if (!definition) return null;

    const id = overrides?.id || `module-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const ports: Port[] = [];

    // Create input ports based on definition
    for (let i = 0; i < definition.inputs; i++) {
      const suffix = definition.inputIds?.[i] ?? `in-${i}`;
      const portId = `${id}-${suffix}`;
      const label = definition.inputLabels?.[i]
        ?? (definition.inputs === 1 ? 'In' : `In ${i + 1}`);
      ports.push({
        id: portId,
        type: 'input',
        label,
      });
    }

    // Create output ports based on definition
    for (let i = 0; i < definition.outputs; i++) {
      const portId = `${id}-out-${i}`;
      const label = definition.outputLabels?.[i]
        ?? (definition.outputs === 1 ? 'Out' : `Out ${i + 1}`);
      ports.push({
        id: portId,
        type: 'output',
        label,
      });
    }

    const newModule: ModuleData = {
      id,
      type,
      position,
      ports,
      color: definition.color,
      enabled: overrides?.enabled ?? true,
    };
    return newModule;
  };

  const addModule = useCallback((type: string, position?: Position) => {
    const defaultPosition = position || { x: 100 + modules.length * 20, y: 100 + modules.length * 20 };
    const newModule = createModuleData(type, defaultPosition);
    if (!newModule) return;
    setModules([...modules, newModule]);
    setModuleParams(prev => ({
      ...prev,
      [newModule.id]: getDefaultParams(type),
    }));
  }, [modules]);

  const handleAddModule = (type: string, position?: Position) => {
    addModule(type, position);
  };

  useEffect(() => {
    sidebarDragModuleRef.current = sidebarDragModule;
  }, [sidebarDragModule]);

  useEffect(() => {
    if (!isSidebarDragActive) return;

    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();
      const pending = pendingSidebarDragRef.current;

      if (pending && !sidebarDragModuleRef.current) {
        const dx = event.clientX - pending.startX;
        const dy = event.clientY - pending.startY;
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
          const moduleState = { moduleType: pending.moduleType };
          sidebarDragModuleRef.current = moduleState;
          setSidebarDragModule(moduleState);
        }
      }

      if (sidebarDragModuleRef.current) {
        updateSidebarDragPoint(event.clientX, event.clientY);
      }
    };

    const handlePointerEnd = (event: PointerEvent) => {
      event.preventDefault();
      if (sidebarDragModuleRef.current && isPointOverCanvas(event.clientX, event.clientY)) {
        const point = toCanvasPoint(event.clientX, event.clientY);
        if (point) {
          addModule(sidebarDragModuleRef.current.moduleType, point);
        }
      }
      setSidebarDragModule(null);
      setSidebarDragPoint(null);
      pendingSidebarDragRef.current = null;
      setSidebarDragActive(false);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
    };
  }, [isSidebarDragActive, addModule, updateSidebarDragPoint, isPointOverCanvas]);

  const moveModule = (id: string, position: Position) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, position } : m));
    clearPortPositionCache();
  };

  const deleteModule = (id: string) => {
    setModules(prev => prev.filter(m => m.id !== id));
    // Also remove connections to/from this module
    setConnections(prev => prev.filter(c =>
      c.from.moduleId !== id && c.to.moduleId !== id
    ));
    setModuleParams(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const toggleModuleEnabled = (id: string) => {
    setModules(prev => prev.map(m =>
      m.id === id ? { ...m, enabled: !m.enabled } : m
    ));
  };

  // Check if a module type supports the enabled prop
  const supportsEnabled = (moduleType: string): boolean => {
    const definition = MODULE_DEFINITIONS[moduleType];
    return definition && (definition.category === 'processor' || definition.category === 'mixer');
  };

  // Clear port position cache when modules move
  const clearPortPositionCache = () => {
    portPositionCacheRef.current.clear();
  };

  useLayoutEffect(() => {
    clearPortPositionCache();
    setLayoutVersion((prev) => prev + 1);
    if (!canvasRef.current || !contentRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const moduleEls = contentRef.current.querySelectorAll('.module-wrapper');
    let maxRight = canvasRect.width;
    let maxBottom = canvasRect.height;
    moduleEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const right = rect.right - canvasRect.left + canvasRef.current!.scrollLeft;
      const bottom = rect.bottom - canvasRect.top + canvasRef.current!.scrollTop;
      if (right > maxRight) maxRight = right;
      if (bottom > maxBottom) maxBottom = bottom;
    });
    const padding = 200;
    setContentSize({ width: maxRight + padding, height: maxBottom + padding });
  }, [modules]);

  useEffect(() => {
    const handleResize = () => {
      const nextIsMobile = getIsMobileView();
      setIsMobileView(nextIsMobile);
      if (lastIsMobileRef.current !== nextIsMobile) {
        setSidebarOpen(!nextIsMobile);
        lastIsMobileRef.current = nextIsMobile;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    clearPortPositionCache();
    setLayoutVersion(prev => prev + 1);
  }, [zoom]);

  // Get position of a port element with caching
  const getPortPosition = (moduleId: string, portId: string): Position | null => {
    const cacheKey = `${moduleId}-${portId}`;

    // Check cache first
    if (portPositionCacheRef.current.has(cacheKey)) {
      return portPositionCacheRef.current.get(cacheKey)!;
    }

    // Find the port dot element directly
    const portDot = document.querySelector(
      `[data-module-id="${moduleId}"][data-port-id="${portId}"] .port-dot`
    ) as HTMLElement;

    if (!portDot) return null;

    const dotRect = portDot.getBoundingClientRect();
    const scaleRect = canvasScaleRef.current?.getBoundingClientRect();
    const contentRect = scaleRect ?? contentRef.current?.getBoundingClientRect();
    if (!contentRect) return null;

    const scale = zoomRef.current || 1;
    const position = {
      x: (dotRect.left + dotRect.width / 2 - contentRect.left) / scale,
      y: (dotRect.top + dotRect.height / 2 - contentRect.top) / scale,
    };

    // Cache the result
    portPositionCacheRef.current.set(cacheKey, position);

    return position;
  };

  // Handle starting to drag a connection
  const handlePortMouseDown = (
    moduleId: string,
    portId: string,
    portType: 'input' | 'output',
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    event.stopPropagation();

    const point = toCanvasPoint(event.clientX, event.clientY);
    if (!point) return;

    setDraggingConnection({
      from: { moduleId, portId },
      mousePos: point,
      startPortType: portType,
    });
  };

  // Handle mouse move while dragging - use RAF for smooth updates
  const updateHoveredPortFromPoint = (clientX: number, clientY: number) => {
    if (clientX == null || clientY == null) {
      setHoveredPort(null);
      return;
    }
    const element = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const portEl = element?.closest('.port') as HTMLElement | null;
    if (portEl && portEl.dataset.moduleId && portEl.dataset.portId) {
      setHoveredPort({ moduleId: portEl.dataset.moduleId, portId: portEl.dataset.portId });
    } else {
      setHoveredPort(null);
    }
  };

  const updateDraggingConnectionPosition = (clientX: number, clientY: number) => {
    if (!draggingConnection || !canvasRef.current) return;

    const point = toCanvasPoint(clientX, clientY);
    if (!point) return;
    mousePosRef.current = point;

    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        setDraggingConnection(prev => (prev ? { ...prev, mousePos: mousePosRef.current } : null));
        rafIdRef.current = null;
      });
    }
    updateHoveredPortFromPoint(clientX, clientY);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    updateDraggingConnectionPosition(e.clientX, e.clientY);
  };

  // Handle mouse up to complete connection
  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    updateDraggingConnectionPosition(event.clientX, event.clientY);

    if (!isCanvasPanningRef.current) return;

    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const deltaX = event.clientX - panStartRef.current.x;
    const deltaY = event.clientY - panStartRef.current.y;
    canvasEl.scrollLeft = panStartRef.current.scrollLeft - deltaX;
    canvasEl.scrollTop = panStartRef.current.scrollTop - deltaY;
    event.preventDefault();
  };

  const stopCanvasPan = () => {
    if (!isCanvasPanningRef.current) return;
    const canvasEl = canvasRef.current;
    if (canvasEl && panStartRef.current.pointerId) {
      canvasEl.releasePointerCapture(panStartRef.current.pointerId);
    }
    isCanvasPanningRef.current = false;
  };

  const handleCanvasPointerUp = () => {
    finalizeConnection();
    stopCanvasPan();
  };

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    if (sidebarDragModule) {
      event.preventDefault();
      return;
    }

    const target = event.target as HTMLElement;
    const isValidPanTarget = !target.closest('.module-wrapper')
      && !target.closest('.port')
      && !target.closest('.canvas-controls')
      && !target.closest('.sidebar')
      && !target.closest('.sidebar-toggle')
      && !target.closest('.wires-svg');

    if (!isValidPanTarget) return;

    isCanvasPanningRef.current = true;
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: canvasRef.current.scrollLeft,
      scrollTop: canvasRef.current.scrollTop,
      pointerId: event.pointerId,
    };
    canvasRef.current.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const finalizeConnection = () => {
    if (!draggingConnection) return;

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (hoveredPort) {
      const module = modules.find(m => m.id === hoveredPort.moduleId);
      const port = module?.ports.find(p => p.id === hoveredPort.portId);

      if (port && hoveredPort.moduleId !== draggingConnection.from.moduleId) {
        let fromPort = null;
        let toPort = null;
        const startedOnOutput = draggingConnection.startPortType === 'output';

        if (startedOnOutput && port.type === 'input') {
          fromPort = draggingConnection.from;
          toPort = hoveredPort;
        } else if (!startedOnOutput && port.type === 'output') {
          fromPort = hoveredPort;
          toPort = draggingConnection.from;
        }

        if (fromPort && toPort) {
          const existingConnection = connections.find(c => c.to.portId === toPort.portId);
          if (existingConnection) {
            flushSync(() => {
              setConnections(prev => prev.filter(c => c.id !== existingConnection.id));
            });
          }

          const newConnection: Connection = {
            id: `conn-${Date.now()}`,
            from: { moduleId: fromPort.moduleId, portId: fromPort.portId },
            to: { moduleId: toPort.moduleId, portId: toPort.portId },
          };

          setConnections(prev => [...prev, newConnection]);
        }
      }
    }

    setDraggingConnection(null);
    setHoveredPort(null);
  };

  const handleCanvasMouseUp = () => {
    finalizeConnection();
  };

  // Handle clicking on a wire to delete it
  const handleWireClick = (connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Find the connection being removed
    const connectionToRemove = connections.find(c => c.id === connectionId);

    // Remove the connection
    setConnections(prev => prev.filter(c => c.id !== connectionId));

    // Important: Don't clean up the stream ref here - other connections might use the same output port
    // The inputStreams mapping will handle returning null for disconnected inputs
  };

  // Check if a port is connected
  const isPortConnected = (portId: string): boolean => {
    return connections.some(c => c.from.portId === portId || c.to.portId === portId);
  };

  // Handle canvas drop for adding modules
  const handleCanvasDrop = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const moduleType = (e as any).dataTransfer?.getData('moduleType');
      if (moduleType && canvasRef.current) {
        const point = toCanvasPoint(e.clientX, e.clientY);
        if (!point) return;
        handleAddModule(moduleType, point);
      }
  };

  const handleCanvasDragOver = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if ((e as any).dataTransfer) {
      (e as any).dataTransfer.dropEffect = 'copy';
    }
  };

  // Helper to render a draggable module button
  const startSidebarDrag = (type: string) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    pendingSidebarDragRef.current = {
      moduleType: type,
      startX: event.clientX,
      startY: event.clientY,
    };
    setSidebarDragModule(null);
    setSidebarDragPoint(null);
    setSidebarDragActive(true);
  };

  const startSidebarTouchDrag = (type: string) => (event: React.TouchEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!event.touches.length) return;
    pendingSidebarDragRef.current = {
      moduleType: type,
      startX: event.touches[0].clientX,
      startY: event.touches[0].clientY,
    };
    setSidebarDragModule(null);
    setSidebarDragPoint(null);
    setSidebarDragActive(true);
  };

  const updateModuleParam = (moduleId: string, key: string, value: any) => {
    setModuleParams(prev => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] || {}),
        [key]: value,
      },
    }));
  };

  const handleSaveSketch = () => {
    const sketch: SketchData = {
      version: 1,
      modules: modules.map(module => ({
        id: module.id,
        type: module.type,
        position: module.position,
        enabled: module.enabled ?? true,
        params: (() => {
          const rawParams = moduleParams[module.id] ? moduleParams[module.id] : getDefaultParams(module.type);
          const params = module.type === 'Fluidsynth' || module.type === 'MidiPlayer'
            ? { ...rawParams }
            : cloneParams(rawParams);
          if (module.type === 'MP3Deck' && typeof params.src === 'string' && params.src.startsWith('blob:')) {
            delete params.src;
          }
          // Keep embedded data URLs for MidiPlayer, and conditionally for Fluidsynth.
          if (module.type === 'Fluidsynth') {
            const keepSf2 = params.keepSoundFontInSketch === true;
            if (!keepSf2 && typeof params.soundFontFileDataUrl === 'string' && params.soundFontFileDataUrl.startsWith('data:')) {
              delete params.soundFontFileDataUrl;
            }
          }
          return params;
        })(),
      })),
      connections: connections.map(connection => ({
        id: connection.id,
        from: connection.from,
        to: connection.to,
      })),
    };

    const blob = new Blob([JSON.stringify(sketch, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `mod-sketch-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadSketch = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as SketchData;
      if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.modules) || !Array.isArray(parsed.connections)) {
        throw new Error('Unsupported sketch format.');
      }

      const nextModules = parsed.modules
        .map(module => createModuleData(module.type, module.position, { id: module.id, enabled: module.enabled }))
        .filter((module): module is ModuleData => module !== null);

      const nextModuleParams: Record<string, Record<string, any>> = {};
      parsed.modules.forEach(module => {
        if (!MODULE_DEFINITIONS[module.type]) return;
        const defaults = getDefaultParams(module.type);
        nextModuleParams[module.id] = {
          ...defaults,
          ...(module.params ? cloneParams(module.params) : {}),
        };
      });

      const moduleIdSet = new Set(nextModules.map(module => module.id));
      const portIdSet = new Set(nextModules.flatMap(module => module.ports.map(port => port.id)));

      const nextConnections = parsed.connections
        .filter(connection => moduleIdSet.has(connection.from.moduleId)
          && moduleIdSet.has(connection.to.moduleId)
          && portIdSet.has(connection.from.portId)
          && portIdSet.has(connection.to.portId))
        .map(connection => ({
          id: connection.id || `conn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          from: connection.from,
          to: connection.to,
        }));

      // Preserve existing refs for matching port ids so modules keep their outputs wired.
      streamRefs.current.forEach((_, portId) => {
        if (!portIdSet.has(portId)) {
          streamRefs.current.delete(portId);
        }
      });
      clearPortPositionCache();
      setModules(nextModules);
      setConnections(nextConnections);
      setModuleParams(nextModuleParams);
      setRequiresUserGesture(true);
    } catch (error) {
      console.error('Failed to load sketch.', error);
      alert('Failed to load sketch. Please check the file and try again.');
    }
  };

  const handleUnlockAudio = async () => {
    if (!requiresUserGesture) return;
    if (audioContext && audioContext.state !== 'running') {
      try {
        await audioContext.resume();
      } catch {
        // Ignore; try again on the next gesture.
      }
    }
    setRequiresUserGesture(false);
  };

  const handleSketchFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleLoadSketch(file);
    event.target.value = '';
  };

  const isSaveDisabled = modules.length === 0 && connections.length === 0;
  const zoomPercent = Math.round(zoom * 100);
  const appClassName = ['app', isMobileView ? 'mobile-view' : '', isSidebarOpen ? 'sidebar-open' : ''].filter(Boolean).join(' ');

  return (
    <div className={appClassName}>
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        isMobileView={isMobileView}
        handleSaveSketch={handleSaveSketch}
        handleSketchFileChange={handleSketchFileChange}
        startSidebarDrag={startSidebarDrag}
        startSidebarTouchDrag={startSidebarTouchDrag}
        handleAddModule={handleAddModule}
        isSaveDisabled={isSaveDisabled}
      />
      <CanvasArea
        canvasRef={canvasRef}
        contentRef={contentRef}
        canvasScaleRef={canvasScaleRef}
        contentSize={contentSize}
        layoutVersion={layoutVersion}
        zoom={zoom}
        zoomPercent={zoomPercent}
        minZoom={minZoom}
        maxZoom={maxZoom}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        handleCanvasMouseMove={handleCanvasMouseMove}
        handleCanvasMouseUp={handleCanvasMouseUp}
        handleCanvasDragOver={handleCanvasDragOver}
        handleCanvasDrop={handleCanvasDrop}
        handleCanvasPointerDown={handleCanvasPointerDown}
        handleCanvasPointerMove={handleCanvasPointerMove}
        handleCanvasPointerUp={handleCanvasPointerUp}
        handleCanvasTouchStart={handleCanvasTouchStart}
        handleCanvasTouchMove={handleCanvasTouchMove}
        handleCanvasTouchEnd={handleCanvasTouchEnd}
        draggingConnection={draggingConnection}
        connections={connections}
        sidebarDragModule={sidebarDragModule}
        sidebarDragPoint={sidebarDragPoint}
        getPortPosition={getPortPosition}
        handleWireClick={handleWireClick}
        isMobileView={isMobileView}
        toggleSidebar={toggleSidebar}
        handleUnlockAudio={handleUnlockAudio}
      >
        {modules.map((module) => {
          const inputPorts = module.ports.filter(p =>
            p.type === 'input'
            && !p.label.startsWith('CV')
            && p.label !== 'Gate'
            && p.label !== 'Clock'
            && p.label !== 'Reset'
            && p.label !== 'Trigger'
            && p.label !== 'Pitch'
            && p.label !== 'Stop'
          );
          const outputPorts = module.ports.filter(p => p.type === 'output');
          const cvPorts = module.ports.filter(p =>
            p.type === 'input'
            && (p.label === 'CV' || p.label === 'Gate' || p.label === 'Clock' || p.label === 'Reset' || p.label === 'Trigger' || p.label === 'Start' || p.label === 'Pitch' || p.label === 'Stop')
          );

          const inputStreams = inputPorts.map(port => {
            const connection = connections.find(c => c.to.portId === port.id);
            if (requiresUserGesture) return null;
            return connection ? getStreamRef(connection.from.portId) : null;
          });

          const cvInputStreams: { [key: string]: React.RefObject<any> | null } = {};
          cvPorts.forEach(port => {
            const connection = connections.find(c => c.to.portId === port.id);
            const key = port.id.split('-').slice(-2).join('-');
            cvInputStreams[key] = requiresUserGesture ? null : (connection ? getStreamRef(connection.from.portId) : null);
          });

          const outputStreams = outputPorts.map(port => getStreamRef(port.id));

          return (
            <ModuleWrapper
              key={module.id}
              id={module.id}
              type={module.type}
              position={module.position}
              ports={module.ports}
              color={module.color}
              onMove={moveModule}
              onDelete={deleteModule}
              onPortMouseDown={handlePortMouseDown}
              onPortMouseEnter={(moduleId, portId) => setHoveredPort({ moduleId, portId })}
              onPortMouseLeave={() => setHoveredPort(null)}
              isPortConnected={isPortConnected}
              hoveredPortId={hoveredPort?.moduleId === module.id ? hoveredPort.portId : undefined}
              enabled={module.enabled}
              onEnabledToggle={toggleModuleEnabled}
              supportsEnabled={supportsEnabled(module.type)}
            >
              <ModuleRenderer
                moduleId={module.id}
                moduleType={module.type}
                inputStreams={inputStreams}
                outputStreams={outputStreams}
                cvInputStreams={cvInputStreams}
                enabled={module.enabled}
                params={moduleParams[module.id] || getDefaultParams(module.type)}
                onParamChange={updateModuleParam}
              />
            </ModuleWrapper>
          );
        })}
      </CanvasArea>
    </div>
  );
}

function App2() {
  return (
    <AudioProvider>
      <ModularSynth />
    </AudioProvider>
  );
}

export default App2;
