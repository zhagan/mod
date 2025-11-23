import React, { useEffect, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export interface ReverbHandle {
  getState: () => {
    wet: number;
    duration: number;
    decay: number;
    enabled: boolean;
  };
}

export interface ReverbRenderProps {
  wet: number;
  setWet: (value: number) => void;
  duration: number;
  setDuration: (value: number) => void;
  decay: number;
  setDecay: (value: number) => void;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  isActive: boolean;
}

export interface ReverbProps {
  input: ModStreamRef;
  output: ModStreamRef;
  label?: string;
  wet?: number;
  onWetChange?: (wet: number) => void;
  duration?: number;
  onDurationChange?: (duration: number) => void;
  decay?: number;
  onDecayChange?: (decay: number) => void;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  children?: (props: ReverbRenderProps) => ReactNode;
}

export const Reverb = React.forwardRef<ReverbHandle, ReverbProps>(({
  input,
  output,
  label = 'reverb',
  wet: controlledWet,
  onWetChange,
  duration: controlledDuration,
  onDurationChange,
  decay: controlledDecay,
  onDecayChange,
  enabled: controlledEnabled,
  onEnabledChange,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const [wet, setWet] = useControlledState(controlledWet, 0.3, onWetChange);
  const [duration, setDuration] = useControlledState(controlledDuration, 2.0, onDurationChange);
  const [decay, setDecay] = useControlledState(controlledDecay, 2.0, onDecayChange);
  const [enabled, setEnabled] = useControlledState(controlledEnabled, true, onEnabledChange);

  // Track input changes
  const inputKey = input.current?.audioNode ? String(input.current.audioNode) : 'null';

  const convolverRef = useRef<ConvolverNode | null>(null);
  const wetGainRef = useRef<GainNode | null>(null);
  const dryGainRef = useRef<GainNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const bypassConnectionRef = useRef<boolean>(false);

  // Create nodes once
  useEffect(() => {
    if (!audioContext) return;

    // Create convolver for reverb
    const convolver = audioContext.createConvolver();
    convolverRef.current = convolver;

    // Generate impulse response
    const rate = audioContext.sampleRate;
    const length = rate * duration;
    const impulse = audioContext.createBuffer(2, length, rate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }

    convolver.buffer = impulse;

    // Create wet/dry mix
    const wetGain = audioContext.createGain();
    wetGain.gain.value = wet;
    wetGainRef.current = wetGain;

    const dryGain = audioContext.createGain();
    dryGain.gain.value = 1 - wet;
    dryGainRef.current = dryGain;

    // Create output gain
    const outputGain = audioContext.createGain();
    outputGain.gain.value = 1.0;
    outputGainRef.current = outputGain;

    // Connect convolver to wet gain
    convolver.connect(wetGain);

    // Mix wet and dry to output
    wetGain.connect(outputGain);
    dryGain.connect(outputGain);

    // Set output ref with nodes for later parameter updates
    output.current = {
      audioNode: convolver,
      gain: outputGain,
      context: audioContext,
      metadata: {
        label,
        sourceType: 'processor',
      },
      _wetGain: wetGain,
      _dryGain: dryGain,
      _convolver: convolver,
      _duration: duration,
      _decay: decay,
    } as any;

    // Cleanup
    return () => {
      convolver.disconnect();
      wetGain.disconnect();
      dryGain.disconnect();
      outputGain.disconnect();
      output.current = null;
      convolverRef.current = null;
      wetGainRef.current = null;
      dryGainRef.current = null;
      outputGainRef.current = null;
    };
  }, [audioContext, label]);

  // Handle input connection and bypass routing
  useEffect(() => {
    if (!input.current || !convolverRef.current || !dryGainRef.current || !outputGainRef.current) return;

    const inputGain = input.current.gain;
    const convolver = convolverRef.current;
    const dryGain = dryGainRef.current;
    const outputGain = outputGainRef.current;

    if (enabled) {
      // Normal mode: input → dry + convolver → output
      if (bypassConnectionRef.current) {
        try {
          inputGain.disconnect(outputGain);
        } catch (e) {
          // Already disconnected
        }
        bypassConnectionRef.current = false;
      }
      inputGain.connect(dryGain);
      inputGain.connect(convolver);
    } else {
      // Bypass mode: input → output (skip reverb processing)
      try {
        inputGain.disconnect(dryGain);
        inputGain.disconnect(convolver);
      } catch (e) {
        // Already disconnected
      }
      inputGain.connect(outputGain);
      bypassConnectionRef.current = true;
    }

    return () => {
      try {
        if (bypassConnectionRef.current) {
          inputGain.disconnect(outputGain);
        } else {
          inputGain.disconnect(dryGain);
          inputGain.disconnect(convolver);
        }
      } catch (e) {
        // Already disconnected
      }
    };
  }, [inputKey, enabled]);

  // Update wet/dry mix when it changes
  useEffect(() => {
    const stream = output.current as any;
    if (stream?._wetGain && stream?._dryGain) {
      stream._wetGain.gain.value = wet;
      stream._dryGain.gain.value = 1 - wet;
    }
  }, [wet, output]);

  // Regenerate impulse response when duration or decay changes
  useEffect(() => {
    const stream = output.current as any;
    if (stream?._convolver && audioContext) {
      const rate = audioContext.sampleRate;
      const length = rate * duration;
      const impulse = audioContext.createBuffer(2, length, rate);
      const impulseL = impulse.getChannelData(0);
      const impulseR = impulse.getChannelData(1);

      for (let i = 0; i < length; i++) {
        impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }

      stream._convolver.buffer = impulse;
    }
  }, [duration, decay, output, audioContext]);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    getState: () => ({ wet, duration, decay, enabled }),
  }), [wet, duration, decay, enabled]);

  // Render children with state
  if (children) {
    return <>{children({
      wet,
      setWet,
      duration,
      setDuration,
      decay,
      setDecay,
      enabled,
      setEnabled,
      isActive: !!output.current,
    })}</>;
  }

  return null;
});

Reverb.displayName = 'Reverb';
