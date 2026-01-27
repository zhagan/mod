import { MutableRefObject } from 'react';
import { MidiBus } from './Midi';

export interface ModStream {
  audioNode: AudioNode;
  gain: GainNode;
  context: AudioContext;
  midi?: MidiBus;
  metadata: {
    label?: string;
    sourceType?: 'microphone' | 'mp3' | 'stream' | 'tone' | 'processor' | 'mixer' | 'cv' | 'midi';
  };
}

export type ModStreamRef = MutableRefObject<ModStream | null>;
