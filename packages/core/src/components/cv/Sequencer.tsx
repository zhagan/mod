import React, { useEffect, useState, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export interface step {
  active: boolean;
  value: number;
}

export interface SequencerHandle {
  reset: () => void;
  getState: () => {
    steps: step[];
    currentStep: number;
    division: number;
    length: number;
    swing: number;
  };
}

export interface SequencerRenderProps {
  steps: step[];
  setSteps: (steps: step[]) => void;
  currentStep: number;
  division: number;
  setDivision: (value: number) => void;
  length: number;
  setLength: (value: number) => void;
  swing: number;
  setSwing: (value: number) => void;
  reset: () => void;
}

export interface SequencerProps {
  output: ModStreamRef;
  gateOutput?: ModStreamRef; // Optional separate gate/trigger output
  clock?: ModStreamRef;
  reset?: ModStreamRef;
  label?: string;
  numSteps?: number;
  // Controlled props
  steps?: step[];
  onStepsChange?: (steps: step[]) => void;
  division?: number;
  onDivisionChange?: (division: number) => void;
  length?: number;
  onLengthChange?: (length: number) => void;
  swing?: number;
  onSwingChange?: (swing: number) => void;
  // Event callbacks
  onCurrentStepChange?: (currentStep: number) => void;
  // Render props
  children?: (props: SequencerRenderProps) => ReactNode;
}

// Inline worklet to detect clock pulses from an audio/CV input.
const CLOCK_DETECTOR_WORKLET = `
class ClockDetector extends AudioWorkletProcessor {
  constructor() {
    super();
    this._last = 0;
    this._cooldown = 0;
  }
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel) return true;
    for (let i = 0; i < channel.length; i++) {
      const value = channel[i];
      if (this._cooldown > 0) {
        this._cooldown--;
        this._last = value;
        continue;
      }
      if (this._last <= 0.5 && value > 0.5) {
        this.port.postMessage({ type: 'pulse' });
        this._cooldown = 32;
      }
      this._last = value;
    }
    return true;
  }
}
registerProcessor('clock-detector', ClockDetector);
`;

const clockDetectorLoaders = new WeakMap<AudioContext, Promise<void>>();
const clockDetectorUrls = new WeakMap<AudioContext, string>();

const loadClockDetectorWorklet = (audioContext: AudioContext) => {
  let loader = clockDetectorLoaders.get(audioContext);
  if (!loader) {
    const blob = new Blob([CLOCK_DETECTOR_WORKLET], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    clockDetectorUrls.set(audioContext, url);
    loader = audioContext.audioWorklet.addModule(url).then(() => {
      const loadedUrl = clockDetectorUrls.get(audioContext);
      if (loadedUrl) {
        URL.revokeObjectURL(loadedUrl);
        clockDetectorUrls.delete(audioContext);
      }
    }).catch((err) => {
      const loadedUrl = clockDetectorUrls.get(audioContext);
      if (loadedUrl) {
        URL.revokeObjectURL(loadedUrl);
        clockDetectorUrls.delete(audioContext);
      }
      clockDetectorLoaders.delete(audioContext);
      throw err;
    });
    clockDetectorLoaders.set(audioContext, loader);
  }
  return loader;
};

export const Sequencer = React.forwardRef<SequencerHandle, SequencerProps>(({
  output,
  gateOutput,
  clock,
  reset: resetInput,
  label = 'sequencer',
  numSteps = 8,
  steps: controlledSteps,
  onStepsChange,
  division: controlledDivision,
  onDivisionChange,
  length: controlledLength,
  onLengthChange,
  swing: controlledSwing,
  onSwingChange,
  onCurrentStepChange,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const initialSteps: step[] = [];
  for (let i = 0; i < numSteps ; i++) {
    initialSteps.push({active: false, value: 0})
  }
  const [steps, setSteps] = useControlledState(controlledSteps, initialSteps, onStepsChange);
  const [currentStep, setCurrentStep] = useState(0);
  const [division, setDivision] = useControlledState(controlledDivision, 4, onDivisionChange);
  const [length, setLength] = useControlledState(controlledLength, numSteps, onLengthChange);
  const [swing, setSwing] = useControlledState(controlledSwing, 0, onSwingChange);
  const [isListenerReady, setIsListenerReady] = useState(false);
  const [isResetListenerReady, setIsResetListenerReady] = useState(false);

  const constantSourceRef = useRef<ConstantSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const gateSourceRef = useRef<ConstantSourceNode | null>(null);
  const gateGainRef = useRef<GainNode | null>(null);
  const clockListenerRef = useRef<AudioWorkletNode | null>(null);
  const resetListenerRef = useRef<AudioWorkletNode | null>(null);
  const gateDurationRef = useRef(0.05);
  const pulseAccumulatorRef = useRef(0);
  const resetPendingRef = useRef(false);
  const lastPulseTimeRef = useRef<number | null>(null);
  const lastPulseIntervalRef = useRef<number | null>(null);
  const stepTriggerCountRef = useRef(0);
  // Store refs for current state
  const stepsRef = useRef(steps);
  const currentStepRef = useRef(currentStep);
  const divisionRef = useRef(division);
  const swingRef = useRef(swing);

  const normalizeSteps = (nextLength: number, current: step[]) => {
    const clampedLength = Math.max(1, Math.min(32, nextLength));
    const nextSteps = current.slice(0, clampedLength);
    while (nextSteps.length < clampedLength) {
      nextSteps.push({ active: false, value: 0 });
    }
    return nextSteps;
  };

  useEffect(() => { stepsRef.current = steps; }, [steps]);
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
  useEffect(() => {
    divisionRef.current = division;
    pulseAccumulatorRef.current = 0;
  }, [division]);
  useEffect(() => { swingRef.current = swing; }, [swing]);

  useEffect(() => {
    const normalized = normalizeSteps(length, steps);
    if (normalized.length !== steps.length) {
      setSteps(normalized);
    }
    if (currentStepRef.current >= normalized.length) {
      const nextStep = Math.max(0, normalized.length - 1);
      currentStepRef.current = nextStep;
      setCurrentStep(nextStep);
    }
  }, [length, steps, setSteps]);

  // Create sequencer nodes once
  useEffect(() => {
    if (!audioContext) return;

    // Use ConstantSourceNode to output CV values
    const constantSource = audioContext.createConstantSource();
    constantSource.offset.value = steps[0].value || 0;
    constantSourceRef.current = constantSource;

    // Create gain node for output
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1.0;
    gainNodeRef.current = gainNode;

    // Connect constant source to gain
    constantSource.connect(gainNode);

    // Start constant source
    constantSource.start(0);

    // Set output ref
    output.current = {
      audioNode: constantSource,
      gain: gainNode,
      context: audioContext,
      metadata: {
        label,
        sourceType: 'cv',
      },
    };

    // Create gate output if provided
    if (gateOutput) {
      const gateSource = audioContext.createConstantSource();
      gateSource.offset.value = 0; // Gate starts low
      gateSourceRef.current = gateSource;

      const gateGain = audioContext.createGain();
      gateGain.gain.value = 1.0;
      gateGainRef.current = gateGain;

      gateSource.connect(gateGain);
      gateSource.start(0);

      gateOutput.current = {
        audioNode: gateSource,
        gain: gateGain,
        context: audioContext,
        metadata: {
          label: `${label}-gate`,
          sourceType: 'cv',
        },
      };
    }

  // Cleanup
  return () => {
      constantSource.stop();
      constantSource.disconnect();
      gainNode.disconnect();
      output.current = null;
      constantSourceRef.current = null;
      gainNodeRef.current = null;

      if (gateSourceRef.current) {
        gateSourceRef.current.stop();
        gateSourceRef.current.disconnect();
        gateSourceRef.current = null;
      }
      if (gateGainRef.current) {
        gateGainRef.current.disconnect();
        gateGainRef.current = null;
      }
      if (gateOutput) {
        gateOutput.current = null;
      }
    };
  }, [audioContext, label, gateOutput]);

  const getPulsesPerStep = (divisionValue: number) => {
    const pulsesPerStepMap: Record<number, number> = {
      1: 16, // 1/4
      2: 8,  // 1/8
      3: 6,  // dotted 1/16
      4: 4,  // 1/16
      6: 3,  // dotted 1/32
      8: 2,  // 1/32
      12: 1.5, // dotted 1/64
      16: 1, // 1/64
    };
    return pulsesPerStepMap[divisionValue] ?? Math.max(1, 16 / divisionValue);
  };

  // Create clock listener
  useEffect(() => {
    if (!audioContext) return;
    let cancelled = false;

    loadClockDetectorWorklet(audioContext).then(() => {
      if (cancelled) return;
      const node = new AudioWorkletNode(audioContext, 'clock-detector', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        channelCount: 1,
      });
      clockListenerRef.current = node;
      node.port.onmessage = (event) => {
        if (event.data?.type !== 'pulse') return;
        if (!audioContext || !constantSourceRef.current) return;
        if (!stepsRef.current.length) return;
        const pulsesPerStep = getPulsesPerStep(divisionRef.current);
        const now = audioContext.currentTime;
        const lastPulseTime = lastPulseTimeRef.current;
        if (lastPulseTime !== null) {
          lastPulseIntervalRef.current = now - lastPulseTime;
        }
        lastPulseTimeRef.current = now;
        pulseAccumulatorRef.current += 1;
        if (pulseAccumulatorRef.current < pulsesPerStep) return;

        pulseAccumulatorRef.current -= pulsesPerStep;
        const nextStep = resetPendingRef.current
          ? 0
          : (currentStepRef.current + 1) % stepsRef.current.length;
        let swingOffset = 0;
        // Swing delays every other step to push/pull the 16th grid without moving the downbeat.
        const swingAmount = Math.max(-50, Math.min(50, swingRef.current));
        const pulseInterval = lastPulseIntervalRef.current;
        if (pulseInterval && swingAmount !== 0) {
          const stepInterval = pulseInterval * pulsesPerStep;
          const delaySeconds = (Math.abs(swingAmount) / 100) * stepInterval;
          const isOddStep = stepTriggerCountRef.current % 2 === 1;
          const delayOdd = swingAmount > 0;
          const shouldDelay = delayOdd ? isOddStep : !isOddStep;
          swingOffset = shouldDelay ? delaySeconds : 0;
        }
        const triggerTime = now + swingOffset;
        constantSourceRef.current.offset.setValueAtTime(stepsRef.current[nextStep].value, triggerTime);
        if (gateSourceRef.current && stepsRef.current[nextStep].active) {
          const baseGate = gateDurationRef.current;
          const pulseInterval = lastPulseIntervalRef.current;
          const gateDuration = pulseInterval ? Math.min(baseGate, pulseInterval * 0.5) : baseGate;
          gateSourceRef.current.offset.setValueAtTime(1, triggerTime);
          gateSourceRef.current.offset.setValueAtTime(0, triggerTime + gateDuration);
        }
        stepTriggerCountRef.current += 1;
        currentStepRef.current = nextStep;
        setCurrentStep(nextStep);
        resetPendingRef.current = false;
      };
      setIsListenerReady(true);
    }).catch((err) => {
      if (cancelled) return;
      console.error('Failed to load clock detector worklet', err);
    });

    return () => {
      cancelled = true;
      if (clockListenerRef.current) {
        clockListenerRef.current.port.onmessage = null;
        try { clockListenerRef.current.disconnect(); } catch (e) {}
        clockListenerRef.current = null;
      }
      setIsListenerReady(false);
    };
  }, [audioContext]);

  // Create reset listener
  useEffect(() => {
    if (!audioContext) return;
    let cancelled = false;

    loadClockDetectorWorklet(audioContext).then(() => {
      if (cancelled) return;
      const node = new AudioWorkletNode(audioContext, 'clock-detector', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        channelCount: 1,
      });
      resetListenerRef.current = node;
      node.port.onmessage = (event) => {
        if (event.data?.type !== 'pulse') return;
        resetSequence();
      };
      setIsResetListenerReady(true);
    }).catch((err) => {
      if (cancelled) return;
      console.error('Failed to load reset detector worklet', err);
    });

    return () => {
      cancelled = true;
      if (resetListenerRef.current) {
        resetListenerRef.current.port.onmessage = null;
        try { resetListenerRef.current.disconnect(); } catch (e) {}
        resetListenerRef.current = null;
      }
      setIsResetListenerReady(false);
    };
  }, [audioContext]);

  // Connect clock input to listener
  const clockKey = clock?.current?.audioNode ? String(clock.current.audioNode) : 'null';
  useEffect(() => {
    if (!clock?.current || !clockListenerRef.current || !isListenerReady) return;
    const inGain = clock.current.gain;
    const listener = clockListenerRef.current;
    inGain.connect(listener);
    return () => {
      try { inGain.disconnect(listener); } catch (e) {}
    };
  }, [clockKey, isListenerReady]);

  // Connect reset input to listener
  const resetKey = resetInput?.current?.audioNode ? String(resetInput.current.audioNode) : 'null';
  useEffect(() => {
    if (!resetInput?.current || !resetListenerRef.current || !isResetListenerReady) return;
    const inGain = resetInput.current.gain;
    const listener = resetListenerRef.current;
    inGain.connect(listener);
    return () => {
      try { inGain.disconnect(listener); } catch (e) {}
    };
  }, [resetKey, isResetListenerReady]);

  // Reset function
  const resetSequence = () => {
    setCurrentStep(0);
    currentStepRef.current = 0;
    pulseAccumulatorRef.current = getPulsesPerStep(divisionRef.current) - 1;
    resetPendingRef.current = true;
    lastPulseTimeRef.current = null;
    lastPulseIntervalRef.current = null;
    stepTriggerCountRef.current = 0;
    if (constantSourceRef.current && audioContext) {
      const now = audioContext.currentTime;
      constantSourceRef.current.offset.setValueAtTime(stepsRef.current[0].value, now);
    }
  };

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    reset: resetSequence,
    getState: () => ({ steps, currentStep, division, length, swing }),
  }), [steps, currentStep, division, length, swing]);

  // Event callback effects
  useEffect(() => {
    onCurrentStepChange?.(currentStep);
  }, [currentStep, onCurrentStepChange]);

  // Render children with state
  if (children) {
    return <>{children({
      steps,
      setSteps,
      currentStep,
      division,
      setDivision,
      length,
      setLength,
      swing,
      setSwing,
      reset: resetSequence,
    })}</>;
  }

  return null;
});

Sequencer.displayName = 'Sequencer';
