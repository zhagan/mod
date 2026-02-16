export interface Position {
  x: number;
  y: number;
}

export interface Port {
  id: string;
  type: 'input' | 'output';
  label: string;
}

export interface ModuleData {
  id: string;
  type: string;
  position: Position;
  ports: Port[];
  color: string;
  enabled?: boolean;
}

export interface Connection {
  id: string;
  from: { moduleId: string; portId: string };
  to: { moduleId: string; portId: string };
}

export interface SketchModule {
  id: string;
  type: string;
  position: Position;
  enabled?: boolean;
  params?: Record<string, any>;
}

export interface SketchConnection {
  id: string;
  from: { moduleId: string; portId: string };
  to: { moduleId: string; portId: string };
}

export interface SketchData {
  version: number;
  modules: SketchModule[];
  connections: SketchConnection[];
}

export interface HoveredPort {
  moduleId: string;
  portId: string;
}

export interface DraggingConnectionState {
  from: { moduleId: string; portId: string };
  mousePos: Position;
  startPortType: 'input' | 'output';
}

export interface SidebarDragModuleState {
  moduleType: string;
}
