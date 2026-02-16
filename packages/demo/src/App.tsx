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
import { SubSketchRuntime } from './components/SubSketchRuntime';
import { MODULE_DEFINITIONS } from './moduleDefinitions';
import './App.css';
import {
  HoveredPort,
  Position,
  Port,
  ModuleData,
  Connection,
  SketchData,
  DraggingConnectionState,
  SidebarDragModuleState,
} from './types';

type EditorSnapshot = {
  modules: ModuleData[];
  connections: Connection[];
  moduleParams: Record<string, Record<string, any>>;
};

type LiveSubSketchSession = {
  moduleId: string;
  interfaceValue: any;
  isOpen: boolean;
  snapshot: EditorSnapshot;
};

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

  const [liveSubSketch, setLiveSubSketch] = useState<LiveSubSketchSession | null>(null);

  // Live sub-sketch editor state (kept mounted to preserve runtime state).
  const [subModules, setSubModules] = useState<ModuleData[]>([]);
  const [subConnections, setSubConnections] = useState<Connection[]>([]);
  const [subModuleParams, setSubModuleParams] = useState<Record<string, Record<string, any>>>({});
  const [subLayoutVersion, setSubLayoutVersion] = useState(0);
  const [subContentSize, setSubContentSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [subRequiresUserGesture, setSubRequiresUserGesture] = useState(false);
  const [subDraggingConnection, setSubDraggingConnection] = useState<DraggingConnectionState | null>(null);
  const [subHoveredPort, setSubHoveredPort] = useState<HoveredPort | null>(null);
  const [subSidebarDragModule, setSubSidebarDragModule] = useState<SidebarDragModuleState | null>(null);
  const [subSidebarDragPoint, setSubSidebarDragPoint] = useState<Position | null>(null);
  const subPendingSidebarDragRef = useRef<{ moduleType: string; startX: number; startY: number } | null>(null);
  const [isSubSidebarDragActive, setSubSidebarDragActive] = useState(false);
  const subSidebarDragModuleRef = useRef<SidebarDragModuleState | null>(subSidebarDragModule);
  const [subZoom, setSubZoom] = useState(0.6);
  const subZoomRef = useRef(0.6);
  const subLastPinchDistanceRef = useRef<number | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasScaleRef = useRef<HTMLDivElement>(null);
  const mousePosRef = useRef<Position>({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0, pointerId: 0 });
  const isCanvasPanningRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const portPositionCacheRef = useRef<Map<string, Position>>(new Map());

  const subCanvasRef = useRef<HTMLDivElement>(null);
  const subContentRef = useRef<HTMLDivElement>(null);
  const subCanvasScaleRef = useRef<HTMLDivElement>(null);
  const subMousePosRef = useRef<Position>({ x: 0, y: 0 });
  const subPanStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0, pointerId: 0 });
  const isSubCanvasPanningRef = useRef(false);
  const subRafIdRef = useRef<number | null>(null);
  const subPortPositionCacheRef = useRef<Map<string, Position>>(new Map());

  // Create stream refs map
  const [, bumpStreamVersion] = useState(0);
  const streamRefs = useRef<Map<string, any>>(new Map());

  const getStreamRef = (portId: string) => {
    if (!streamRefs.current.has(portId)) {
      let value: any = null;
      const reactiveRef = {
        get current() {
          return value;
        },
        set current(next: any) {
          const prev = value;
          value = next;
          if ((prev === null && next !== null) || (prev !== null && next === null)) {
            bumpStreamVersion(v => v + 1);
          }
        },
      };
      streamRefs.current.set(portId, reactiveRef);
    }
    return streamRefs.current.get(portId);
  };

  const [, bumpSubStreamVersion] = useState(0);
  const subStreamRefs = useRef<Map<string, any>>(new Map());
  const getSubStreamRef = (portId: string) => {
    if (!subStreamRefs.current.has(portId)) {
      let value: any = null;
      const reactiveRef = {
        get current() {
          return value;
        },
        set current(next: any) {
          const prev = value;
          value = next;
          if ((prev === null && next !== null) || (prev !== null && next === null)) {
            bumpSubStreamVersion(v => v + 1);
          }
        },
      };
      subStreamRefs.current.set(portId, reactiveRef);
    }
    return subStreamRefs.current.get(portId);
  };

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    subZoomRef.current = subZoom;
  }, [subZoom]);

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

  const subClampZoom = (value: number) => Math.min(maxZoom, Math.max(minZoom, value));
  const subZoomIn = () => setSubZoom(prev => subClampZoom(prev + zoomStep));
  const subZoomOut = () => setSubZoom(prev => subClampZoom(prev - zoomStep));

  const handleSubCanvasTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      subLastPinchDistanceRef.current = getPinchDistance(event.touches);
    }
  };

  const handleSubCanvasTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2 && subLastPinchDistanceRef.current !== null) {
      const nextDistance = getPinchDistance(event.touches);
      const zoomDelta = (nextDistance - subLastPinchDistanceRef.current) / pinchSensitivity;
      setSubZoom(prev => subClampZoom(prev + zoomDelta));
      subLastPinchDistanceRef.current = nextDistance;
      event.preventDefault();
    }
  };

  const handleSubCanvasTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length < 2) {
      subLastPinchDistanceRef.current = null;
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

  const toSubCanvasPoint = (clientX: number, clientY: number) => {
    const contentRect = subContentRef.current?.getBoundingClientRect();
    const currentZoom = subZoomRef.current || 1;
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

  const isPointOverSubCanvas = useCallback((clientX: number, clientY: number) => {
    const canvasRect = subContentRef.current?.getBoundingClientRect();
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

  const updateSubSidebarDragPoint = useCallback((clientX: number, clientY: number) => {
    if (!isPointOverSubCanvas(clientX, clientY)) {
      setSubSidebarDragPoint(null);
      return;
    }
    const point = toSubCanvasPoint(clientX, clientY);
    setSubSidebarDragPoint(point);
  }, [isPointOverSubCanvas]);

  const cloneParams = (params: Record<string, any>) => {
    try {
      return JSON.parse(JSON.stringify(params));
    } catch {
      return { ...params };
    }
  };

  const normalizeSubSketchInterface = (value: any) => {
    const inputs = Array.isArray(value?.inputs) ? value.inputs : [];
    const outputs = Array.isArray(value?.outputs) ? value.outputs : [];
    return { inputs, outputs };
  };

  const createSubSketchPorts = (moduleId: string, value: any): Port[] => {
    const iface = normalizeSubSketchInterface(value);
    const inPorts: Port[] = iface.inputs.map((p: any) => ({
      id: `${moduleId}-in-${String(p?.id ?? '').trim() || 'in'}`,
      type: 'input',
      label: String(p?.label ?? p?.id ?? 'In'),
    }));
    const outPorts: Port[] = iface.outputs.map((p: any) => ({
      id: `${moduleId}-out-${String(p?.id ?? '').trim() || 'out'}`,
      type: 'output',
      label: String(p?.label ?? p?.id ?? 'Out'),
    }));
    return [...inPorts, ...outPorts];
  };

  const SKETCH_IN_MODULE_ID = '__sketch_in__';
  const SKETCH_OUT_MODULE_ID = '__sketch_out__';

  const createSketchInPorts = (ifaceValue: any): Port[] => {
    const iface = normalizeSubSketchInterface(ifaceValue);
    return iface.inputs.map((p: any) => ({
      id: `${SKETCH_IN_MODULE_ID}-out-${String(p?.id ?? '').trim() || 'in'}`,
      type: 'output',
      label: String(p?.label ?? p?.id ?? 'In'),
    }));
  };

  const createSketchOutPorts = (ifaceValue: any): Port[] => {
    const iface = normalizeSubSketchInterface(ifaceValue);
    return iface.outputs.map((p: any) => ({
      id: `${SKETCH_OUT_MODULE_ID}-in-${String(p?.id ?? '').trim() || 'out'}`,
      type: 'input',
      label: String(p?.label ?? p?.id ?? 'Out'),
    }));
  };

  const ensureSketchBoundaryModules = (snapshot: EditorSnapshot, ifaceValue: any): EditorSnapshot => {
    const nextModules = [...snapshot.modules];
    const nextParams = { ...snapshot.moduleParams };

    const inPorts = createSketchInPorts(ifaceValue);
    const outPorts = createSketchOutPorts(ifaceValue);
    const inPortIdSet = new Set(inPorts.map(p => p.id));
    const outPortIdSet = new Set(outPorts.map(p => p.id));

    const inDefinition = MODULE_DEFINITIONS.SketchIn;
    const outDefinition = MODULE_DEFINITIONS.SketchOut;

    const upsert = (id: string, type: string, position: Position, ports: Port[], color: string) => {
      const existingIndex = nextModules.findIndex(m => m.id === id);
      const base: ModuleData = {
        id,
        type,
        position,
        ports,
        color,
        enabled: true,
      };
      if (existingIndex === -1) {
        nextModules.push(base);
      } else {
        nextModules[existingIndex] = { ...nextModules[existingIndex], ...base, position: nextModules[existingIndex].position ?? position };
      }
    };

    upsert(SKETCH_IN_MODULE_ID, 'SketchIn', { x: 60, y: 120 }, inPorts, inDefinition?.color ?? '#4c51bf');
    upsert(SKETCH_OUT_MODULE_ID, 'SketchOut', { x: 740, y: 120 }, outPorts, outDefinition?.color ?? '#4c51bf');

    nextParams[SKETCH_IN_MODULE_ID] = nextParams[SKETCH_IN_MODULE_ID] || {};
    nextParams[SKETCH_OUT_MODULE_ID] = nextParams[SKETCH_OUT_MODULE_ID] || {};

    const moduleIdSet = new Set(nextModules.map(m => m.id));
    const portIdSet = new Set(nextModules.flatMap(m => m.ports.map(p => p.id)));

    const nextConnections = snapshot.connections
      .filter(connection => moduleIdSet.has(connection.from.moduleId)
        && moduleIdSet.has(connection.to.moduleId)
        && portIdSet.has(connection.from.portId)
        && portIdSet.has(connection.to.portId))
      .filter(connection => {
        if (connection.from.moduleId === SKETCH_IN_MODULE_ID && !inPortIdSet.has(connection.from.portId)) return false;
        if (connection.to.moduleId === SKETCH_OUT_MODULE_ID && !outPortIdSet.has(connection.to.portId)) return false;
        return true;
      });

    return { modules: nextModules, connections: nextConnections, moduleParams: nextParams };
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

    if (type === 'SubSketch') {
      const defaultInterface = (definition.defaultParams as any)?.interface;
      ports.push(...createSubSketchPorts(id, defaultInterface));
      return {
        id,
        type,
        position,
        ports,
        color: definition.color,
        enabled: overrides?.enabled ?? true,
      };
    }

    if (type === 'SketchIn' || type === 'SketchOut') {
      return {
        id,
        type,
        position,
        ports: [],
        color: definition.color,
        enabled: overrides?.enabled ?? true,
      };
    }

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

  const updateSubSketchInterface = (moduleId: string, value: any) => {
    const nextPorts = createSubSketchPorts(moduleId, value);
    const portIdSet = new Set(nextPorts.map(p => p.id));
    setModuleParams(prev => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] || {}),
        interface: value,
      },
    }));
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, ports: nextPorts } : m));
    setConnections(prev => prev.filter(c => {
      const touchesModule = c.from.moduleId === moduleId || c.to.moduleId === moduleId;
      if (!touchesModule) return true;
      if (c.from.moduleId === moduleId && !portIdSet.has(c.from.portId)) return false;
      if (c.to.moduleId === moduleId && !portIdSet.has(c.to.portId)) return false;
      return true;
    }));
    clearPortPositionCache();

    if (liveSubSketch?.moduleId === moduleId) {
      setLiveSubSketch(prev => (prev ? { ...prev, interfaceValue: value } : prev));
      const ensured = ensureSketchBoundaryModules({ modules: subModules, connections: subConnections, moduleParams: subModuleParams }, value);
      subPortPositionCacheRef.current.clear();
      setSubModules(ensured.modules);
      setSubConnections(ensured.connections);
      setSubModuleParams(ensured.moduleParams);
    }
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

  const addSubModule = useCallback((type: string, position?: Position) => {
    const defaultPosition = position || { x: 100 + subModules.length * 20, y: 100 + subModules.length * 20 };
    const newModule = createModuleData(type, defaultPosition);
    if (!newModule) return;
    setSubModules(prev => [...prev, newModule]);
    setSubModuleParams(prev => ({
      ...prev,
      [newModule.id]: getDefaultParams(type),
    }));
  }, [subModules.length]);

  const handleAddSubModule = (type: string, position?: Position) => {
    addSubModule(type, position);
  };

  useEffect(() => {
    sidebarDragModuleRef.current = sidebarDragModule;
  }, [sidebarDragModule]);

  useEffect(() => {
    subSidebarDragModuleRef.current = subSidebarDragModule;
  }, [subSidebarDragModule]);

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

  useEffect(() => {
    if (!isSubSidebarDragActive) return;

    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();
      const pending = subPendingSidebarDragRef.current;

      if (pending && !subSidebarDragModuleRef.current) {
        const dx = event.clientX - pending.startX;
        const dy = event.clientY - pending.startY;
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
          const moduleState = { moduleType: pending.moduleType };
          subSidebarDragModuleRef.current = moduleState;
          setSubSidebarDragModule(moduleState);
        }
      }

      if (subSidebarDragModuleRef.current) {
        updateSubSidebarDragPoint(event.clientX, event.clientY);
      }
    };

    const handlePointerEnd = (event: PointerEvent) => {
      event.preventDefault();
      if (subSidebarDragModuleRef.current && isPointOverSubCanvas(event.clientX, event.clientY)) {
        const point = toSubCanvasPoint(event.clientX, event.clientY);
        if (point) {
          addSubModule(subSidebarDragModuleRef.current.moduleType, point);
        }
      }
      setSubSidebarDragModule(null);
      setSubSidebarDragPoint(null);
      subPendingSidebarDragRef.current = null;
      setSubSidebarDragActive(false);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
    };
  }, [isSubSidebarDragActive, addSubModule, updateSubSidebarDragPoint, isPointOverSubCanvas]);

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

  const duplicateModule = (id: string) => {
    const original = modules.find(m => m.id === id);
    if (!original) return;
    if (original.type !== 'SubSketch') return;

    const originalParams = moduleParams[id] ? cloneParams(moduleParams[id]) : getDefaultParams(original.type);
    const newId = `module-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newPosition = { x: original.position.x + 40, y: original.position.y + 40 };
    const definition = MODULE_DEFINITIONS[original.type];
    const iface = originalParams.interface ?? (definition?.defaultParams as any)?.interface;
    const nextPorts = createSubSketchPorts(newId, iface);

    const duplicatedModule: ModuleData = {
      id: newId,
      type: original.type,
      position: newPosition,
      ports: nextPorts,
      color: original.color,
      enabled: original.enabled ?? true,
    };

    setModules(prev => [...prev, duplicatedModule]);
    setModuleParams(prev => ({
      ...prev,
      [newId]: originalParams,
    }));
    clearPortPositionCache();
  };

  const toggleModuleEnabled = (id: string) => {
    setModules(prev => prev.map(m =>
      m.id === id ? { ...m, enabled: !m.enabled } : m
    ));
  };

  const moveSubModule = (id: string, position: Position) => {
    setSubModules(prev => prev.map(m => m.id === id ? { ...m, position } : m));
    clearSubPortPositionCache();
  };

  const deleteSubModule = (id: string) => {
    if (id === SKETCH_IN_MODULE_ID || id === SKETCH_OUT_MODULE_ID) {
      return;
    }
    setSubModules(prev => prev.filter(m => m.id !== id));
    setSubConnections(prev => prev.filter(c =>
      c.from.moduleId !== id && c.to.moduleId !== id
    ));
    setSubModuleParams(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const toggleSubModuleEnabled = (id: string) => {
    setSubModules(prev => prev.map(m =>
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

  const clearSubPortPositionCache = () => {
    subPortPositionCacheRef.current.clear();
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

  useLayoutEffect(() => {
    clearSubPortPositionCache();
    setSubLayoutVersion((prev) => prev + 1);
    if (!subCanvasRef.current || !subContentRef.current) return;
    const canvasRect = subCanvasRef.current.getBoundingClientRect();
    const moduleEls = subContentRef.current.querySelectorAll('.module-wrapper');
    let maxRight = canvasRect.width;
    let maxBottom = canvasRect.height;
    moduleEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const right = rect.right - canvasRect.left + subCanvasRef.current!.scrollLeft;
      const bottom = rect.bottom - canvasRect.top + subCanvasRef.current!.scrollTop;
      if (right > maxRight) maxRight = right;
      if (bottom > maxBottom) maxBottom = bottom;
    });
    const padding = 200;
    setSubContentSize({ width: maxRight + padding, height: maxBottom + padding });
  }, [subModules]);

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

  useEffect(() => {
    clearSubPortPositionCache();
    setSubLayoutVersion(prev => prev + 1);
  }, [subZoom]);

  // Get position of a port element with caching
  const getPortPosition = (moduleId: string, portId: string): Position | null => {
    const cacheKey = `${moduleId}-${portId}`;

    // Check cache first
    if (portPositionCacheRef.current.has(cacheKey)) {
      return portPositionCacheRef.current.get(cacheKey)!;
    }

    // Find the port dot element directly (scoped to this canvas)
    const portDot = (contentRef.current?.querySelector(
      `[data-module-id="${moduleId}"][data-port-id="${portId}"] .port-dot`
    ) ?? null) as HTMLElement | null;

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

  const getSubPortPosition = (moduleId: string, portId: string): Position | null => {
    const cacheKey = `${moduleId}-${portId}`;
    if (subPortPositionCacheRef.current.has(cacheKey)) {
      return subPortPositionCacheRef.current.get(cacheKey)!;
    }

    const portDot = (subContentRef.current?.querySelector(
      `[data-module-id="${moduleId}"][data-port-id="${portId}"] .port-dot`
    ) ?? null) as HTMLElement | null;

    if (!portDot) return null;

    const dotRect = portDot.getBoundingClientRect();
    const scaleRect = subCanvasScaleRef.current?.getBoundingClientRect();
    const contentRect = scaleRect ?? subContentRef.current?.getBoundingClientRect();
    if (!contentRect) return null;

    const scale = subZoomRef.current || 1;
    const position = {
      x: (dotRect.left + dotRect.width / 2 - contentRect.left) / scale,
      y: (dotRect.top + dotRect.height / 2 - contentRect.top) / scale,
    };

    subPortPositionCacheRef.current.set(cacheKey, position);
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

  const handleSubPortMouseDown = (
    moduleId: string,
    portId: string,
    portType: 'input' | 'output',
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    event.stopPropagation();

    const point = toSubCanvasPoint(event.clientX, event.clientY);
    if (!point) return;

    setSubDraggingConnection({
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

  const updateSubHoveredPortFromPoint = (clientX: number, clientY: number) => {
    if (clientX == null || clientY == null) {
      setSubHoveredPort(null);
      return;
    }
    const element = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const portEl = element?.closest('.port') as HTMLElement | null;
    if (portEl && portEl.dataset.moduleId && portEl.dataset.portId) {
      setSubHoveredPort({ moduleId: portEl.dataset.moduleId, portId: portEl.dataset.portId });
    } else {
      setSubHoveredPort(null);
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

  const updateSubDraggingConnectionPosition = (clientX: number, clientY: number) => {
    if (!subDraggingConnection || !subCanvasRef.current) return;

    const point = toSubCanvasPoint(clientX, clientY);
    if (!point) return;
    subMousePosRef.current = point;

    if (subRafIdRef.current === null) {
      subRafIdRef.current = requestAnimationFrame(() => {
        setSubDraggingConnection(prev => (prev ? { ...prev, mousePos: subMousePosRef.current } : null));
        subRafIdRef.current = null;
      });
    }
    updateSubHoveredPortFromPoint(clientX, clientY);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    updateDraggingConnectionPosition(e.clientX, e.clientY);
  };

  const handleSubCanvasMouseMove = (e: React.MouseEvent) => {
    updateSubDraggingConnectionPosition(e.clientX, e.clientY);
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

  const handleSubCanvasPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    updateSubDraggingConnectionPosition(event.clientX, event.clientY);

    if (!isSubCanvasPanningRef.current) return;

    const canvasEl = subCanvasRef.current;
    if (!canvasEl) return;

    const deltaX = event.clientX - subPanStartRef.current.x;
    const deltaY = event.clientY - subPanStartRef.current.y;
    canvasEl.scrollLeft = subPanStartRef.current.scrollLeft - deltaX;
    canvasEl.scrollTop = subPanStartRef.current.scrollTop - deltaY;
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

  const stopSubCanvasPan = () => {
    if (!isSubCanvasPanningRef.current) return;
    const canvasEl = subCanvasRef.current;
    if (canvasEl && subPanStartRef.current.pointerId) {
      canvasEl.releasePointerCapture(subPanStartRef.current.pointerId);
    }
    isSubCanvasPanningRef.current = false;
  };

  const handleCanvasPointerUp = () => {
    finalizeConnection();
    stopCanvasPan();
  };

  const handleSubCanvasPointerUp = () => {
    finalizeSubConnection();
    stopSubCanvasPan();
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

  const handleSubCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!subCanvasRef.current) return;
    if (subSidebarDragModule) {
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

    isSubCanvasPanningRef.current = true;
    subPanStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: subCanvasRef.current.scrollLeft,
      scrollTop: subCanvasRef.current.scrollTop,
      pointerId: event.pointerId,
    };
    subCanvasRef.current.setPointerCapture(event.pointerId);
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

  const finalizeSubConnection = () => {
    if (!subDraggingConnection) return;

    if (subRafIdRef.current !== null) {
      cancelAnimationFrame(subRafIdRef.current);
      subRafIdRef.current = null;
    }

    if (subHoveredPort) {
      const module = subModules.find(m => m.id === subHoveredPort.moduleId);
      const port = module?.ports.find(p => p.id === subHoveredPort.portId);

      if (port && subHoveredPort.moduleId !== subDraggingConnection.from.moduleId) {
        let fromPort = null;
        let toPort = null;
        const startedOnOutput = subDraggingConnection.startPortType === 'output';

        if (startedOnOutput && port.type === 'input') {
          fromPort = subDraggingConnection.from;
          toPort = subHoveredPort;
        } else if (!startedOnOutput && port.type === 'output') {
          fromPort = subHoveredPort;
          toPort = subDraggingConnection.from;
        }

        if (fromPort && toPort) {
          const existingConnection = subConnections.find(c => c.to.portId === toPort.portId);
          if (existingConnection) {
            flushSync(() => {
              setSubConnections(prev => prev.filter(c => c.id !== existingConnection.id));
            });
          }

          const newConnection: Connection = {
            id: `conn-${Date.now()}`,
            from: { moduleId: fromPort.moduleId, portId: fromPort.portId },
            to: { moduleId: toPort.moduleId, portId: toPort.portId },
          };

          setSubConnections(prev => [...prev, newConnection]);
        }
      }
    }

    setSubDraggingConnection(null);
    setSubHoveredPort(null);
  };

  const handleCanvasMouseUp = () => {
    finalizeConnection();
  };

  const handleSubCanvasMouseUp = () => {
    finalizeSubConnection();
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

  const handleSubWireClick = (connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubConnections(prev => prev.filter(c => c.id !== connectionId));
  };

  const isSubPortConnected = (portId: string): boolean => {
    return subConnections.some(c => c.from.portId === portId || c.to.portId === portId);
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

  const handleSubCanvasDrop = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const moduleType = (e as any).dataTransfer?.getData('moduleType');
    if (moduleType && subCanvasRef.current) {
      const point = toSubCanvasPoint(e.clientX, e.clientY);
      if (!point) return;
      handleAddSubModule(moduleType, point);
    }
  };

  const handleSubCanvasDragOver = (e: React.MouseEvent<HTMLDivElement>) => {
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

  const startSubSidebarDrag = (type: string) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    subPendingSidebarDragRef.current = {
      moduleType: type,
      startX: event.clientX,
      startY: event.clientY,
    };
    setSubSidebarDragModule(null);
    setSubSidebarDragPoint(null);
    setSubSidebarDragActive(true);
  };

  const startSubSidebarTouchDrag = (type: string) => (event: React.TouchEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!event.touches.length) return;
    subPendingSidebarDragRef.current = {
      moduleType: type,
      startX: event.touches[0].clientX,
      startY: event.touches[0].clientY,
    };
    setSubSidebarDragModule(null);
    setSubSidebarDragPoint(null);
    setSubSidebarDragActive(true);
  };

  const moduleParamQueueRef = useRef<Map<string, Map<string, any>>>(new Map());
  const moduleParamRafRef = useRef<number | null>(null);
  const flushModuleParamQueue = useCallback(() => {
    moduleParamRafRef.current = null;
    const queued = moduleParamQueueRef.current;
    if (queued.size === 0) return;
    moduleParamQueueRef.current = new Map();
    setModuleParams(prev => {
      let next: typeof prev | null = null;
      queued.forEach((updates, id) => {
        const current = prev[id] || {};
        let nextModuleParams: Record<string, any> | null = null;
        updates.forEach((val, k) => {
          if (current[k] === val) return;
          if (!nextModuleParams) nextModuleParams = { ...current };
          nextModuleParams[k] = val;
        });
        if (!nextModuleParams) return;
        if (!next) next = { ...prev };
        next[id] = nextModuleParams;
      });
      return next || prev;
    });
  }, []);

  const updateModuleParam = useCallback((moduleId: string, key: string, value: any) => {
    const byModule = moduleParamQueueRef.current.get(moduleId) || new Map<string, any>();
    byModule.set(key, value);
    moduleParamQueueRef.current.set(moduleId, byModule);
    if (moduleParamRafRef.current !== null) return;
    moduleParamRafRef.current = requestAnimationFrame(flushModuleParamQueue);
  }, [flushModuleParamQueue]);

  const subModuleParamQueueRef = useRef<Map<string, Map<string, any>>>(new Map());
  const subModuleParamRafRef = useRef<number | null>(null);
  const flushSubModuleParamQueue = useCallback(() => {
    subModuleParamRafRef.current = null;
    const queued = subModuleParamQueueRef.current;
    if (queued.size === 0) return;
    subModuleParamQueueRef.current = new Map();
    setSubModuleParams(prev => {
      let next: typeof prev | null = null;
      queued.forEach((updates, id) => {
        const current = prev[id] || {};
        let nextModuleParams: Record<string, any> | null = null;
        updates.forEach((val, k) => {
          if (current[k] === val) return;
          if (!nextModuleParams) nextModuleParams = { ...current };
          nextModuleParams[k] = val;
        });
        if (!nextModuleParams) return;
        if (!next) next = { ...prev };
        next[id] = nextModuleParams;
      });
      return next || prev;
    });
  }, []);

  const updateSubModuleParam = useCallback((moduleId: string, key: string, value: any) => {
    const byModule = subModuleParamQueueRef.current.get(moduleId) || new Map<string, any>();
    byModule.set(key, value);
    subModuleParamQueueRef.current.set(moduleId, byModule);
    if (subModuleParamRafRef.current !== null) return;
    subModuleParamRafRef.current = requestAnimationFrame(flushSubModuleParamQueue);
  }, [flushSubModuleParamQueue]);

  const serializeSketchState = (
    nextModules: ModuleData[],
    nextConnections: Connection[],
    nextModuleParams: Record<string, Record<string, any>>,
  ): SketchData => {
    return {
      version: 1,
      modules: nextModules.map(module => ({
        id: module.id,
        type: module.type,
        position: module.position,
        enabled: module.enabled ?? true,
        params: (() => {
          const rawParams = nextModuleParams[module.id] ? nextModuleParams[module.id] : getDefaultParams(module.type);
          const params = module.type === 'Fluidsynth' || module.type === 'MidiPlayer'
            ? { ...rawParams }
            : cloneParams(rawParams);

          if (module.type === 'SubSketch') {
            const mode = params.storageMode === 'embed' ? 'embed' : 'reference';
            params.storageMode = mode;
            if (mode !== 'embed') {
              delete params.embeddedSketch;
            }
          }

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
      connections: nextConnections.map(connection => ({
        id: connection.id,
        from: connection.from,
        to: connection.to,
      })),
    };
  };

  const hydrateSketchState = (parsed: SketchData): EditorSnapshot => {
    const hydratedModules = parsed.modules
      .map(module => createModuleData(module.type, module.position, { id: module.id, enabled: module.enabled }))
      .filter((module): module is ModuleData => module !== null);

    const hydratedModuleParams: Record<string, Record<string, any>> = {};
    parsed.modules.forEach(module => {
      if (!MODULE_DEFINITIONS[module.type]) return;
      const defaults = getDefaultParams(module.type);
      hydratedModuleParams[module.id] = {
        ...defaults,
        ...(module.params ? cloneParams(module.params) : {}),
      };
      if (module.type === 'SubSketch') {
        hydratedModuleParams[module.id].storageMode = hydratedModuleParams[module.id].storageMode === 'embed' ? 'embed' : 'reference';
        if (!hydratedModuleParams[module.id].interface) {
          hydratedModuleParams[module.id].interface = (defaults as any)?.interface ?? { inputs: [], outputs: [] };
        }
        if (!hydratedModuleParams[module.id].embeddedSketch) {
          hydratedModuleParams[module.id].embeddedSketch = (defaults as any)?.embeddedSketch ?? { version: 1, modules: [], connections: [] };
        }
      }
    });

    const syncedModules = hydratedModules.map((m) => {
      if (m.type !== 'SubSketch') return m;
      const iface = hydratedModuleParams[m.id]?.interface;
      if (!iface) return m;
      return { ...m, ports: createSubSketchPorts(m.id, iface) };
    });

    const moduleIdSet = new Set(syncedModules.map(module => module.id));
    const portIdSet = new Set(syncedModules.flatMap(module => module.ports.map(port => port.id)));
    const isBoundaryModuleId = (moduleId: string) => moduleId === SKETCH_IN_MODULE_ID || moduleId === SKETCH_OUT_MODULE_ID;

    const hydratedConnections = parsed.connections
      .filter(connection => moduleIdSet.has(connection.from.moduleId)
        && moduleIdSet.has(connection.to.moduleId)
        && (isBoundaryModuleId(connection.from.moduleId) || portIdSet.has(connection.from.portId))
        && (isBoundaryModuleId(connection.to.moduleId) || portIdSet.has(connection.to.portId))
        && (isBoundaryModuleId(connection.from.moduleId) || isBoundaryModuleId(connection.to.moduleId)
          || (portIdSet.has(connection.from.portId) && portIdSet.has(connection.to.portId))))
      .map(connection => ({
        id: connection.id || `conn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        from: connection.from,
        to: connection.to,
      }));

    return {
      modules: syncedModules,
      connections: hydratedConnections,
      moduleParams: hydratedModuleParams,
    };
  };

  const commitLiveSubSketchToParent = useCallback((session: LiveSubSketchSession | null) => {
    if (!session) return;
    const embeddedSketch = serializeSketchState(subModules, subConnections, subModuleParams);
    (embeddedSketch as any).interface = session.interfaceValue;
    setModuleParams(prev => ({
      ...prev,
      [session.moduleId]: {
        ...(prev[session.moduleId] || {}),
        embeddedSketch,
      },
    }));
  }, [subModules, subConnections, subModuleParams]);

  const ensureLiveSubSketch = async (moduleId: string) => {
    if (liveSubSketch?.moduleId === moduleId) {
      setLiveSubSketch(prev => (prev ? { ...prev, isOpen: true } : prev));
      return;
    }

    // Commit any currently-open session before switching to a different one.
    if (liveSubSketch) {
      commitLiveSubSketchToParent(liveSubSketch);
    }

    const params = moduleParams[moduleId] ? moduleParams[moduleId] : getDefaultParams('SubSketch');
    const mode = params.storageMode === 'embed' ? 'embed' : 'reference';
    const embedded = params.embeddedSketch;
    const referenceUrl = typeof params.referenceUrl === 'string' ? params.referenceUrl : '';
    const ifaceValue = params.interface;

    let sketchToOpen: SketchData | null = embedded && typeof embedded === 'object' ? embedded : null;
    if (!sketchToOpen && mode === 'reference' && referenceUrl.trim().length > 0) {
      try {
        const resp = await fetch(referenceUrl);
        const json = await resp.json();
        if (json && json.version === 1 && Array.isArray(json.modules) && Array.isArray(json.connections)) {
          sketchToOpen = json as SketchData;
          setModuleParams(prev => ({
            ...prev,
            [moduleId]: {
              ...(prev[moduleId] || {}),
              embeddedSketch: json,
            },
          }));
        }
      } catch {
        // Ignore; allow opening an empty sketch.
      }
    }

    if (!sketchToOpen) {
      sketchToOpen = { version: 1, modules: [], connections: [] };
      setModuleParams(prev => ({
        ...prev,
        [moduleId]: {
          ...(prev[moduleId] || {}),
          embeddedSketch: sketchToOpen,
        },
      }));
    }

    const hydrated = ensureSketchBoundaryModules(hydrateSketchState(sketchToOpen), ifaceValue);
    subPortPositionCacheRef.current.clear();
    setSubModules(hydrated.modules);
    setSubConnections(hydrated.connections);
    setSubModuleParams(hydrated.moduleParams);
    setSubRequiresUserGesture(requiresUserGesture);
    setSubLayoutVersion(prev => prev + 1);

    setLiveSubSketch({
      moduleId,
      interfaceValue: ifaceValue,
      isOpen: true,
      snapshot: hydrated,
    });
  };

  const openSubSketch = (moduleId: string) => {
    ensureLiveSubSketch(moduleId);
  };

  const closeLiveSubSketch = () => {
    flushSubModuleParamQueue();
    commitLiveSubSketchToParent(liveSubSketch);
    setLiveSubSketch(prev => (prev ? { ...prev, isOpen: false } : prev));
  };

  const handleSaveSketch = () => {
    flushModuleParamQueue();
    const sketch = serializeSketchState(modules, connections, moduleParams);

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

  const handleSaveLiveSubSketch = () => {
    if (!liveSubSketch) return;
    flushSubModuleParamQueue();
    const sketch = serializeSketchState(subModules, subConnections, subModuleParams);
    (sketch as any).interface = liveSubSketch.interfaceValue;
    const blob = new Blob([JSON.stringify(sketch, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `mod-subsketch-${timestamp}.json`;
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
      let hydrated = hydrateSketchState(parsed);
      const portIdSet = new Set(hydrated.modules.flatMap(module => module.ports.map(port => port.id)));

      // Preserve existing refs for matching port ids so modules keep their outputs wired.
      streamRefs.current.forEach((_, portId) => {
        if (!portIdSet.has(portId)) {
          streamRefs.current.delete(portId);
        }
      });
      clearPortPositionCache();
      setModules(hydrated.modules);
      setConnections(hydrated.connections);
      setModuleParams(hydrated.moduleParams);
      setRequiresUserGesture(true);
    } catch (error) {
      console.error('Failed to load sketch.', error);
      alert('Failed to load sketch. Please check the file and try again.');
    }
  };

  const handleLoadLiveSubSketch = async (file: File) => {
    if (!liveSubSketch) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as SketchData;
      if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.modules) || !Array.isArray(parsed.connections)) {
        throw new Error('Unsupported sketch format.');
      }
      let hydrated = hydrateSketchState(parsed);
      hydrated = ensureSketchBoundaryModules(hydrated, liveSubSketch.interfaceValue || (parsed as any).interface);
      const portIdSet = new Set(hydrated.modules.flatMap(module => module.ports.map(port => port.id)));

      subStreamRefs.current.forEach((_, portId) => {
        if (!portIdSet.has(portId)) {
          subStreamRefs.current.delete(portId);
        }
      });
      subPortPositionCacheRef.current.clear();
      setSubModules(hydrated.modules);
      setSubConnections(hydrated.connections);
      setSubModuleParams(hydrated.moduleParams);
      setSubRequiresUserGesture(true);
    } catch (error) {
      console.error('Failed to load sub-sketch.', error);
      alert('Failed to load sub-sketch. Please check the file and try again.');
    }
  };

  useEffect(() => {
    if (!liveSubSketch?.isOpen) return;
    const t = window.setTimeout(() => {
      commitLiveSubSketchToParent(liveSubSketch);
    }, 250);
    return () => window.clearTimeout(t);
  }, [liveSubSketch?.moduleId, liveSubSketch?.isOpen, subModules, subConnections, subModuleParams, commitLiveSubSketchToParent]);

  const handleUnlockAudio = async () => {
    if (!requiresUserGesture && !subRequiresUserGesture) return;
    if (audioContext && audioContext.state !== 'running') {
      try {
        await audioContext.resume();
      } catch {
        // Ignore; try again on the next gesture.
      }
    }
    setRequiresUserGesture(false);
    setSubRequiresUserGesture(false);
  };

  const handleSketchFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleLoadSketch(file);
    event.target.value = '';
  };

  const handleLiveSubSketchFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleLoadLiveSubSketch(file);
    event.target.value = '';
  };

  const isSaveDisabled = modules.length === 0 && connections.length === 0;
  const zoomPercent = Math.round(zoom * 100);
  const subZoomPercent = Math.round(subZoom * 100);
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
              onDuplicate={module.type === 'SubSketch' ? duplicateModule : undefined}
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
                onRequestOpenSubSketch={openSubSketch}
                onUpdateSubSketchInterface={updateSubSketchInterface}
              />
              {module.type === 'SubSketch' && (
                <>
                  <SubSketchRuntime
                    moduleId={module.id}
                    params={moduleParams[module.id] || getDefaultParams(module.type)}
                    parentConnections={connections}
                    getParentStreamRef={getStreamRef}
                    requiresUserGesture={requiresUserGesture}
                  />
                </>
              )}
            </ModuleWrapper>
          );
        })}
      </CanvasArea>

      {liveSubSketch && (
        <div
          className="subsketch-overlay"
          style={{ display: liveSubSketch.isOpen ? 'flex' : 'none' }}
        >
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            isMobileView={isMobileView}
            handleSaveSketch={handleSaveLiveSubSketch}
            handleSketchFileChange={handleLiveSubSketchFileChange}
            startSidebarDrag={startSubSidebarDrag}
            startSidebarTouchDrag={startSubSidebarTouchDrag}
            handleAddModule={handleAddSubModule}
            isSaveDisabled={subModules.length === 0 && subConnections.length === 0}
          />
          <CanvasArea
            canvasRef={subCanvasRef}
            contentRef={subContentRef}
            canvasScaleRef={subCanvasScaleRef}
            contentSize={subContentSize}
            layoutVersion={subLayoutVersion}
            zoom={subZoom}
            zoomPercent={subZoomPercent}
            minZoom={minZoom}
            maxZoom={maxZoom}
            zoomIn={subZoomIn}
            zoomOut={subZoomOut}
            handleCanvasMouseMove={handleSubCanvasMouseMove}
            handleCanvasMouseUp={handleSubCanvasMouseUp}
            handleCanvasDragOver={handleSubCanvasDragOver}
            handleCanvasDrop={handleSubCanvasDrop}
            handleCanvasPointerDown={handleSubCanvasPointerDown}
            handleCanvasPointerMove={handleSubCanvasPointerMove}
            handleCanvasPointerUp={handleSubCanvasPointerUp}
            handleCanvasTouchStart={handleSubCanvasTouchStart}
            handleCanvasTouchMove={handleSubCanvasTouchMove}
            handleCanvasTouchEnd={handleSubCanvasTouchEnd}
            draggingConnection={subDraggingConnection}
            connections={subConnections}
            sidebarDragModule={subSidebarDragModule}
            sidebarDragPoint={subSidebarDragPoint}
            getPortPosition={getSubPortPosition}
            handleWireClick={handleSubWireClick}
            isMobileView={isMobileView}
            toggleSidebar={toggleSidebar}
            handleUnlockAudio={handleUnlockAudio}
            breadcrumb={`Sub-Sketch: ${liveSubSketch.moduleId}`}
            onBack={closeLiveSubSketch}
          >
            {subModules.map((module) => {
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
                const connection = subConnections.find(c => c.to.portId === port.id);
                if (subRequiresUserGesture) return null;
                return connection ? getSubStreamRef(connection.from.portId) : null;
              });

              const cvInputStreams: { [key: string]: React.RefObject<any> | null } = {};
              cvPorts.forEach(port => {
                const connection = subConnections.find(c => c.to.portId === port.id);
                const key = port.id.split('-').slice(-2).join('-');
                cvInputStreams[key] = subRequiresUserGesture ? null : (connection ? getSubStreamRef(connection.from.portId) : null);
              });

              const outputStreams = outputPorts.map(port => getSubStreamRef(port.id));

              return (
                <ModuleWrapper
                  key={module.id}
                  id={module.id}
                  type={module.type}
                  position={module.position}
                  ports={module.ports}
                  color={module.color}
                  onMove={moveSubModule}
                  onDelete={deleteSubModule}
                  onPortMouseDown={handleSubPortMouseDown}
                  onPortMouseEnter={(moduleId, portId) => setSubHoveredPort({ moduleId, portId })}
                  onPortMouseLeave={() => setSubHoveredPort(null)}
                  isPortConnected={isSubPortConnected}
                  hoveredPortId={subHoveredPort?.moduleId === module.id ? subHoveredPort.portId : undefined}
                  enabled={module.enabled}
                  onEnabledToggle={toggleSubModuleEnabled}
                  supportsEnabled={supportsEnabled(module.type)}
                >
                  <ModuleRenderer
                    moduleId={module.id}
                    moduleType={module.type}
                    inputStreams={inputStreams}
                    outputStreams={outputStreams}
                    cvInputStreams={cvInputStreams}
                    enabled={module.enabled}
                    params={subModuleParams[module.id] || getDefaultParams(module.type)}
                    onParamChange={updateSubModuleParam}
                  />
                </ModuleWrapper>
              );
            })}
          </CanvasArea>
        </div>
      )}
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
