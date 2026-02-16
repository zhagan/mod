import React from 'react';
import { MODULE_DEFINITIONS } from '../moduleDefinitions';
import { Connection, ModuleData, Port, SketchData } from '../types';
import { ModuleRenderer } from './ModuleRenderer';

type StreamRef = React.RefObject<any>;

type Props = {
  moduleId: string;
  params: Record<string, any>;
  parentConnections: Connection[];
  getParentStreamRef: (portId: string) => any;
  requiresUserGesture: boolean;
  suspended?: boolean;
};

const SKETCH_IN_MODULE_ID = '__sketch_in__';
const SKETCH_OUT_MODULE_ID = '__sketch_out__';

const normalizeInterface = (value: any) => {
  const inputs = Array.isArray(value?.inputs) ? value.inputs : [];
  const outputs = Array.isArray(value?.outputs) ? value.outputs : [];
  return { inputs, outputs };
};

const createSketchInPorts = (ifaceValue: any): Port[] => {
  const iface = normalizeInterface(ifaceValue);
  return iface.inputs.map((p: any) => ({
    id: `${SKETCH_IN_MODULE_ID}-out-${String(p?.id ?? '').trim() || 'in'}`,
    type: 'output',
    label: String(p?.label ?? p?.id ?? 'In'),
  }));
};

const createSketchOutPorts = (ifaceValue: any): Port[] => {
  const iface = normalizeInterface(ifaceValue);
  return iface.outputs.map((p: any) => ({
    id: `${SKETCH_OUT_MODULE_ID}-in-${String(p?.id ?? '').trim() || 'out'}`,
    type: 'input',
    label: String(p?.label ?? p?.id ?? 'Out'),
  }));
};

const createModulePorts = (moduleId: string, type: string): Port[] => {
  const definition = MODULE_DEFINITIONS[type];
  if (!definition) return [];
  if (type === 'SubSketch') return [];
  if (type === 'SketchIn' || type === 'SketchOut') return [];

  const ports: Port[] = [];
  for (let i = 0; i < definition.inputs; i++) {
    const suffix = definition.inputIds?.[i] ?? `in-${i}`;
    ports.push({
      id: `${moduleId}-${suffix}`,
      type: 'input',
      label: definition.inputLabels?.[i] ?? (definition.inputs === 1 ? 'In' : `In ${i + 1}`),
    });
  }
  for (let i = 0; i < definition.outputs; i++) {
    ports.push({
      id: `${moduleId}-out-${i}`,
      type: 'output',
      label: definition.outputLabels?.[i] ?? (definition.outputs === 1 ? 'Out' : `Out ${i + 1}`),
    });
  }
  return ports;
};

const SketchRefBridge: React.FC<{
  from: StreamRef | null;
  to: StreamRef;
  enabled: boolean;
}> = ({ from, to, enabled }) => {
  const fromRef = from;
  const enabledRef = React.useRef(enabled);
  enabledRef.current = enabled;

  React.useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (!enabledRef.current) {
        to.current = null;
      } else {
        to.current = fromRef?.current ?? null;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      to.current = null;
    };
  }, [fromRef, to]);

  return null;
};

