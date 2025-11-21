import React, { useEffect, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export interface PannerHandle {
  getState: () => {
    pan: number;
  };
}

export interface PannerRenderProps {
  pan: number;
  setPan: (value: number) => void;
  isActive: boolean;
}

export interface PannerProps {
  input: ModStreamRef;
  output: ModStreamRef;
  label?: string;
  pan?: number;
  onPanChange?: (pan: number) => void;
  // CV inputs
  cv?: ModStreamRef;
  cvAmount?: number;
  children?: (props: PannerRenderProps) => ReactNode;
}

export const Panner = React.forwardRef<PannerHandle, PannerProps>(({
  input,
  output,
  label = 'panner',
  pan: controlledPan,
  onPanChange,
  cv,
  cvAmount = 0.5,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const [pan, setPan] = useControlledState(controlledPan, 0, onPanChange);

  const pannerNodeRef = useRef<StereoPannerNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const cvGainRef = useRef<GainNode | null>(null);

  // Only recreate when specific input stream changes, not refs
  const inputKey = input.current?.audioNode ? String(input.current.audioNode) : 'null';

  // Create nodes once
  useEffect(() => {
    if (!audioContext) return;

    // Create stereo panner node
    const pannerNode = audioContext.createStereoPanner();
    pannerNode.pan.value = pan;
    pannerNodeRef.current = pannerNode;

    // Create output gain
    const outputGain = audioContext.createGain();
    outputGain.gain.value = 1.0;
    gainNodeRef.current = outputGain;

    // Connect panner to output gain
    pannerNode.connect(outputGain);

    // Set output ref
    output.current = {
      audioNode: pannerNode,
      gain: outputGain,
      context: audioContext,
      metadata: {
        label,
        sourceType: 'processor',
      },
      _pannerNode: pannerNode,
    } as any;

    // Cleanup
    return () => {
      pannerNode.disconnect();
      outputGain.disconnect();
      output.current = null;
      pannerNodeRef.current = null;
      gainNodeRef.current = null;
      if (cvGainRef.current) {
        cvGainRef.current.disconnect();
        cvGainRef.current = null;
      }
    };
  }, [audioContext, label]);

  // Handle input connection
  useEffect(() => {
    if (!input.current || !pannerNodeRef.current) return;

    input.current.gain.connect(pannerNodeRef.current);

    return () => {
      if (input.current && pannerNodeRef.current) {
        try {
          input.current.gain.disconnect(pannerNodeRef.current);
        } catch (e) {
          // Already disconnected
        }
      }
    };
  }, [inputKey]);

  // Handle CV input connection for pan modulation
  useEffect(() => {
    if (!cv?.current || !pannerNodeRef.current || !audioContext) return;

    // Create a gain node to scale the CV signal
    const cvGain = audioContext.createGain();
    cvGain.gain.value = cvAmount;
    cvGainRef.current = cvGain;

    // Connect CV to pan parameter via gain
    cv.current.gain.connect(cvGain);
    cvGain.connect(pannerNodeRef.current.pan);

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

  // Update pan when it changes (base value)
  useEffect(() => {
    if (pannerNodeRef.current) {
      pannerNodeRef.current.pan.value = pan;
    }
  }, [pan]);

  // Update CV amount when it changes
  useEffect(() => {
    if (cvGainRef.current) {
      cvGainRef.current.gain.value = cvAmount;
    }
  }, [cvAmount]);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    getState: () => ({ pan }),
  }), [pan]);

  // Render children with state
  if (children) {
    return <>{children({
      pan,
      setPan,
      isActive: !!output.current,
    })}</>;
  }

  return null;
});

Panner.displayName = 'Panner';
