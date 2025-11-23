import React, { useEffect, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export interface GateHandle {
  getState: () => {
    threshold: number;
    attack: number;
    release: number;
    enabled: boolean;
  };
}

export interface GateRenderProps {
  threshold: number;
  setThreshold: (value: number) => void;
  attack: number;
  setAttack: (value: number) => void;
  release: number;
  setRelease: (value: number) => void;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  isActive: boolean;
}

export interface GateProps {
  input: ModStreamRef;
  output: ModStreamRef;
  label?: string;
  threshold?: number;
  onThresholdChange?: (value: number) => void;
  attack?: number;
  onAttackChange?: (value: number) => void;
  release?: number;
  onReleaseChange?: (value: number) => void;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  children?: (props: GateRenderProps) => ReactNode;
}

export const Gate = React.forwardRef<GateHandle, GateProps>(({
  input,
  output,
  label = 'gate',
  threshold: controlledThreshold,
  onThresholdChange,
  attack: controlledAttack,
  onAttackChange,
  release: controlledRelease,
  onReleaseChange,
  enabled: controlledEnabled,
  onEnabledChange,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const [threshold, setThreshold] = useControlledState(controlledThreshold, -40, onThresholdChange);
  const [attack, setAttack] = useControlledState(controlledAttack, 0.01, onAttackChange);
  const [release, setRelease] = useControlledState(controlledRelease, 0.1, onReleaseChange);
  const [enabled, setEnabled] = useControlledState(controlledEnabled, true, onEnabledChange);

  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const envelopeRef = useRef<number>(0);
  const bypassConnectionRef = useRef<boolean>(false);

  // Store current parameter values in refs so audio callback can access them
  const thresholdRef = useRef<number>(threshold);
  const attackRef = useRef<number>(attack);
  const releaseRef = useRef<number>(release);

  // Update refs when parameters change
  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  useEffect(() => {
    attackRef.current = attack;
  }, [attack]);

  useEffect(() => {
    releaseRef.current = release;
  }, [release]);

  // Create gate nodes once
  useEffect(() => {
    if (!audioContext) return;

    // Use ScriptProcessorNode for custom gating logic
    const bufferSize = 4096;
    const scriptNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
    scriptNodeRef.current = scriptNode;

    // Create output gain
    const outputGain = audioContext.createGain();
    outputGain.gain.value = 1.0;
    outputGainRef.current = outputGain;

    // Process audio - reading from refs for current values
    scriptNode.onaudioprocess = (event) => {
      const inputBuffer = event.inputBuffer.getChannelData(0);
      const outputBuffer = event.outputBuffer.getChannelData(0);

      // Read current parameter values from refs
      const currentThreshold = thresholdRef.current;
      const currentAttack = attackRef.current;
      const currentRelease = releaseRef.current;

      // Convert threshold from dB to linear
      const thresholdLinear = Math.pow(10, currentThreshold / 20);

      // Calculate attack and release coefficients
      const sampleRate = audioContext.sampleRate;
      const attackCoeff = Math.exp(-1 / (currentAttack * sampleRate));
      const releaseCoeff = Math.exp(-1 / (currentRelease * sampleRate));

      for (let i = 0; i < inputBuffer.length; i++) {
        const inputSample = inputBuffer[i];
        const inputLevel = Math.abs(inputSample);

        // Update envelope follower
        if (inputLevel > envelopeRef.current) {
          envelopeRef.current = attackCoeff * envelopeRef.current + (1 - attackCoeff) * inputLevel;
        } else {
          envelopeRef.current = releaseCoeff * envelopeRef.current + (1 - releaseCoeff) * inputLevel;
        }

        // Apply gate
        const gain = envelopeRef.current > thresholdLinear ? 1.0 : 0.0;
        outputBuffer[i] = inputSample * gain;
      }
    };

    // Connect nodes
    scriptNode.connect(outputGain);

    // Set output ref
    output.current = {
      audioNode: scriptNode,
      gain: outputGain,
      context: audioContext,
      metadata: {
        label,
        sourceType: 'processor',
      },
    };

    // Cleanup
    return () => {
      scriptNode.disconnect();
      outputGain.disconnect();
      output.current = null;
      scriptNodeRef.current = null;
      outputGainRef.current = null;
    };
  }, [audioContext, label]);

  // Handle input connection and bypass routing
  useEffect(() => {
    if (!input.current || !scriptNodeRef.current || !outputGainRef.current) return;

    const inputGain = input.current.gain;
    const scriptNode = scriptNodeRef.current;
    const outputGain = outputGainRef.current;

    if (enabled) {
      // Normal mode: input → gate → output
      if (bypassConnectionRef.current) {
        try {
          inputGain.disconnect(outputGain);
        } catch (e) {
          // Already disconnected
        }
        bypassConnectionRef.current = false;
      }
      inputGain.connect(scriptNode);
    } else {
      // Bypass mode: input → output (skip gate)
      try {
        inputGain.disconnect(scriptNode);
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
          inputGain.disconnect(scriptNode);
        }
      } catch (e) {
        // Already disconnected
      }
    };
  }, [input.current?.audioNode ? String(input.current.audioNode) : 'null', enabled]);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    getState: () => ({ threshold, attack, release, enabled }),
  }), [threshold, attack, release, enabled]);

  // Render children with state
  if (children) {
    return <>{children({
      threshold,
      setThreshold,
      attack,
      setAttack,
      release,
      setRelease,
      enabled,
      setEnabled,
      isActive: !!output.current,
    })}</>;
  }

  return null;
});

Gate.displayName = 'Gate';