export const SubSketchRuntime: React.FC<Props> = ({
  moduleId,
  params,
  parentConnections,
  getParentStreamRef,
  requiresUserGesture,
  suspended = false,
}) => {
  const storageMode = params.storageMode === 'embed' ? 'embed' : 'reference';
  const referenceUrl = typeof params.referenceUrl === 'string' ? params.referenceUrl : '';
  const ifaceValue = params.interface;
  const embeddedSketch = params.embeddedSketch;

  const [loadedSketch, setLoadedSketch] = React.useState<SketchData | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (storageMode !== 'reference') {
      setLoadedSketch(null);
      setLoadError(null);
      return;
    }
    const url = referenceUrl.trim();
    if (!url) {
      setLoadedSketch(null);
      setLoadError(null);
      return;
    }
    let canceled = false;
    setLoadError(null);
    fetch(url)
      .then(resp => resp.json())
      .then((json) => {
        if (canceled) return;
        if (json && json.version === 1 && Array.isArray(json.modules) && Array.isArray(json.connections)) {
          setLoadedSketch(json as SketchData);
        } else {
          setLoadedSketch(null);
          setLoadError('Unsupported sub-sketch JSON');
        }
      })
      .catch(() => {
        if (canceled) return;
        setLoadedSketch(null);
        setLoadError('Failed to load sub-sketch JSON');
      });
    return () => {
      canceled = true;
    };
  }, [storageMode, referenceUrl]);

  const sketch: SketchData | null = React.useMemo(() => {
    const embeddedValid = embeddedSketch
      && embeddedSketch.version === 1
      && Array.isArray(embeddedSketch.modules)
      && Array.isArray(embeddedSketch.connections)
      ? (embeddedSketch as SketchData)
      : null;

    if (storageMode === 'embed') {
      return embeddedValid;
    }
    return loadedSketch ?? embeddedValid;
  }, [storageMode, embeddedSketch, loadedSketch]);

  const internal = React.useMemo(() => {
    const base: SketchData = sketch ?? { version: 1, modules: [], connections: [] };
    const sketchInPorts = createSketchInPorts(ifaceValue);
    const sketchOutPorts = createSketchOutPorts(ifaceValue);

    const modules: ModuleData[] = [];
    const connections: Connection[] = [];
    const moduleParams: Record<string, Record<string, any>> = {};

    const sketchIn: ModuleData = {
      id: SKETCH_IN_MODULE_ID,
      type: 'SketchIn',
      position: { x: 0, y: 0 },
      ports: sketchInPorts,
      color: MODULE_DEFINITIONS.SketchIn?.color ?? '#4c51bf',
      enabled: true,
    };
    const sketchOut: ModuleData = {
      id: SKETCH_OUT_MODULE_ID,
      type: 'SketchOut',
      position: { x: 0, y: 0 },
      ports: sketchOutPorts,
      color: MODULE_DEFINITIONS.SketchOut?.color ?? '#4c51bf',
      enabled: true,
    };

    modules.push(sketchIn, sketchOut);
    moduleParams[SKETCH_IN_MODULE_ID] = {};
    moduleParams[SKETCH_OUT_MODULE_ID] = {};

    base.modules.forEach((m) => {
      if (!MODULE_DEFINITIONS[m.type]) return;
      if (m.id === SKETCH_IN_MODULE_ID || m.id === SKETCH_OUT_MODULE_ID) return;
      modules.push({
        id: m.id,
        type: m.type,
        position: m.position,
        enabled: m.enabled ?? true,
        ports: createModulePorts(m.id, m.type),
        color: MODULE_DEFINITIONS[m.type].color,
      });
      moduleParams[m.id] = (m.params && typeof m.params === 'object') ? m.params : {};
    });

    const moduleIdSet = new Set(modules.map(m => m.id));
    const portIdSet = new Set(modules.flatMap(m => m.ports.map(p => p.id)));

    base.connections.forEach((c) => {
      if (!moduleIdSet.has(c.from.moduleId) || !moduleIdSet.has(c.to.moduleId)) return;
      if (!portIdSet.has(c.from.portId) || !portIdSet.has(c.to.portId)) return;
      connections.push({ id: c.id, from: c.from, to: c.to });
    });

    return { modules, connections, iface: normalizeInterface(ifaceValue), moduleParams };
  }, [sketch, ifaceValue]);

  const internalStreamRefs = React.useRef<Map<string, any>>(new Map());
  const [, bumpInternalVersion] = React.useState(0);
  const getInternalStreamRef = React.useCallback((portId: string) => {
    if (!internalStreamRefs.current.has(portId)) {
      let value: any = null;
      const reactiveRef = {
        get current() {
          return value;
        },
        set current(next: any) {
          const prev = value;
          value = next;
          if ((prev === null && next !== null) || (prev !== null && next === null)) {
            bumpInternalVersion(v => v + 1);
          }
        },
      };
      internalStreamRefs.current.set(portId, reactiveRef);
    }
    return internalStreamRefs.current.get(portId);
  }, []);

  React.useEffect(() => {
    const activePortIds = new Set(internal.modules.flatMap(m => m.ports.map(p => p.id)));
    internalStreamRefs.current.forEach((_, portId) => {
      if (!activePortIds.has(portId)) internalStreamRefs.current.delete(portId);
    });
  }, [internal.modules]);

  const getParentInputRefForInterfacePort = React.useCallback((ifacePortId: string) => {
    const portId = `${moduleId}-in-${ifacePortId}`;
    if (requiresUserGesture) return null;
    const conn = parentConnections.find(c => c.to.portId === portId);
    return conn ? (getParentStreamRef(conn.from.portId) as StreamRef) : null;
  }, [moduleId, parentConnections, getParentStreamRef, requiresUserGesture]);

  const getInternalInputRefForSketchOutPort = React.useCallback((ifacePortId: string) => {
    const portId = `${SKETCH_OUT_MODULE_ID}-in-${ifacePortId}`;
    if (requiresUserGesture) return null;
    const conn = internal.connections.find(c => c.to.portId === portId);
    return conn ? (getInternalStreamRef(conn.from.portId) as StreamRef) : null;
  }, [internal.connections, getInternalStreamRef, requiresUserGesture]);

  const getParentOutputRefForInterfacePort = React.useCallback((ifacePortId: string) => {
    return getParentStreamRef(`${moduleId}-out-${ifacePortId}`) as StreamRef;
  }, [moduleId, getParentStreamRef]);

  const shouldBridgeToParent = !suspended;

  return (
    <div style={{ display: 'none' }}>
      {shouldBridgeToParent && internal.iface.inputs.map((p: any) => {
        const ifacePortId = String(p?.id ?? '').trim();
        if (!ifacePortId) return null;
        const parentIn = getParentInputRefForInterfacePort(ifacePortId);
        const internalOut = getInternalStreamRef(`${SKETCH_IN_MODULE_ID}-out-${ifacePortId}`) as StreamRef;
        return (
          <SketchRefBridge
            key={`bridge-in-${ifacePortId}`}
            from={parentIn}
            to={internalOut}
            enabled={!requiresUserGesture}
          />
        );
      })}

      {shouldBridgeToParent && internal.iface.outputs.map((p: any) => {
        const ifacePortId = String(p?.id ?? '').trim();
        if (!ifacePortId) return null;
        const internalIn = getInternalInputRefForSketchOutPort(ifacePortId);
        const parentOut = getParentOutputRefForInterfacePort(ifacePortId);
        return (
          <SketchRefBridge
            key={`bridge-out-${ifacePortId}`}
            from={internalIn}
            to={parentOut}
            enabled={!requiresUserGesture}
          />
        );
      })}

      {internal.modules.map((module) => {
        if (module.type === 'SketchIn' || module.type === 'SketchOut') {
          return null;
        }
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
          const connection = internal.connections.find(c => c.to.portId === port.id);
          if (requiresUserGesture) return null;
          return connection ? (getInternalStreamRef(connection.from.portId) as StreamRef) : null;
        });

        const cvInputStreams: { [key: string]: StreamRef | null } = {};
        cvPorts.forEach(port => {
          const connection = internal.connections.find(c => c.to.portId === port.id);
          const key = port.id.split('-').slice(-2).join('-');
          cvInputStreams[key] = requiresUserGesture ? null : (connection ? (getInternalStreamRef(connection.from.portId) as StreamRef) : null);
        });

        const outputStreams = outputPorts.map(port => getInternalStreamRef(port.id) as StreamRef);

        const defaults = MODULE_DEFINITIONS[module.type]?.defaultParams ?? {};
        const moduleRuntimeParams = { ...defaults, ...(internal.moduleParams[module.id] || {}) };

        return (
          <ModuleRenderer
            key={module.id}
            moduleId={module.id}
            moduleType={module.type}
            inputStreams={inputStreams}
            outputStreams={outputStreams}
            cvInputStreams={cvInputStreams}
            enabled={module.enabled}
            params={moduleRuntimeParams}
            onParamChange={() => {}}
          />
        );
      })}
    </div>
  );
};
