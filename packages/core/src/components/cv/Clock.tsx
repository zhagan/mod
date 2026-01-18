import React, { useEffect, useState, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export interface ClockHandle {
  start: () => void;
  stop: () => void;
  reset: () => void;
  getState: () => {
    bpm: number;
    isRunning: boolean;
  };
}

export interface ClockRenderProps {
  bpm: number;
  setBpm: (value: number) => void;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export interface ClockProps {
  output: ModStreamRef;
  startOutput?: ModStreamRef;
  label?: string;
  // Controlled props
  bpm?: number;
  onBpmChange?: (bpm: number) => void;
  // Event callbacks
  onRunningChange?: (isRunning: boolean) => void;
  // Render props
  children?: (props: ClockRenderProps) => ReactNode;
}

export const Clock = React.forwardRef<ClockHandle, ClockProps>(({
  output,
  startOutput,
  label = 'clock',
  bpm: controlledBpm,
  onBpmChange,
  onRunningChange,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const [bpm, setBpm] = useControlledState(controlledBpm, 120, onBpmChange);
  const [isRunning, setIsRunning] = useState(false);

  const constantSourceRef = useRef<ConstantSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startSourceRef = useRef<ConstantSourceNode | null>(null);
  const startGainRef = useRef<GainNode | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const nextPulseTimeRef = useRef<number>(0);
  const bpmRef = useRef(bpm);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);

  // Create clock output once
  useEffect(() => {
    if (!audioContext) return;

    const constantSource = audioContext.createConstantSource();
    constantSource.offset.value = 0;
    constantSourceRef.current = constantSource;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1.0;
    gainNodeRef.current = gainNode;

    constantSource.connect(gainNode);
    constantSource.start(0);

    output.current = {
      audioNode: constantSource,
      gain: gainNode,
      context: audioContext,
      metadata: {
        label,
        sourceType: 'cv',
      },
    };

    if (startOutput) {
      const startSource = audioContext.createConstantSource();
      startSource.offset.value = 0;
      startSourceRef.current = startSource;

      const startGain = audioContext.createGain();
      startGain.gain.value = 1.0;
      startGainRef.current = startGain;

      startSource.connect(startGain);
      startSource.start(0);

      startOutput.current = {
        audioNode: startSource,
        gain: startGain,
        context: audioContext,
        metadata: {
          label: `${label}-start`,
          sourceType: 'cv',
        },
      };
    }

    return () => {
      if (schedulerRef.current !== null) {
        clearTimeout(schedulerRef.current);
        schedulerRef.current = null;
      }
      constantSource.stop();
      constantSource.disconnect();
      gainNode.disconnect();
      output.current = null;
      constantSourceRef.current = null;
      gainNodeRef.current = null;
      if (startSourceRef.current) {
        startSourceRef.current.stop();
        startSourceRef.current.disconnect();
        startSourceRef.current = null;
      }
      if (startGainRef.current) {
        startGainRef.current.disconnect();
        startGainRef.current = null;
      }
      if (startOutput) {
        startOutput.current = null;
      }
    };
  }, [audioContext, label, startOutput]);

  const start = () => {
    if (isRunning || !audioContext || !constantSourceRef.current) return;
    setIsRunning(true);
    if (startSourceRef.current) {
      startSourceRef.current.offset.setValueAtTime(1, audioContext.currentTime);
    }
    nextPulseTimeRef.current = audioContext.currentTime;
    schedulePulses();
  };

  const stop = () => {
    if (!isRunning) return;
    setIsRunning(false);

    if (schedulerRef.current !== null) {
      clearTimeout(schedulerRef.current);
      schedulerRef.current = null;
    }

    if (constantSourceRef.current && audioContext) {
      constantSourceRef.current.offset.setValueAtTime(0, audioContext.currentTime);
    }
    if (startSourceRef.current && audioContext) {
      startSourceRef.current.offset.setValueAtTime(0, audioContext.currentTime);
    }
  };

  const reset = () => {
    stop();
  };

  const schedulePulses = () => {
    if (!audioContext || !constantSourceRef.current) return;

    const pulseDuration = 0.01;
    const pulseInterval = (60 / bpmRef.current) / 16; // 64th-note pulses
    const lookahead = 0.1;
    const scheduleAheadTime = 0.05;

    while (nextPulseTimeRef.current < audioContext.currentTime + lookahead) {
      const time = nextPulseTimeRef.current;
      constantSourceRef.current.offset.setValueAtTime(1, time);
      constantSourceRef.current.offset.setValueAtTime(0, time + pulseDuration);
      nextPulseTimeRef.current += pulseInterval;
    }

    schedulerRef.current = window.setTimeout(schedulePulses, scheduleAheadTime * 1000);
  };

  useEffect(() => {
    if (isRunning && audioContext) {
      if (schedulerRef.current !== null) {
        clearTimeout(schedulerRef.current);
        schedulerRef.current = null;
      }
      nextPulseTimeRef.current = audioContext.currentTime;
      schedulePulses();
    }
  }, [bpm]);

  useImperativeHandle(ref, () => ({
    start,
    stop,
    reset,
    getState: () => ({ bpm, isRunning }),
  }), [bpm, isRunning]);

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  if (children) {
    return <>{children({
      bpm,
      setBpm,
      isRunning,
      start,
      stop,
      reset,
    })}</>;
  }

  return null;
});

Clock.displayName = 'Clock';
