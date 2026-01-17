import React, { useEffect, useState, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export interface step {
  active: boolean;
  value: number;
}

export interface SequencerHandle {
  play: () => void;
  pause: () => void;
  reset: () => void;
  getState: () => {
    steps: step[];
    currentStep: number;
    bpm: number;
    isPlaying: boolean;
  };
}

export interface SequencerRenderProps {
  steps: step[];
  setSteps: (steps: step[]) => void;
  currentStep: number;
  bpm: number;
  setBpm: (value: number) => void;
  division: number;
  setDivision: (value: number) => void;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  reset: () => void;
}

export interface SequencerProps {
  output: ModStreamRef;
  gateOutput?: ModStreamRef; // Optional separate gate/trigger output
  label?: string;
  numSteps?: number;
  // Controlled props
  steps?: step[];
  onStepsChange?: (steps: step[]) => void;
  bpm?: number;
  onBpmChange?: (bpm: number) => void;
  division?: number;
  onDivisionChange?: (division: number) => void;
  // Event callbacks
  onCurrentStepChange?: (currentStep: number) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
  // Render props
  children?: (props: SequencerRenderProps) => ReactNode;
}

export const Sequencer = React.forwardRef<SequencerHandle, SequencerProps>(({
  output,
  gateOutput,
  label = 'sequencer',
  numSteps = 8,
  steps: controlledSteps,
  onStepsChange,
  bpm: controlledBpm,
  onBpmChange,
  division: controlledDivision,
  onDivisionChange,
  onCurrentStepChange,
  onPlayingChange,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const initialSteps: step[] = []
  for (let i = 0; i < numSteps ; i++) {
    initialSteps.push({active: false, value: 0.5})
  }
  const [steps, setSteps] = useControlledState(controlledSteps, initialSteps, onStepsChange);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useControlledState(controlledBpm, 120, onBpmChange);
  const [division, setDivision] = useControlledState(controlledDivision, 4, onDivisionChange);
  const [isPlaying, setIsPlaying] = useState(false);

  const constantSourceRef = useRef<ConstantSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const gateSourceRef = useRef<ConstantSourceNode | null>(null);
  const gateGainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<number | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const nextStepTimeRef = useRef<number>(0);
  // Store refs for current state
  const stepsRef = useRef(steps);
  const currentStepRef = useRef(currentStep);
  const bpmRef = useRef(bpm);
  const divisionRef = useRef(division);


  useEffect(() => { stepsRef.current = steps; }, [steps]);
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { divisionRef.current = division; }, [division]);

  // Create sequencer nodes once
  useEffect(() => {
    if (!audioContext) return;

    // Use ConstantSourceNode to output CV values
    const constantSource = audioContext.createConstantSource();
    constantSource.offset.value = steps[0].value || 0.5;
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
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
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

  // Play function
  const play = () => {
    if (isPlaying || !audioContext) return;
    setIsPlaying(true);
    nextStepTimeRef.current = audioContext.currentTime;
    scheduleSteps();
  };

  // Pause function
  const pause = () => {
    if (!isPlaying) return;
    setIsPlaying(false);
    if (schedulerRef.current !== null) {
      clearTimeout(schedulerRef.current);
      schedulerRef.current = null;
    }
  };

  const scheduleSteps = () => {
    if (!audioContext) return;

    const stepDuration = (60 / bpmRef.current) / divisionRef.current; // seconds per step
    const lookahead = 0.1; // seconds to look ahead
    const scheduleAheadTime = 0.05; // seconds

    while (nextStepTimeRef.current < audioContext.currentTime + lookahead) {
      // Schedule step at nextStepTimeRef.current
      const stepIdx = (currentStepRef.current + 1) % stepsRef.current.length;

      // Set CV/gate at scheduled time
      if (constantSourceRef.current) {
        constantSourceRef.current.offset.setValueAtTime(stepsRef.current[stepIdx].value, nextStepTimeRef.current);
      }
      if (gateSourceRef.current && stepsRef.current[stepIdx].active) {
        gateSourceRef.current.offset.setValueAtTime(1, nextStepTimeRef.current);
        gateSourceRef.current.offset.setValueAtTime(0, nextStepTimeRef.current + stepDuration * 0.8);
      }

      // Update for next step
      nextStepTimeRef.current += stepDuration;
      setCurrentStep(stepIdx);
    }

    // Schedule next scheduler tick
    schedulerRef.current = window.setTimeout(scheduleSteps, scheduleAheadTime * 1000);
  };

  // Reset function
  const reset = () => {
    pause();
    setCurrentStep(0);
    if (constantSourceRef.current && audioContext) {
      const now = audioContext.currentTime;
      constantSourceRef.current.offset.setValueAtTime(stepsRef.current[0].value, now);
    }
  };

  // Update interval when BPM changes
  useEffect(() => {
    if (isPlaying && audioContext) {
      // Clear existing scheduler
      if (schedulerRef.current !== null) {
        clearTimeout(schedulerRef.current);
        schedulerRef.current = null;
      }

      scheduleSteps();
    }
  }, [bpm, division]);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    play,
    pause,
    reset,
    getState: () => ({ steps, currentStep, bpm, isPlaying }),
  }), [steps, currentStep, bpm, isPlaying]);

  // Event callback effects
  useEffect(() => {
    onCurrentStepChange?.(currentStep);
  }, [currentStep, onCurrentStepChange]);

  useEffect(() => {
    onPlayingChange?.(isPlaying);
  }, [isPlaying, onPlayingChange]);

  // Render children with state
  if (children) {
    return <>{children({
      steps,
      setSteps,
      currentStep,
      bpm,
      setBpm,
      division,
      setDivision,
      isPlaying,
      play,
      pause,
      reset,
    })}</>;
  }

  return null;
});

Sequencer.displayName = 'Sequencer';
