import React, { useEffect, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export type CrossFadeMode = 'linear' | 'equal-power' | 'equal-gain' | 'exponential' | 'dj-cut' | 'smooth-step';

export interface CrossFadeHandle {
  getState: () => {
    mix: number;
    mode: CrossFadeMode;
    enabled: boolean;
  };
}

export interface CrossFadeRenderProps {
  mix: number;
  setMix: (value: number) => void;
  mode: CrossFadeMode;
  setMode: (mode: CrossFadeMode) => void;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  isActive: boolean;
}

export interface CrossFadeProps {
  inputs: [ModStreamRef, ModStreamRef];
  output: ModStreamRef;
  label?: string;
  // Controlled props
  mix?: number;
  onMixChange?: (mix: number) => void;
  mode?: CrossFadeMode;
  onModeChange?: (mode: CrossFadeMode) => void;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  // Render props
  children?: (props: CrossFadeRenderProps) => ReactNode;
}

// Calculate gain values based on crossfade mode
const calculateGains = (mix: number, mode: CrossFadeMode): [number, number] => {
  switch (mode) {
    case 'linear':
      // Simple linear crossfade (can have volume dip in middle)
      return [1 - mix, mix];

    case 'equal-power':
      // Constant power crossfade using cosine curves
      const angleA = (1 - mix) * Math.PI / 2;
      const angleB = mix * Math.PI / 2;
      return [Math.cos(angleA), Math.cos(angleB)];

    case 'equal-gain':
      // Equal gain - simpler than equal power
      return [1 - mix, mix];

    case 'exponential':
      // Exponential curve for smoother transitions
      const expA = Math.pow(1 - mix, 2);
      const expB = Math.pow(mix, 2);
      return [expA, expB];

    case 'dj-cut':
      // DJ-style cut - sharp transition in the middle
      if (mix < 0.45) return [1, 0];
      if (mix > 0.55) return [0, 1];
      // Quick crossfade in the middle 10%
      const djMix = (mix - 0.45) / 0.1;
      return [1 - djMix, djMix];

    case 'smooth-step':
      // Smooth S-curve using smoothstep function
      const smoothMix = mix * mix * (3 - 2 * mix);
      return [1 - smoothMix, smoothMix];

    default:
      return [1 - mix, mix];
  }
};

export const CrossFade = React.forwardRef<CrossFadeHandle, CrossFadeProps>(({
  inputs,
  output,
  label = 'crossfade',
  mix: controlledMix,
  onMixChange,
  mode: controlledMode,
  onModeChange,
  enabled: controlledEnabled,
  onEnabledChange,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const [mix, setMix] = useControlledState(controlledMix, 0.5, onMixChange);
  const [mode, setMode] = useControlledState<CrossFadeMode>(controlledMode, 'equal-power', onModeChange);
  const [enabled, setEnabled] = useControlledState(controlledEnabled, true, onEnabledChange);

  const [inputA, inputB] = inputs;

  // Keep refs to nodes so we can disconnect/reconnect without recreating output
  const gainARef = useRef<GainNode | null>(null);
  const gainBRef = useRef<GainNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const bypassConnectionARef = useRef<boolean>(false);
  const bypassConnectionBRef = useRef<boolean>(false);

  // Create keys that change when input streams change (like processors do)
  const inputAKey = inputA.current?.audioNode ? String(inputA.current.audioNode) : 'null';
  const inputBKey = inputB.current?.audioNode ? String(inputB.current.audioNode) : 'null';

  // Create output gain once
  useEffect(() => {
    if (!audioContext) return;

    // Create output gain (only once)
    const outputGain = audioContext.createGain();
    outputGain.gain.value = 1.0;
    outputGainRef.current = outputGain;

    // Create gain nodes for inputs
    const gainA = audioContext.createGain();
    const gainB = audioContext.createGain();
    gainARef.current = gainA;
    gainBRef.current = gainB;

    // Set gain values based on mix and mode
    const [gainAValue, gainBValue] = calculateGains(mix, mode);
    gainA.gain.value = gainAValue;
    gainB.gain.value = gainBValue;

    // Connect both gains to output
    gainA.connect(outputGain);
    gainB.connect(outputGain);

    // Set output ref with internal node references
    output.current = {
      audioNode: outputGain, // Output gain is what downstream connects to
      gain: outputGain,
      context: audioContext,
      metadata: {
        label,
        sourceType: 'mixer',
      },
      _gainA: gainA,
      _gainB: gainB,
    } as any;

    // Cleanup
    return () => {
      gainA.disconnect();
      gainB.disconnect();
      outputGain.disconnect();
      output.current = null;
      gainARef.current = null;
      gainBRef.current = null;
      outputGainRef.current = null;
    };
  }, [audioContext, label]);

  // Handle input connections and bypass routing
  useEffect(() => {
    if (!gainARef.current || !gainBRef.current || !outputGainRef.current) return;

    const gainA = gainARef.current;
    const gainB = gainBRef.current;
    const outputGain = outputGainRef.current;

    if (enabled) {
      // Normal mode: inputs → gains → output
      // Clean up any bypass connections first
      if (bypassConnectionARef.current && inputA.current?.gain) {
        try {
          inputA.current.gain.disconnect(outputGain);
        } catch (e) {
          // Already disconnected
        }
        bypassConnectionARef.current = false;
      }
      if (bypassConnectionBRef.current && inputB.current?.gain) {
        try {
          inputB.current.gain.disconnect(outputGain);
        } catch (e) {
          // Already disconnected
        }
        bypassConnectionBRef.current = false;
      }

      // Connect inputs to their respective gains
      if (inputA.current?.gain) {
        inputA.current.gain.connect(gainA);
      }
      if (inputB.current?.gain) {
        inputB.current.gain.connect(gainB);
      }
    } else {
      // Bypass mode: connect both inputs directly to output
      // Disconnect from gain nodes
      if (inputA.current?.gain) {
        try {
          inputA.current.gain.disconnect(gainA);
        } catch (e) {
          // Already disconnected
        }
        inputA.current.gain.connect(outputGain);
        bypassConnectionARef.current = true;
      }
      if (inputB.current?.gain) {
        try {
          inputB.current.gain.disconnect(gainB);
        } catch (e) {
          // Already disconnected
        }
        inputB.current.gain.connect(outputGain);
        bypassConnectionBRef.current = true;
      }
    }

    return () => {
      // Cleanup based on current state
      if (bypassConnectionARef.current && inputA.current?.gain) {
        try {
          inputA.current.gain.disconnect(outputGain);
        } catch (e) {
          // Already disconnected
        }
      } else if (inputA.current?.gain && gainA) {
        try {
          inputA.current.gain.disconnect(gainA);
        } catch (e) {
          // Already disconnected
        }
      }

      if (bypassConnectionBRef.current && inputB.current?.gain) {
        try {
          inputB.current.gain.disconnect(outputGain);
        } catch (e) {
          // Already disconnected
        }
      } else if (inputB.current?.gain && gainB) {
        try {
          inputB.current.gain.disconnect(gainB);
        } catch (e) {
          // Already disconnected
        }
      }
    };
  }, [inputAKey, inputBKey, enabled]);

  // Update mix and mode when they change
  useEffect(() => {
    const stream = output.current as any;
    if (stream?._gainA && stream?._gainB) {
      const [gainAValue, gainBValue] = calculateGains(mix, mode);
      stream._gainA.gain.value = gainAValue;
      stream._gainB.gain.value = gainBValue;
    }
  }, [mix, mode, output]);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    getState: () => ({ mix, mode, enabled }),
  }), [mix, mode, enabled]);

  // Render children with state
  if (children) {
    return <>{children({
      mix,
      setMix,
      mode,
      setMode,
      enabled,
      setEnabled,
      isActive: !!output.current,
    })}</>;
  }

  return null;
});

CrossFade.displayName = 'CrossFade';
