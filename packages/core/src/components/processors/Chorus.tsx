import React, { useEffect, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export interface ChorusHandle {
  getState: () => {
    rate: number;
    depth: number;
    delay: number;
    wet: number;
  };
}

export interface ChorusRenderProps {
  rate: number;
  setRate: (value: number) => void;
  depth: number;
  setDepth: (value: number) => void;
  delay: number;
  setDelay: (value: number) => void;
  wet: number;
  setWet: (value: number) => void;
  isActive: boolean;
}

export interface ChorusProps {
  input: ModStreamRef;
  output: ModStreamRef;
  label?: string;
  rate?: number;
  onRateChange?: (value: number) => void;
  depth?: number;
  onDepthChange?: (value: number) => void;
  delay?: number;
  onDelayChange?: (value: number) => void;
  wet?: number;
  onWetChange?: (value: number) => void;
  children?: (props: ChorusRenderProps) => ReactNode;
}

export const Chorus = React.forwardRef<ChorusHandle, ChorusProps>(({
  input,
  output,
  label = 'chorus',
  rate: controlledRate,
  onRateChange,
  depth: controlledDepth,
  onDepthChange,
  delay: controlledDelay,
  onDelayChange,
  wet: controlledWet,
  onWetChange,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const [rate, setRate] = useControlledState(controlledRate, 1.5, onRateChange);
  const [depth, setDepth] = useControlledState(controlledDepth, 0.002, onDepthChange);
  const [delay, setDelay] = useControlledState(controlledDelay, 0.02, onDelayChange);
  const [wet, setWet] = useControlledState(controlledWet, 0.5, onWetChange);

  const dryGainRef = useRef<GainNode | null>(null);
  const wetGainRef = useRef<GainNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);

  // Create chorus nodes once
  useEffect(() => {
    if (!audioContext) return;

    // Create dry/wet paths
    const dryGain = audioContext.createGain();
    const wetGain = audioContext.createGain();
    dryGainRef.current = dryGain;
    wetGainRef.current = wetGain;

    // Create delay node for chorus effect
    const delayNode = audioContext.createDelay(1.0);
    delayNode.delayTime.value = delay;
    delayNodeRef.current = delayNode;

    // Create LFO (Low Frequency Oscillator) for modulation
    const lfo = audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = rate;
    lfoRef.current = lfo;

    // LFO gain controls the depth of modulation
    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = depth;
    lfoGainRef.current = lfoGain;

    // Create output gain
    const outputGain = audioContext.createGain();
    outputGain.gain.value = 1.0;
    outputGainRef.current = outputGain;

    // Connect LFO to delay time modulation
    lfo.connect(lfoGain);
    lfoGain.connect(delayNode.delayTime);

    // Connect wet path
    wetGain.connect(delayNode);
    delayNode.connect(outputGain);

    // Connect dry path
    dryGain.connect(outputGain);

    // Start LFO
    lfo.start(0);

    // Set initial wet/dry mix
    const wetAmount = wet;
    const dryAmount = 1 - wet;
    wetGain.gain.value = wetAmount;
    dryGain.gain.value = dryAmount;

    // Set output ref
    output.current = {
      audioNode: dryGain, // Input connects to both dry and wet
      gain: outputGain,
      context: audioContext,
      metadata: {
        label,
        sourceType: 'processor',
      },
    };

    // Cleanup
    return () => {
      lfo.stop();
      lfo.disconnect();
      lfoGain.disconnect();
      dryGain.disconnect();
      wetGain.disconnect();
      delayNode.disconnect();
      outputGain.disconnect();
      output.current = null;
      dryGainRef.current = null;
      wetGainRef.current = null;
      delayNodeRef.current = null;
      lfoRef.current = null;
      lfoGainRef.current = null;
      outputGainRef.current = null;
    };
  }, [audioContext, label]);

  // Handle input connection
  useEffect(() => {
    if (!input.current || !dryGainRef.current || !wetGainRef.current) return;

    // Connect input to both dry and wet paths
    input.current.gain.connect(dryGainRef.current);
    input.current.gain.connect(wetGainRef.current);

    return () => {
      if (input.current && dryGainRef.current && wetGainRef.current) {
        try {
          input.current.gain.disconnect(dryGainRef.current);
          input.current.gain.disconnect(wetGainRef.current);
        } catch (e) {
          // Already disconnected
        }
      }
    };
  }, [input.current?.audioNode ? String(input.current.audioNode) : 'null']);

  // Update LFO rate
  useEffect(() => {
    if (lfoRef.current) {
      lfoRef.current.frequency.value = rate;
    }
  }, [rate]);

  // Update modulation depth
  useEffect(() => {
    if (lfoGainRef.current) {
      lfoGainRef.current.gain.value = depth;
    }
  }, [depth]);

  // Update base delay
  useEffect(() => {
    if (delayNodeRef.current) {
      delayNodeRef.current.delayTime.value = delay;
    }
  }, [delay]);

  // Update wet/dry mix
  useEffect(() => {
    if (wetGainRef.current && dryGainRef.current) {
      const wetAmount = wet;
      const dryAmount = 1 - wet;
      wetGainRef.current.gain.value = wetAmount;
      dryGainRef.current.gain.value = dryAmount;
    }
  }, [wet]);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    getState: () => ({ rate, depth, delay, wet }),
  }), [rate, depth, delay, wet]);

  // Render children with state
  if (children) {
    return <>{children({
      rate,
      setRate,
      depth,
      setDepth,
      delay,
      setDelay,
      wet,
      setWet,
      isActive: !!output.current,
    })}</>;
  }

  return null;
});

Chorus.displayName = 'Chorus';
