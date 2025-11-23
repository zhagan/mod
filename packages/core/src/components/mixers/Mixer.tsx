import React, { useEffect, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export interface MixerHandle {
  getState: () => {
    levels: number[];
    enabled: boolean;
  };
}

export interface MixerRenderProps {
  levels: number[];
  setLevels: (levels: number[]) => void;
  setLevel: (index: number, value: number) => void;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  isActive: boolean;
}

export interface MixerProps {
  inputs: ModStreamRef[];
  output: ModStreamRef;
  label?: string;
  // Controlled props
  levels?: number[];
  onLevelsChange?: (levels: number[]) => void;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  // Render props
  children?: (props: MixerRenderProps) => ReactNode;
}

export const Mixer = React.forwardRef<MixerHandle, MixerProps>(({
  inputs,
  output,
  label = 'mixer',
  levels: controlledLevels,
  onLevelsChange,
  enabled: controlledEnabled,
  onEnabledChange,
  children,
}, ref) => {
  const audioContext = useAudioContext();

  // Initialize levels based on inputs length
  const defaultLevels = inputs.map(() => 1.0);
  const [levels, setLevels] = useControlledState(controlledLevels, defaultLevels, onLevelsChange);
  const [enabled, setEnabled] = useControlledState(controlledEnabled, true, onEnabledChange);

  // Keep refs to nodes
  const inputGainsRef = useRef<GainNode[]>([]);
  const outputGainRef = useRef<GainNode | null>(null);
  const bypassConnectionsRef = useRef<boolean[]>([]);

  // Create output gain and input gains once
  useEffect(() => {
    if (!audioContext || inputs.length === 0) return;

    // Create output gain (only once)
    const outputGain = audioContext.createGain();
    outputGain.gain.value = 1.0;
    outputGainRef.current = outputGain;

    // Create gain nodes for each input
    const inputGains = inputs.map((_input, index) => {
      const gain = audioContext.createGain();
      const level = levels && levels[index] !== undefined ? levels[index] : 1.0;
      gain.gain.value = level;
      return gain;
    });
    inputGainsRef.current = inputGains;
    bypassConnectionsRef.current = inputs.map(() => false);

    // Connect all input gains to output
    inputGains.forEach(gain => {
      gain.connect(outputGain);
    });

    // Set output ref with internal gain references
    output.current = {
      audioNode: outputGain, // Output node for downstream connections
      gain: outputGain,
      context: audioContext,
      metadata: {
        label,
        sourceType: 'mixer',
      },
      _inputGains: inputGains,
    } as any;

    // Cleanup
    return () => {
      inputGains.forEach(gain => gain.disconnect());
      outputGain.disconnect();
      output.current = null;
      inputGainsRef.current = [];
      outputGainRef.current = null;
      bypassConnectionsRef.current = [];
    };
  }, [audioContext, label, inputs.length]);

  // Handle input connections and bypass routing
  useEffect(() => {
    if (!inputGainsRef.current.length || !outputGainRef.current) return;

    const inputGains = inputGainsRef.current;
    const outputGain = outputGainRef.current;

    inputs.forEach((input, index) => {
      if (!input.current || !inputGains[index]) return;

      const inputGainNode = input.current.gain;
      const channelGain = inputGains[index];

      if (enabled) {
        // Normal mode: inputs → channel gains → output
        // Clean up bypass connection if active
        if (bypassConnectionsRef.current[index]) {
          try {
            inputGainNode.disconnect(outputGain);
          } catch (e) {
            // Already disconnected
          }
          bypassConnectionsRef.current[index] = false;
        }
        inputGainNode.connect(channelGain);
      } else {
        // Bypass mode: connect all inputs directly to output
        try {
          inputGainNode.disconnect(channelGain);
        } catch (e) {
          // Already disconnected
        }
        inputGainNode.connect(outputGain);
        bypassConnectionsRef.current[index] = true;
      }
    });

    // Cleanup when inputs or enabled change
    return () => {
      inputs.forEach((input, index) => {
        if (!input.current || !inputGains[index]) return;

        const inputGainNode = input.current.gain;
        const channelGain = inputGains[index];

        try {
          if (bypassConnectionsRef.current[index]) {
            inputGainNode.disconnect(outputGain);
          } else {
            inputGainNode.disconnect(channelGain);
          }
        } catch (e) {
          // Already disconnected
        }
      });
    };
  }, [inputs, enabled]);

  // Update levels when they change
  useEffect(() => {
    const stream = output.current as any;
    if (stream?._inputGains) {
      levels.forEach((level, index) => {
        if (stream._inputGains[index]) {
          stream._inputGains[index].gain.value = level;
        }
      });
    }
  }, [levels, output]);

  // Helper to update a single level
  const setLevel = (index: number, value: number) => {
    const newLevels = [...levels];
    newLevels[index] = value;
    setLevels(newLevels);
  };

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    getState: () => ({ levels, enabled }),
  }), [levels, enabled]);

  // Render children with state
  if (children) {
    return <>{children({
      levels,
      setLevels,
      setLevel,
      enabled,
      setEnabled,
      isActive: !!output.current,
    })}</>;
  }

  return null;
});

Mixer.displayName = 'Mixer';
