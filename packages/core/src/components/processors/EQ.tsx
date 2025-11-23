import React, { useEffect, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export interface EQHandle {
  getState: () => {
    lowGain: number;
    midGain: number;
    highGain: number;
    lowFreq: number;
    highFreq: number;
    enabled: boolean;
  };
}

export interface EQRenderProps {
  lowGain: number;
  setLowGain: (value: number) => void;
  midGain: number;
  setMidGain: (value: number) => void;
  highGain: number;
  setHighGain: (value: number) => void;
  lowFreq: number;
  setLowFreq: (value: number) => void;
  highFreq: number;
  setHighFreq: (value: number) => void;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  isActive: boolean;
}

export interface EQProps {
  input: ModStreamRef;
  output: ModStreamRef;
  label?: string;
  lowGain?: number;
  onLowGainChange?: (value: number) => void;
  midGain?: number;
  onMidGainChange?: (value: number) => void;
  highGain?: number;
  onHighGainChange?: (value: number) => void;
  lowFreq?: number;
  onLowFreqChange?: (value: number) => void;
  highFreq?: number;
  onHighFreqChange?: (value: number) => void;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  children?: (props: EQRenderProps) => ReactNode;
}

export const EQ = React.forwardRef<EQHandle, EQProps>(({
  input,
  output,
  label = 'eq',
  lowGain: controlledLowGain,
  onLowGainChange,
  midGain: controlledMidGain,
  onMidGainChange,
  highGain: controlledHighGain,
  onHighGainChange,
  lowFreq: controlledLowFreq,
  onLowFreqChange,
  highFreq: controlledHighFreq,
  onHighFreqChange,
  enabled: controlledEnabled,
  onEnabledChange,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const [lowGain, setLowGain] = useControlledState(controlledLowGain, 0, onLowGainChange);
  const [midGain, setMidGain] = useControlledState(controlledMidGain, 0, onMidGainChange);
  const [highGain, setHighGain] = useControlledState(controlledHighGain, 0, onHighGainChange);
  const [lowFreq, setLowFreq] = useControlledState(controlledLowFreq, 250, onLowFreqChange);
  const [highFreq, setHighFreq] = useControlledState(controlledHighFreq, 4000, onHighFreqChange);
  const [enabled, setEnabled] = useControlledState(controlledEnabled, true, onEnabledChange);

  const lowShelfRef = useRef<BiquadFilterNode | null>(null);
  const midPeakRef = useRef<BiquadFilterNode | null>(null);
  const highShelfRef = useRef<BiquadFilterNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const bypassConnectionRef = useRef<boolean>(false);

  // Create filter nodes once
  useEffect(() => {
    if (!audioContext) return;

    // Create three filters: lowshelf, peaking (mid), highshelf
    const lowShelf = audioContext.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = lowFreq;
    lowShelf.gain.value = lowGain;
    lowShelfRef.current = lowShelf;

    const midPeak = audioContext.createBiquadFilter();
    midPeak.type = 'peaking';
    midPeak.frequency.value = 1000; // Mid frequency (between low and high)
    midPeak.Q.value = 1;
    midPeak.gain.value = midGain;
    midPeakRef.current = midPeak;

    const highShelf = audioContext.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = highFreq;
    highShelf.gain.value = highGain;
    highShelfRef.current = highShelf;

    // Create output gain
    const outputGain = audioContext.createGain();
    outputGain.gain.value = 1.0;
    outputGainRef.current = outputGain;

    // Chain filters together
    lowShelf.connect(midPeak);
    midPeak.connect(highShelf);
    highShelf.connect(outputGain);

    // Set output ref
    output.current = {
      audioNode: lowShelf,
      gain: outputGain,
      context: audioContext,
      metadata: {
        label,
        sourceType: 'processor',
      },
    };

    // Cleanup
    return () => {
      lowShelf.disconnect();
      midPeak.disconnect();
      highShelf.disconnect();
      outputGain.disconnect();
      output.current = null;
      lowShelfRef.current = null;
      midPeakRef.current = null;
      highShelfRef.current = null;
      outputGainRef.current = null;
    };
  }, [audioContext, label]);

  // Handle input connection and bypass routing
  useEffect(() => {
    if (!input.current || !lowShelfRef.current || !outputGainRef.current) return;

    const inputGain = input.current.gain;
    const lowShelf = lowShelfRef.current;
    const outputGain = outputGainRef.current;

    if (enabled) {
      // Normal mode: input → lowShelf (→ midPeak → highShelf) → output
      if (bypassConnectionRef.current) {
        try {
          inputGain.disconnect(outputGain);
        } catch (e) {
          // Already disconnected
        }
        bypassConnectionRef.current = false;
      }
      inputGain.connect(lowShelf);
    } else {
      // Bypass mode: input → output (skip EQ)
      try {
        inputGain.disconnect(lowShelf);
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
          inputGain.disconnect(lowShelf);
        }
      } catch (e) {
        // Already disconnected
      }
    };
  }, [input.current?.audioNode ? String(input.current.audioNode) : 'null', enabled]);

  // Update low shelf parameters
  useEffect(() => {
    if (lowShelfRef.current) {
      lowShelfRef.current.frequency.value = lowFreq;
      lowShelfRef.current.gain.value = lowGain;
    }
  }, [lowFreq, lowGain]);

  // Update mid peak parameters
  useEffect(() => {
    if (midPeakRef.current) {
      // Mid frequency is calculated as geometric mean of low and high
      const midFreq = Math.sqrt(lowFreq * highFreq);
      midPeakRef.current.frequency.value = midFreq;
      midPeakRef.current.gain.value = midGain;
    }
  }, [lowFreq, highFreq, midGain]);

  // Update high shelf parameters
  useEffect(() => {
    if (highShelfRef.current) {
      highShelfRef.current.frequency.value = highFreq;
      highShelfRef.current.gain.value = highGain;
    }
  }, [highFreq, highGain]);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    getState: () => ({ lowGain, midGain, highGain, lowFreq, highFreq, enabled }),
  }), [lowGain, midGain, highGain, lowFreq, highFreq, enabled]);

  // Render children with state
  if (children) {
    return <>{children({
      lowGain,
      setLowGain,
      midGain,
      setMidGain,
      highGain,
      setHighGain,
      lowFreq,
      setLowFreq,
      highFreq,
      setHighFreq,
      enabled,
      setEnabled,
      isActive: !!output.current,
    })}</>;
  }

  return null;
});

EQ.displayName = 'EQ';
