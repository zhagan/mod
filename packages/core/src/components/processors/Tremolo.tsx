import React, { useEffect, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export interface TremoloHandle {
  getState: () => {
    rate: number;
    depth: number;
  };
}

export interface TremoloRenderProps {
  rate: number;
  setRate: (value: number) => void;
  depth: number;
  setDepth: (value: number) => void;
  isActive: boolean;
}

export interface TremoloProps {
  input: ModStreamRef;
  output: ModStreamRef;
  label?: string;
  rate?: number;
  onRateChange?: (rate: number) => void;
  depth?: number;
  onDepthChange?: (depth: number) => void;
  children?: (props: TremoloRenderProps) => ReactNode;
}

export const Tremolo = React.forwardRef<TremoloHandle, TremoloProps>(({
  input,
  output,
  label = 'tremolo',
  rate: controlledRate,
  onRateChange,
  depth: controlledDepth,
  onDepthChange,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const [rate, setRate] = useControlledState(controlledRate, 5, onRateChange);
  const [depth, setDepth] = useControlledState(controlledDepth, 0.5, onDepthChange);

  const gainNodeRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);

  // Create tremolo nodes once
  useEffect(() => {
    if (!audioContext) return;

    // Create main gain node for amplitude modulation
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1.0;
    gainNodeRef.current = gainNode;

    // Create LFO for amplitude modulation
    const lfo = audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = rate;
    lfoRef.current = lfo;

    // LFO gain controls modulation depth
    // We want to modulate around 1.0, so we offset the LFO
    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = depth;
    lfoGainRef.current = lfoGain;

    // Create output gain
    const outputGain = audioContext.createGain();
    outputGain.gain.value = 1.0;
    outputGainRef.current = outputGain;

    // Connect LFO to gain modulation
    // LFO output is -1 to 1, we scale it and offset it to modulate gain
    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);

    // Connect signal path
    gainNode.connect(outputGain);

    // Start LFO
    lfo.start(0);

    // Set output ref
    output.current = {
      audioNode: gainNode,
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
      gainNode.disconnect();
      outputGain.disconnect();
      output.current = null;
      gainNodeRef.current = null;
      lfoRef.current = null;
      lfoGainRef.current = null;
      outputGainRef.current = null;
    };
  }, [audioContext, label]);

  // Handle input connection
  useEffect(() => {
    if (!input.current || !gainNodeRef.current) return;

    input.current.gain.connect(gainNodeRef.current);

    return () => {
      if (input.current && gainNodeRef.current) {
        try {
          input.current.gain.disconnect(gainNodeRef.current);
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

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    getState: () => ({ rate, depth }),
  }), [rate, depth]);

  // Render children with state
  if (children) {
    return <>{children({
      rate,
      setRate,
      depth,
      setDepth,
      isActive: !!output.current,
    })}</>;
  }

  return null;
});

Tremolo.displayName = 'Tremolo';
