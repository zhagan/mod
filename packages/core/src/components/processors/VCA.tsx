import React, { useEffect, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export interface VCAHandle {
  getState: () => {
    gain: number;
  };
}

export interface VCARenderProps {
  gain: number;
  setGain: (value: number) => void;
  isActive: boolean;
}

export interface VCAProps {
  input: ModStreamRef;
  output: ModStreamRef;
  label?: string;
  gain?: number;
  onGainChange?: (gain: number) => void;
  // CV inputs
  cv?: ModStreamRef;
  cvAmount?: number;
  children?: (props: VCARenderProps) => ReactNode;
}

export const VCA = React.forwardRef<VCAHandle, VCAProps>(({
  input,
  output,
  label = 'vca',
  gain: controlledGain,
  onGainChange,
  cv,
  cvAmount = 1.0,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const [gain, setGain] = useControlledState(controlledGain, 1.0, onGainChange);

  const gainNodeRef = useRef<GainNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const cvGainRef = useRef<GainNode | null>(null);

  // Only recreate when specific input stream changes, not refs
  const inputKey = input.current?.audioNode ? String(input.current.audioNode) : 'null';

  // Create nodes once
  useEffect(() => {
    if (!audioContext) return;

    // Create main gain node (VCA)
    const gainNode = audioContext.createGain();
    gainNode.gain.value = gain;
    gainNodeRef.current = gainNode;

    // Create output gain
    const outputGain = audioContext.createGain();
    outputGain.gain.value = 1.0;
    outputGainRef.current = outputGain;

    // Connect gain to output gain
    gainNode.connect(outputGain);

    // Set output ref
    output.current = {
      audioNode: gainNode,
      gain: outputGain,
      context: audioContext,
      metadata: {
        label,
        sourceType: 'processor',
      },
      _gainNode: gainNode,
    } as any;

    // Cleanup
    return () => {
      gainNode.disconnect();
      outputGain.disconnect();
      output.current = null;
      gainNodeRef.current = null;
      outputGainRef.current = null;
      if (cvGainRef.current) {
        cvGainRef.current.disconnect();
        cvGainRef.current = null;
      }
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
  }, [inputKey]);

  // Handle CV input connection for gain modulation
  useEffect(() => {
    if (!cv?.current || !gainNodeRef.current || !audioContext) return;

    // Create a gain node to scale the CV signal
    const cvGain = audioContext.createGain();
    cvGain.gain.value = cvAmount;
    cvGainRef.current = cvGain;

    // Connect CV to gain parameter via gain
    cv.current.gain.connect(cvGain);
    cvGain.connect(gainNodeRef.current.gain);

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

  // Update gain when it changes (base value)
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = gain;
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
    getState: () => ({ gain }),
  }), [gain]);

  // Render children with state
  if (children) {
    return <>{children({
      gain,
      setGain,
      isActive: !!output.current,
    })}</>;
  }

  return null;
});

VCA.displayName = 'VCA';
