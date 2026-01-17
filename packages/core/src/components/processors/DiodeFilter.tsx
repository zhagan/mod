import React, { useEffect, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export interface DiodeFilterHandle {
  getState: () => { cutoff: number; resonance: number; drive: number; enabled: boolean };
}

export interface DiodeFilterRenderProps {
  cutoff: number;
  setCutoff: (v: number) => void;
  resonance: number;
  setResonance: (v: number) => void;
  drive: number;
  setDrive: (v: number) => void;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  isActive: boolean;
}

export interface DiodeFilterProps {
  input: ModStreamRef;
  output: ModStreamRef;
  label?: string;
  cutoff?: number;
  onCutoffChange?: (v: number) => void;
  resonance?: number;
  onResonanceChange?: (v: number) => void;
  drive?: number;
  onDriveChange?: (v: number) => void;
  enabled?: boolean;
  onEnabledChange?: (v: boolean) => void;
  // CV input to modulate cutoff
  cv?: ModStreamRef;
  cvAmount?: number;
  children?: (props: DiodeFilterRenderProps) => ReactNode;
}

// Inline worklet source to avoid bundler path issues
const WORKLET_SOURCE = `
class DiodeFilterProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'cutoff', defaultValue: 1000, minValue: 20, maxValue: 20000, automationRate: 'a-rate' },
      { name: 'resonance', defaultValue: 0.1, minValue: 0, maxValue: 4, automationRate: 'a-rate' },
      { name: 'drive', defaultValue: 0.0, minValue: 0, maxValue: 10, automationRate: 'a-rate' },
    ];
  }
  constructor() {
    super();
    this._stages = [];
    this._prevOut = [];
    this.sampleRate = sampleRate;
  }
  process(inputs, outputs, parameters) {
    const inputChannels = inputs[0] || [];
    const outputChannels = outputs[0] || [];
    const numChannels = Math.max(inputChannels.length, outputChannels.length, 1);
    for (let ch = 0; ch < numChannels; ch++) {
      const input = inputChannels[ch] || new Float32Array(128);
      const output = outputChannels[ch] || new Float32Array(128);
      if (!this._stages[ch] || this._stages[ch].length !== 4) {
        this._stages[ch] = [0,0,0,0];
        this._prevOut[ch] = 0;
      }
      const s = this._stages[ch];
      const cutoffParam = parameters.cutoff;
      const resParam = parameters.resonance;
      const driveParam = parameters.drive;
      for (let i = 0; i < output.length; i++) {
        const inSample = input[i] || 0;
        const cutoff = cutoffParam.length > 1 ? cutoffParam[i] : cutoffParam[0];
        const resonance = resParam.length > 1 ? resParam[i] : resParam[0];
        const drive = driveParam.length > 1 ? driveParam[i] : driveParam[0];
        const fc = Math.max(20, Math.min(this.sampleRate*0.5-1, cutoff));
        const g = Math.exp(-2*Math.PI*fc/this.sampleRate);
        const b = 1 - g;
        const feedback = resonance * this._prevOut[ch];
        const u = Math.tanh((inSample - feedback) * (1 + drive));
        s[0] = b * u + g * s[0];
        s[1] = b * s[0] + g * s[1];
        s[2] = b * s[1] + g * s[2];
        s[3] = b * s[2] + g * s[3];
        const out = s[3];
        this._prevOut[ch] = out;
        output[i] = out;
      }
    }
    return true;
  }
}
registerProcessor('diode-filter-processor', DiodeFilterProcessor);
`;

export const DiodeFilter = React.forwardRef<DiodeFilterHandle, DiodeFilterProps>(({
  input,
  output,
  label = 'diode-filter',
  cutoff: controlledCutoff,
  onCutoffChange,
  resonance: controlledResonance,
  onResonanceChange,
  drive: controlledDrive,
  onDriveChange,
  enabled: controlledEnabled,
  onEnabledChange,
  cv,
  cvAmount = 1000,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const [cutoff, setCutoff] = useControlledState(controlledCutoff, 1000, onCutoffChange);
  const [resonance, setResonance] = useControlledState(controlledResonance, 0.1, onResonanceChange);
  const [drive, setDrive] = useControlledState(controlledDrive, 0.0, onDriveChange);
  const [enabled, setEnabled] = useControlledState(controlledEnabled, true, onEnabledChange);

  const nodeRef = useRef<AudioWorkletNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const bypassRef = useRef<boolean>(false);
  const blobUrlRef = useRef<string | null>(null);

  // Create worklet node once
  useEffect(() => {
    if (!audioContext) return;

    let cancelled = false;

    // Create blob URL from source
    const blob = new Blob([WORKLET_SOURCE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;

    audioContext.audioWorklet.addModule(url).then(() => {
      if (cancelled) return;
      const node = new AudioWorkletNode(audioContext, 'diode-filter-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2],
        parameterData: { cutoff, resonance, drive },
      });
      nodeRef.current = node;

      const outGain = audioContext.createGain();
      outGain.gain.value = 1.0;
      outputGainRef.current = outGain;

      node.connect(outGain);

      output.current = {
        audioNode: node,
        gain: outGain,
        context: audioContext,
        metadata: { label, sourceType: 'processor' },
      } as any;
    }).catch((e) => {
      // If addModule fails, leave output null
      console.error('Failed to load diode filter worklet', e);
    });

    return () => {
      cancelled = true;
      if (nodeRef.current) {
        try { nodeRef.current.disconnect(); } catch (e) {}
        nodeRef.current = null;
      }
      if (outputGainRef.current) {
        try { outputGainRef.current.disconnect(); } catch (e) {}
        outputGainRef.current = null;
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      output.current = null;
    };
  }, [audioContext]);

  // Handle input routing / bypass
  useEffect(() => {
    if (!input.current || !nodeRef.current || !outputGainRef.current) return;
    const inGain = input.current.gain;
    const node = nodeRef.current;
    const outGain = outputGainRef.current;

    if (enabled) {
      if (bypassRef.current) {
        try { inGain.disconnect(outGain); } catch (e) {}
        bypassRef.current = false;
      }
      inGain.connect(node);
    } else {
      try { inGain.disconnect(node); } catch (e) {}
      inGain.connect(outGain);
      bypassRef.current = true;
    }

    return () => {
      try {
        if (bypassRef.current) inGain.disconnect(outGain);
        else inGain.disconnect(node);
      } catch (e) {}
    };
  }, [input.current?.audioNode ? String(input.current.audioNode) : 'null', enabled]);

  // CV connection for cutoff (connect CV gain node to parameter)
  useEffect(() => {
    if (!cv?.current || !nodeRef.current || !audioContext) return;
    const cvGain = audioContext.createGain();
    cvGain.gain.value = cvAmount;
    cv.current.gain.connect(cvGain);
    const param = nodeRef.current.parameters.get('cutoff');
    if (param) cvGain.connect(param);

    return () => {
      try { cv.current?.gain.disconnect(cvGain); } catch (e) {}
      try { cvGain.disconnect(); } catch (e) {}
    };
  }, [cv?.current?.audioNode ? String(cv.current.audioNode) : 'null', cvAmount]);

  // Update parameters when props/state changes
  useEffect(() => {
    if (nodeRef.current) nodeRef.current.parameters.get('cutoff')?.setValueAtTime(cutoff, audioContext!.currentTime);
  }, [cutoff]);

  useEffect(() => {
    if (nodeRef.current) nodeRef.current.parameters.get('resonance')?.setValueAtTime(resonance, audioContext!.currentTime);
  }, [resonance]);

  useEffect(() => {
    if (nodeRef.current) nodeRef.current.parameters.get('drive')?.setValueAtTime(drive, audioContext!.currentTime);
  }, [drive]);

  useImperativeHandle(ref, () => ({ getState: () => ({ cutoff, resonance, drive, enabled }) }), [cutoff, resonance, drive, enabled]);

  if (children) {
    return <>{children({ cutoff, setCutoff: setCutoff as any, resonance, setResonance: setResonance as any, drive, setDrive: setDrive as any, enabled, setEnabled: setEnabled as any, isActive: !!output.current })}</>;
  }

  return null;
});

DiodeFilter.displayName = 'DiodeFilter';
