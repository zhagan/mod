import React, { useEffect, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export interface DistortionHandle {
  getState: () => {
    amount: number;
    enabled: boolean;
  };
}

export interface DistortionRenderProps {
  amount: number;
  setAmount: (value: number) => void;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  isActive: boolean;
}

export interface DistortionProps {
  input: ModStreamRef;
  output: ModStreamRef;
  label?: string;
  amount?: number;
  onAmountChange?: (amount: number) => void;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  children?: (props: DistortionRenderProps) => ReactNode;
}

export const Distortion = React.forwardRef<DistortionHandle, DistortionProps>(({
  input,
  output,
  label = 'distortion',
  amount: controlledAmount,
  onAmountChange,
  enabled: controlledEnabled,
  onEnabledChange,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const [amount, setAmount] = useControlledState(controlledAmount, 50, onAmountChange);
  const [enabled, setEnabled] = useControlledState(controlledEnabled, true, onEnabledChange);

  const waveShaperNodeRef = useRef<WaveShaperNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const bypassConnectionRef = useRef<boolean>(false);

  // Only recreate when specific input stream changes, not refs
  const inputKey = input.current?.audioNode ? String(input.current.audioNode) : 'null';

  // Create distortion curve
  const makeDistortionCurve = (amount: number) => {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }

    return curve;
  };

  // Create nodes once
  useEffect(() => {
    if (!audioContext) return;

    // Create waveshaper node for distortion
    const waveShaperNode = audioContext.createWaveShaper();
    waveShaperNode.curve = makeDistortionCurve(amount);
    waveShaperNode.oversample = '4x';
    waveShaperNodeRef.current = waveShaperNode;

    // Create output gain
    const outputGain = audioContext.createGain();
    outputGain.gain.value = 1.0;
    gainNodeRef.current = outputGain;

    // Connect waveshaper to output gain
    waveShaperNode.connect(outputGain);

    // Set output ref
    output.current = {
      audioNode: waveShaperNode,
      gain: outputGain,
      context: audioContext,
      metadata: {
        label,
        sourceType: 'processor',
      },
      _waveShaperNode: waveShaperNode,
    } as any;

    // Cleanup
    return () => {
      waveShaperNode.disconnect();
      outputGain.disconnect();
      output.current = null;
      waveShaperNodeRef.current = null;
      gainNodeRef.current = null;
    };
  }, [audioContext, label]);

  // Handle input connection and bypass routing
  useEffect(() => {
    if (!input.current || !waveShaperNodeRef.current || !gainNodeRef.current) return;

    const inputGain = input.current.gain;
    const waveShaperNode = waveShaperNodeRef.current;
    const outputGain = gainNodeRef.current;

    if (enabled) {
      // Normal mode: input → waveshaper → output
      if (bypassConnectionRef.current) {
        try {
          inputGain.disconnect(outputGain);
        } catch (e) {
          // Already disconnected
        }
        bypassConnectionRef.current = false;
      }
      inputGain.connect(waveShaperNode);
    } else {
      // Bypass mode: input → output (skip waveshaper)
      try {
        inputGain.disconnect(waveShaperNode);
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
          inputGain.disconnect(waveShaperNode);
        }
      } catch (e) {
        // Already disconnected
      }
    };
  }, [inputKey, enabled]);

  // Update distortion amount when it changes
  useEffect(() => {
    if (waveShaperNodeRef.current) {
      waveShaperNodeRef.current.curve = makeDistortionCurve(amount);
    }
  }, [amount]);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    getState: () => ({ amount, enabled }),
  }), [amount, enabled]);

  // Render children with state
  if (children) {
    return <>{children({
      amount,
      setAmount,
      enabled,
      setEnabled,
      isActive: !!output.current,
    })}</>;
  }

  return null;
});

Distortion.displayName = 'Distortion';
