import React, { useEffect, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export interface LimiterHandle {
  getState: () => {
    threshold: number;
    release: number;
    enabled: boolean;
  };
}

export interface LimiterRenderProps {
  threshold: number;
  setThreshold: (value: number) => void;
  release: number;
  setRelease: (value: number) => void;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  isActive: boolean;
}

export interface LimiterProps {
  input: ModStreamRef;
  output: ModStreamRef;
  label?: string;
  threshold?: number;
  onThresholdChange?: (value: number) => void;
  release?: number;
  onReleaseChange?: (value: number) => void;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  children?: (props: LimiterRenderProps) => ReactNode;
}

export const Limiter = React.forwardRef<LimiterHandle, LimiterProps>(({
  input,
  output,
  label = 'limiter',
  threshold: controlledThreshold,
  onThresholdChange,
  release: controlledRelease,
  onReleaseChange,
  enabled: controlledEnabled,
  onEnabledChange,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const [threshold, setThreshold] = useControlledState(controlledThreshold, -1, onThresholdChange);
  const [release, setRelease] = useControlledState(controlledRelease, 0.05, onReleaseChange);
  const [enabled, setEnabled] = useControlledState(controlledEnabled, true, onEnabledChange);

  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const bypassConnectionRef = useRef<boolean>(false);

  // Create limiter nodes once
  useEffect(() => {
    if (!audioContext) return;

    // A limiter is essentially a compressor with a very high ratio
    const compressor = audioContext.createDynamicsCompressor();

    // Limiter settings: high ratio, fast attack, adjustable release
    compressor.threshold.value = threshold;
    compressor.knee.value = 0; // Hard knee for limiting
    compressor.ratio.value = 20; // Very high ratio for hard limiting
    compressor.attack.value = 0.001; // Very fast attack (1ms)
    compressor.release.value = release;

    compressorRef.current = compressor;

    // Create output gain
    const outputGain = audioContext.createGain();
    outputGain.gain.value = 1.0;
    outputGainRef.current = outputGain;

    // Connect compressor to output
    compressor.connect(outputGain);

    // Set output ref
    output.current = {
      audioNode: compressor,
      gain: outputGain,
      context: audioContext,
      metadata: {
        label,
        sourceType: 'processor',
      },
    };

    // Cleanup
    return () => {
      compressor.disconnect();
      outputGain.disconnect();
      output.current = null;
      compressorRef.current = null;
      outputGainRef.current = null;
    };
  }, [audioContext, label]);

  // Handle input connection and bypass routing
  useEffect(() => {
    if (!input.current || !compressorRef.current || !outputGainRef.current) return;

    const inputGain = input.current.gain;
    const compressor = compressorRef.current;
    const outputGain = outputGainRef.current;

    if (enabled) {
      // Normal mode: input → limiter → output
      if (bypassConnectionRef.current) {
        try {
          inputGain.disconnect(outputGain);
        } catch (e) {
          // Already disconnected
        }
        bypassConnectionRef.current = false;
      }
      inputGain.connect(compressor);
    } else {
      // Bypass mode: input → output (skip limiter)
      try {
        inputGain.disconnect(compressor);
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
          inputGain.disconnect(compressor);
        }
      } catch (e) {
        // Already disconnected
      }
    };
  }, [input.current?.audioNode ? String(input.current.audioNode) : 'null', enabled]);

  // Update threshold
  useEffect(() => {
    if (compressorRef.current) {
      compressorRef.current.threshold.value = threshold;
    }
  }, [threshold]);

  // Update release
  useEffect(() => {
    if (compressorRef.current) {
      compressorRef.current.release.value = release;
    }
  }, [release]);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    getState: () => ({ threshold, release, enabled }),
  }), [threshold, release, enabled]);

  // Render children with state
  if (children) {
    return <>{children({
      threshold,
      setThreshold,
      release,
      setRelease,
      enabled,
      setEnabled,
      isActive: !!output.current,
    })}</>;
  }

  return null;
});

Limiter.displayName = 'Limiter';
