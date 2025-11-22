import { useRef, useState } from 'react';
import { ModStreamRef } from '../types/ModStream';

// Create a wrapper that tracks when the ref is set
interface ReactiveModStreamRef {
  current: any;
  _timestamp?: number;
}

export const useModStream = (label?: string): ModStreamRef => {
  const [, setUpdateTrigger] = useState(0);
  const internalRef = useRef<any>(null);

  // Create a reactive ref object with a setter that triggers re-renders
  const reactiveRef = useRef<ReactiveModStreamRef>({
    get current() {
      return internalRef.current;
    },
    set current(value: any) {
      const oldValue = internalRef.current;
      internalRef.current = value;

      // Only trigger update when transitioning to/from null
      if ((oldValue === null && value !== null) || (oldValue !== null && value === null)) {
        // Update timestamp to make consumers aware of the change
        (this as any)._timestamp = Date.now();
        // Trigger a re-render in the component that owns this ref
        setUpdateTrigger(prev => prev + 1);
      }
    },
    _timestamp: 0,
  });

  // Store label for debugging purposes
  if (label) {
    (reactiveRef.current as any)._label = label;
  }

  return reactiveRef.current as ModStreamRef;
};
