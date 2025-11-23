import React, { useEffect, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export interface FilterHandle {
  getState: () => {
    frequency: number;
    Q: number;
    type: BiquadFilterType;
    gain: number;
    enabled: boolean;
  };
}

export interface FilterRenderProps {
  frequency: number;
  setFrequency: (value: number) => void;
  Q: number;
  setQ: (value: number) => void;
  type: BiquadFilterType;
  setType: (value: BiquadFilterType) => void;
  gain: number;
  setGain: (value: number) => void;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  isActive: boolean;
}

export interface FilterProps {
  input: ModStreamRef;
  output: ModStreamRef;
  label?: string;
  frequency?: number;
  onFrequencyChange?: (frequency: number) => void;
  Q?: number;
  onQChange?: (Q: number) => void;
  type?: BiquadFilterType;
  onTypeChange?: (type: BiquadFilterType) => void;
  gain?: number;
  onGainChange?: (gain: number) => void;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  // CV inputs
  cv?: ModStreamRef;
  cvAmount?: number;
  children?: (props: FilterRenderProps) => ReactNode;
}

export const Filter = React.forwardRef<FilterHandle, FilterProps>(({
  input,
  output,
  label = 'filter',
  frequency: controlledFrequency,
  onFrequencyChange,
  Q: controlledQ,
  onQChange,
  type: controlledType,
  onTypeChange,
  gain: controlledGain,
  onGainChange,
  enabled: controlledEnabled,
  onEnabledChange,
  cv,
  cvAmount = 1000,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const [frequency, setFrequency] = useControlledState(controlledFrequency, 1000, onFrequencyChange);
  const [Q, setQ] = useControlledState(controlledQ, 1, onQChange);
  const [type, setType] = useControlledState<BiquadFilterType>(controlledType, 'lowpass', onTypeChange);
  const [gain, setGain] = useControlledState(controlledGain, 0, onGainChange);
  const [enabled, setEnabled] = useControlledState(controlledEnabled, true, onEnabledChange);

  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const cvGainRef = useRef<GainNode | null>(null);
  const bypassConnectionRef = useRef<boolean>(false);

  // Only recreate when specific input stream changes, not refs
  const inputKey = input.current?.audioNode ? String(input.current.audioNode) : 'null';

  // Create nodes once
  useEffect(() => {
    if (!audioContext) return;

    // Create filter node
    const filterNode = audioContext.createBiquadFilter();
    filterNode.type = type;
    filterNode.frequency.value = frequency;
    filterNode.Q.value = Q;
    filterNode.gain.value = gain;
    filterNodeRef.current = filterNode;

    // Create output gain
    const outputGain = audioContext.createGain();
    outputGain.gain.value = 1.0;
    gainNodeRef.current = outputGain;

    // Connect filter to output gain
    filterNode.connect(outputGain);

    // Set output ref
    output.current = {
      audioNode: filterNode,
      gain: outputGain,
      context: audioContext,
      metadata: {
        label,
        sourceType: 'processor',
      },
      _filterNode: filterNode,
    } as any;

    // Cleanup
    return () => {
      filterNode.disconnect();
      outputGain.disconnect();
      output.current = null;
      filterNodeRef.current = null;
      gainNodeRef.current = null;
      if (cvGainRef.current) {
        cvGainRef.current.disconnect();
        cvGainRef.current = null;
      }
    };
  }, [audioContext, label]);

  // Handle input connection and bypass routing
  useEffect(() => {
    if (!input.current || !filterNodeRef.current || !gainNodeRef.current) return;

    const inputGain = input.current.gain;
    const filterNode = filterNodeRef.current;
    const outputGain = gainNodeRef.current;

    if (enabled) {
      // Normal mode: input → filter → output
      if (bypassConnectionRef.current) {
        try {
          inputGain.disconnect(outputGain);
        } catch (e) {
          // Already disconnected
        }
        bypassConnectionRef.current = false;
      }
      inputGain.connect(filterNode);
    } else {
      // Bypass mode: input → output (skip filter)
      try {
        inputGain.disconnect(filterNode);
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
          inputGain.disconnect(filterNode);
        }
      } catch (e) {
        // Already disconnected
      }
    };
  }, [inputKey, enabled]);

  // Handle CV input connection for frequency modulation
  useEffect(() => {
    if (!cv?.current || !filterNodeRef.current || !audioContext) return;

    // Create a gain node to scale the CV signal
    const cvGain = audioContext.createGain();
    cvGain.gain.value = cvAmount;
    cvGainRef.current = cvGain;

    // Connect CV to frequency parameter via gain
    cv.current.gain.connect(cvGain);
    cvGain.connect(filterNodeRef.current.frequency);

    return () => {
      if (cvGain && cv.current) {
        try {
          cv.current.gain.disconnect(cvGain);
          cvGain.disconnect();
        } catch (e) {
          // Already disconnected
        }
      }
    };
  }, [cv?.current?.audioNode ? String(cv.current.audioNode) : 'null', cvAmount]);

  // Update frequency when it changes (base value)
  useEffect(() => {
    if (filterNodeRef.current) {
      filterNodeRef.current.frequency.value = frequency;
    }
  }, [frequency]);

  // Update Q when it changes
  useEffect(() => {
    if (filterNodeRef.current) {
      filterNodeRef.current.Q.value = Q;
    }
  }, [Q]);

  // Update type when it changes
  useEffect(() => {
    if (filterNodeRef.current) {
      filterNodeRef.current.type = type;
    }
  }, [type]);

  // Update gain when it changes (for peaking/shelving filters)
  useEffect(() => {
    if (filterNodeRef.current) {
      filterNodeRef.current.gain.value = gain;
    }
  }, [gain]);

  // Update CV amount when it changes
  useEffect(() => {
    if (cvGainRef.current) {
      cvGainRef.current.gain.value = cvAmount;
    }
  }, [cvAmount]);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    getState: () => ({ frequency, Q, type, gain, enabled }),
  }), [frequency, Q, type, gain, enabled]);

  // Render children with state
  if (children) {
    return <>{children({
      frequency,
      setFrequency,
      Q,
      setQ,
      type,
      setType,
      gain,
      setGain,
      enabled,
      setEnabled,
      isActive: !!output.current,
    })}</>;
  }

  return null;
});

Filter.displayName = 'Filter';
