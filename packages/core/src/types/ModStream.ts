import { MutableRefObject } from 'react';

export interface ModStream {
  audioNode: AudioNode;
  gain: GainNode;
  context: AudioContext;
  metadata: {
    label?: string;
    sourceType?: 'microphone' | 'mp3' | 'stream' | 'tone' | 'processor' | 'mixer' | 'cv' | 'midi';
  };
}

export type ModStreamRef = MutableRefObject<ModStream | null>;
