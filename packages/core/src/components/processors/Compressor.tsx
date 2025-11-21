import React, { useEffect, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export interface CompressorHandle {
  getState: () => {
    threshold: number;
    knee: number;
    ratio: number;
    attack: number;
    release: number;
  };
}

export interface CompressorRenderProps {
  threshold: number;
  setThreshold: (value: number) => void;
  knee: number;
  setKnee: (value: number) => void;
  ratio: number;
  setRatio: (value: number) => void;
  attack: number;
  setAttack: (value: number) => void;
  release: number;
  setRelease: (value: number) => void;
  isActive: boolean;
}

export interface CompressorProps {
  input: ModStreamRef;
  output: ModStreamRef;
  label?: string;
  threshold?: number;
  onThresholdChange?: (threshold: number) => void;
  knee?: number;
  onKneeChange?: (knee: number) => void;
  ratio?: number;
  onRatioChange?: (ratio: number) => void;
  attack?: number;
  onAttackChange?: (attack: number) => void;
  release?: number;
  onReleaseChange?: (release: number) => void;
  children?: (props: CompressorRenderProps) => ReactNode;
}

export const Compressor = React.forwardRef<CompressorHandle, CompressorProps>(({
  input,
  output,
  label = 'compressor',
  threshold: controlledThreshold,
  onThresholdChange,
  knee: controlledKnee,
  onKneeChange,
  ratio: controlledRatio,
  onRatioChange,
  attack: controlledAttack,
  onAttackChange,
  release: controlledRelease,
  onReleaseChange,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const [threshold, setThreshold] = useControlledState(controlledThreshold, -24, onThresholdChange);
  const [knee, setKnee] = useControlledState(controlledKnee, 30, onKneeChange);
  const [ratio, setRatio] = useControlledState(controlledRatio, 12, onRatioChange);
  const [attack, setAttack] = useControlledState(controlledAttack, 0.003, onAttackChange);
  const [release, setRelease] = useControlledState(controlledRelease, 0.25, onReleaseChange);

  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Only recreate when specific input stream changes, not refs
  const inputKey = input.current?.audioNode ? String(input.current.audioNode) : 'null';

  // Create nodes once
  useEffect(() => {
    if (!audioContext) return;

    // Create compressor node
    const compressorNode = audioContext.createDynamicsCompressor();
    compressorNode.threshold.value = threshold;
    compressorNode.knee.value = knee;
    compressorNode.ratio.value = ratio;
    compressorNode.attack.value = attack;
    compressorNode.release.value = release;
    compressorNodeRef.current = compressorNode;

    // Create output gain
    const outputGain = audioContext.createGain();
    outputGain.gain.value = 1.0;
    gainNodeRef.current = outputGain;

    // Connect compressor to output gain
    compressorNode.connect(outputGain);

    // Set output ref
    output.current = {
      audioNode: compressorNode,
      gain: outputGain,
      context: audioContext,
      metadata: {
        label,
        sourceType: 'processor',
      },
      _compressorNode: compressorNode,
    } as any;

    // Cleanup
    return () => {
      compressorNode.disconnect();
      outputGain.disconnect();
      output.current = null;
      compressorNodeRef.current = null;
      gainNodeRef.current = null;
    };
  }, [audioContext, label]);

  // Handle input connection
  useEffect(() => {
    if (!input.current || !compressorNodeRef.current) return;

    input.current.gain.connect(compressorNodeRef.current);

    return () => {
      if (input.current && compressorNodeRef.current) {
        try {
          input.current.gain.disconnect(compressorNodeRef.current);
        } catch (e) {
          // Already disconnected
        }
      }
    };
  }, [inputKey]);

  // Update threshold when it changes
  useEffect(() => {
    if (compressorNodeRef.current) {
      compressorNodeRef.current.threshold.value = threshold;
    }
  }, [threshold]);

  // Update knee when it changes
  useEffect(() => {
    if (compressorNodeRef.current) {
      compressorNodeRef.current.knee.value = knee;
    }
  }, [knee]);

  // Update ratio when it changes
  useEffect(() => {
    if (compressorNodeRef.current) {
      compressorNodeRef.current.ratio.value = ratio;
    }
  }, [ratio]);

  // Update attack when it changes
  useEffect(() => {
    if (compressorNodeRef.current) {
      compressorNodeRef.current.attack.value = attack;
    }
  }, [attack]);

  // Update release when it changes
  useEffect(() => {
    if (compressorNodeRef.current) {
      compressorNodeRef.current.release.value = release;
    }
  }, [release]);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    getState: () => ({ threshold, knee, ratio, attack, release }),
  }), [threshold, knee, ratio, attack, release]);

  // Render children with state
  if (children) {
    return <>{children({
      threshold,
      setThreshold,
      knee,
      setKnee,
      ratio,
      setRatio,
      attack,
      setAttack,
      release,
      setRelease,
      isActive: !!output.current,
    })}</>;
  }

  return null;
});

Compressor.displayName = 'Compressor';
