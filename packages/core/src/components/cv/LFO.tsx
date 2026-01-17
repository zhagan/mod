import React, { useEffect, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export type LFOWaveform = 'sine' | 'square' | 'saw up' | 'saw down' | 'triangle' | 'sampleHold';

export interface LFOHandle {
  getState: () => {
    frequency: number;
    amplitude: number;
    waveform: LFOWaveform;
  };
}

export interface LFORenderProps {
  frequency: number;
  setFrequency: (value: number) => void;
  amplitude: number;
  setAmplitude: (value: number) => void;
  waveform: LFOWaveform;
  setWaveform: (value: LFOWaveform) => void;
  isActive: boolean;
}

export interface LFOProps {
  output: ModStreamRef;
  label?: string;
  // Controlled props
  frequency?: number;
  onFrequencyChange?: (frequency: number) => void;
  amplitude?: number;
  onAmplitudeChange?: (amplitude: number) => void;
  waveform?: LFOWaveform;
  onWaveformChange?: (waveform: LFOWaveform) => void;
  // Render props
  children?: (props: LFORenderProps) => ReactNode;
}

export const LFO = React.forwardRef<LFOHandle, LFOProps>(({
  output,
  label = 'lfo',
  frequency: controlledFrequency,
  onFrequencyChange,
  amplitude: controlledAmplitude,
  onAmplitudeChange,
  waveform: controlledWaveform,
  onWaveformChange,
  children,
}, ref) => {
  const audioContext = useAudioContext();

  const [frequency, setFrequency] = useControlledState(controlledFrequency, 1, onFrequencyChange);
  const [amplitude, setAmplitude] = useControlledState(controlledAmplitude, 1, onAmplitudeChange);
  const [waveform, setWaveform] = useControlledState<LFOWaveform>(controlledWaveform, 'sine', onWaveformChange);

  // Regular LFO nodes
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Sample & Hold nodes/timer
  const constantRef = useRef<ConstantSourceNode | null>(null);
  const shTimerRef = useRef<number | null>(null);

  // Helper: stop interval safely
  const stopSHTimer = () => {
    if (shTimerRef.current != null) {
      window.clearInterval(shTimerRef.current);
      shTimerRef.current = null;
    }
  };

  // Helper: (re)start sample & hold ticking at current frequency
  const startSHTimer = (ctx: AudioContext, cv: ConstantSourceNode, hz: number) => {
    stopSHTimer();

    const safeHz = Math.max(0.001, hz);
    const intervalMs = Math.max(5, Math.round(1000 / safeHz)); // clamp so we don't try 0ms

    shTimerRef.current = window.setInterval(() => {
      // random in [-1, 1]
      const v = Math.random() * 2 - 1;

      // schedule slightly ahead to reduce jitter
      const t = ctx.currentTime + 0.01;
      cv.offset.setValueAtTime(v, t);
    }, intervalMs);
  };

  // Create nodes (and rebuild graph when waveform mode changes)
  useEffect(() => {
    if (!audioContext) return;

      // --- Standard oscillator LFO ---
      const oscillator = audioContext.createOscillator();
      if (waveform === 'sine' || waveform === 'square' || waveform === 'triangle') oscillator.type = waveform;
      else if (waveform === 'saw up' || waveform === 'saw down') oscillator.type = 'sawtooth';

      oscillator.frequency.value = frequency;
      oscillatorRef.current = oscillator;

      // Gain node (amplitude control) shared by both modes
      const gainNode = audioContext.createGain();
      gainNode.gain.value = amplitude;
      gainNodeRef.current = gainNode;


      oscillator.connect(gainNode);
      oscillator.start(0);

      // --- Sample & Hold LFO (control-rate) ---
      const cv = audioContext.createConstantSource();
      cv.offset.value = 0;
      constantRef.current = cv;

      cv.start(0);

      // start ticking
      startSHTimer(audioContext, cv, frequency);

      output.current = {
        audioNode: waveform !== 'sampleHold' ? oscillator : cv,
        gain: gainNode,
        context: audioContext,
        metadata: {
          label,
          sourceType: 'cv',
        },
      };

      return () => {
        oscillator.stop();
        oscillator.disconnect();
        oscillatorRef.current = null;
        cv.stop();
        cv.disconnect();
        gainNode.disconnect();
        output.current = null;
        constantRef.current = null;
        gainNodeRef.current = null;
      };
  }, [audioContext, label]); // rebuild on waveform change

  // Update frequency when it changes
  useEffect(() => {
    if (!audioContext) return;

    // Standard oscillator
    if (oscillatorRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(frequency, audioContext.currentTime);
    }

    // SampleHold: restart interval at new rate
    if (waveform === 'sampleHold' && constantRef.current) {
      startSHTimer(audioContext, constantRef.current, frequency);
    }
  }, [frequency, audioContext, waveform]);

  // Update amplitude when it changes
  useEffect(() => {
    if (gainNodeRef.current && waveform !== 'saw down') {
      gainNodeRef.current.gain.value = amplitude;
    } else if (gainNodeRef.current && waveform === 'saw down') {
      gainNodeRef.current.gain.value = -amplitude;
    }
  }, [amplitude, waveform]);

  // Update waveform when it changes
  useEffect(() => {
    if (!audioContext || !gainNodeRef.current) return;

    if (waveform === 'sampleHold' && constantRef.current) {
      // Disconnect oscillator, connect constant source
      oscillatorRef.current?.disconnect();
      constantRef.current.connect(gainNodeRef.current);
      output.current = {
        audioNode: constantRef.current,
        gain: gainNodeRef.current,
        context: audioContext,
        metadata: { label, sourceType: 'cv' },
      };
      startSHTimer(audioContext, constantRef.current, frequency);
    } else if (oscillatorRef.current) {
      // Disconnect constant source, connect oscillator
      constantRef.current?.disconnect();
      oscillatorRef.current.connect(gainNodeRef.current);
      if (waveform === 'saw up' || waveform === 'saw down') oscillatorRef.current.type = 'sawtooth';
      else oscillatorRef.current.type = waveform as OscillatorType;
      output.current = {
        audioNode: oscillatorRef.current,
        gain: gainNodeRef.current,
        context: audioContext,
        metadata: { label, sourceType: 'cv' },
      };
      stopSHTimer();
    }
  }, [waveform, audioContext, frequency]);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    getState: () => ({ frequency, amplitude, waveform }),
  }), [frequency, amplitude, waveform]);

  // Render children with state
  if (children) {
    return <>{children({
      frequency,
      setFrequency,
      amplitude,
      setAmplitude,
      waveform,
      setWaveform,
      isActive: !!output.current,
    })}</>;
  }

  return null;
});

LFO.displayName = 'LFO';
