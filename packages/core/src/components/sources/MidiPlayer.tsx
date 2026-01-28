import React, { ReactNode, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Midi } from '@tonejs/midi';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { MidiBus, MidiEvent } from '../../types/Midi';
import { useControlledState } from '../../hooks/useControlledState';
import { getWorkletUrl } from '../../workletUrl';

type MidiMetadata = {
  name: string;
  tracks: number;
  duration: number;
  ticks: number;
  ppq: number;
  tempo: number;
};

const clockDetectorLoaders = new WeakMap<AudioContext, Promise<void>>();
const eventSchedulerLoaders = new WeakMap<AudioContext, Promise<void>>();

const loadEventSchedulerWorklet = (audioContext: AudioContext) => {
  let loader = eventSchedulerLoaders.get(audioContext);
  if (!loader) {
    const url = getWorkletUrl('midi-event-scheduler.js');
    loader = audioContext.audioWorklet.addModule(url).catch((err) => {
      eventSchedulerLoaders.delete(audioContext);
      throw err;
    });
    eventSchedulerLoaders.set(audioContext, loader);
  }
  return loader;
};

const loadClockDetectorWorklet = (audioContext: AudioContext) => {
  let loader = clockDetectorLoaders.get(audioContext);
  if (!loader) {
    const url = getWorkletUrl('midi-clock-detector.js');
    loader = audioContext.audioWorklet.addModule(url).catch((err) => {
      clockDetectorLoaders.delete(audioContext);
      throw err;
    });
    clockDetectorLoaders.set(audioContext, loader);
  }
  return loader;
};

const dataUrlToArrayBuffer = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  return response.arrayBuffer();
};

const createMidiBus = (): MidiBus => {
  const listeners = new Set<(event: MidiEvent) => void>();
  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit: (event) => {
      listeners.forEach((listener) => listener(event));
    },
  };
};

export interface MidiPlayerHandle {
  play: () => void;
  stop: () => void;
  pause: () => void;
  loadMidiFile: (file: File) => void;
}

export interface MidiPlayerRenderProps {
  midiFileName: string;
  setMidiFileName: (name: string) => void;
  midiFileDataUrl: string;
  setMidiFileDataUrl: (dataUrl: string) => void;
  midiUrl: string;
  setMidiUrl: (url: string) => void;
  loadMidiFile: (file: File) => void;
  bpm: number;
  setBpm: (value: number) => void;
  isPlaying: boolean;
  isLoaded: boolean;
  position: number;
  duration: number;
  setPosition: (seconds: number) => void;
  metadata: MidiMetadata | null;
  play: () => void;
  pause: () => void;
  stop: () => void;
  error: string | null;
}

export interface MidiPlayerProps {
  output: ModStreamRef;
  triggerInput?: ModStreamRef;
  stopInput?: ModStreamRef;
  label?: string;
  midiFileName?: string;
  onMidiFileNameChange?: (name: string) => void;
  midiFileDataUrl?: string;
  onMidiFileDataUrlChange?: (dataUrl: string) => void;
  midiUrl?: string;
  onMidiUrlChange?: (url: string) => void;
  bpm?: number;
  onBpmChange?: (value: number) => void;
  children?: (props: MidiPlayerRenderProps) => ReactNode;
}

export const MidiPlayer = React.forwardRef<MidiPlayerHandle, MidiPlayerProps>(({
  output,
  triggerInput,
  stopInput,
  label = 'midi-player',
  midiFileName: controlledMidiFileName,
  onMidiFileNameChange,
  midiFileDataUrl: controlledMidiFileDataUrl,
  onMidiFileDataUrlChange,
  midiUrl: controlledMidiUrl,
  onMidiUrlChange,
  bpm: controlledBpm,
  onBpmChange,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const [midiFileName, setMidiFileName] = useControlledState(
    controlledMidiFileName,
    '',
    onMidiFileNameChange
  );
  const [midiFileDataUrl, setMidiFileDataUrl] = useControlledState(
    controlledMidiFileDataUrl,
    '',
    onMidiFileDataUrlChange
  );
  const [midiUrl, setMidiUrl] = useControlledState(
    controlledMidiUrl,
    '',
    onMidiUrlChange
  );
  const [bpm, setBpm] = useControlledState(controlledBpm, 120, onBpmChange);
  const [baseTempo, setBaseTempo] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [metadata, setMetadata] = useState<MidiMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  const midiEventsRef = useRef<MidiEvent[]>([]);
  const playStartTimeRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  const eventIndexRef = useRef(0);
  const pendingTimeoutsRef = useRef<Set<number>>(new Set());
  const midiBusRef = useRef<MidiBus | null>(null);
  const triggerNodeRef = useRef<AudioWorkletNode | null>(null);
  const stopNodeRef = useRef<AudioWorkletNode | null>(null);
  const eventSchedulerRef = useRef<AudioWorkletNode | null>(null);
  const schedulerGainRef = useRef<GainNode | null>(null);

  positionRef.current = position;

  const scale = useMemo(() => {
    return baseTempo / Math.max(1, bpm);
  }, [baseTempo, bpm]);
  const scaleRef = useRef(scale);

  useEffect(() => {
    scaleRef.current = scale;
    eventSchedulerRef.current?.port.postMessage({
      type: 'scale',
      value: scale,
    });
  }, [scale]);

  const clearPendingTimeouts = () => {
    pendingTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    pendingTimeoutsRef.current.clear();
  };

  const emitEvent = (event: MidiEvent) => {
    if (!midiBusRef.current) return;
    midiBusRef.current.emit(event);
  };

  const emitAllNotesOff = () => {
    emitEvent({ type: 'allNotesOff', time: 0 });
    emitEvent({ type: 'allSoundsOff', time: 0 });
  };

  const startScheduler = () => {
    if (!eventSchedulerRef.current) return;
    eventSchedulerRef.current.port.postMessage({
      type: 'events',
      events: midiEventsRef.current,
    });
    eventSchedulerRef.current.port.postMessage({
      type: 'scale',
      value: scaleRef.current,
    });
  };

  const play = () => {
    if (!audioContext || !isLoaded) return;
    if (audioContext.state !== 'running') {
      audioContext.resume().catch(() => {});
    }
    const start = audioContext.currentTime - positionRef.current;
    playStartTimeRef.current = start;
    const events = midiEventsRef.current;
    const baseTime = positionRef.current / scaleRef.current;
    eventIndexRef.current = events.findIndex((event) => event.time >= baseTime);
    if (eventIndexRef.current < 0) eventIndexRef.current = events.length;
    setIsPlaying(true);
    startScheduler();
    eventSchedulerRef.current?.port.postMessage({
      type: 'play',
      startTime: start,
      position: baseTime,
      scale: scaleRef.current,
    });
  };

  const setTransportPosition = (seconds: number) => {
    const maxDuration = duration * scaleRef.current || 0;
    const next = Math.max(0, Math.min(seconds, maxDuration));
    setPosition(next);
    positionRef.current = next;
    if (!audioContext || !isPlaying || !playStartTimeRef.current) return;
    const now = audioContext.currentTime;
    playStartTimeRef.current = now - next;
    const events = midiEventsRef.current;
    const baseTime = next / scaleRef.current;
    const nextIndex = events.findIndex((event) => event.time >= baseTime);
    eventIndexRef.current = nextIndex < 0 ? events.length : nextIndex;
    eventSchedulerRef.current?.port.postMessage({
      type: 'seek',
      position: baseTime,
    });
  };

  const pause = () => {
    if (!audioContext || !isPlaying || !playStartTimeRef.current) return;
    const now = audioContext.currentTime;
    const newPosition = Math.max(0, now - playStartTimeRef.current);
    playStartTimeRef.current = null;
    setPosition(newPosition);
    setIsPlaying(false);
    clearPendingTimeouts();
    eventSchedulerRef.current?.port.postMessage({ type: 'stop' });
  };

  const stop = () => {
    playStartTimeRef.current = null;
    setPosition(0);
    positionRef.current = 0;
    setIsPlaying(false);
    clearPendingTimeouts();
    emitAllNotesOff();
    eventSchedulerRef.current?.port.postMessage({ type: 'stop' });
  };

  const loadMidiData = (buffer: ArrayBuffer) => {
    try {
      const midi = new Midi(buffer);
      const tempo = midi.header.tempos?.[0]?.bpm || 120;
      setBaseTempo(tempo);
      setBpm(tempo);
      const events: MidiEvent[] = [];
      midi.tracks.forEach((track, trackIndex) => {
        track.notes.forEach((note) => {
          const channel = (track.channel ?? 0) | 0;
          const velocity = Math.max(0, Math.min(127, Math.round((note.velocity ?? 0.8) * 127)));
          const noteOn: MidiEvent = {
            type: 'noteOn',
            time: note.time,
            channel,
            note: note.midi,
            velocity,
          };
          const noteOff: MidiEvent = {
            type: 'noteOff',
            time: note.time + note.duration,
            channel,
            note: note.midi,
            velocity: 0,
          };
          events.push(noteOn, noteOff);
        });
        if (track.instrument?.number !== undefined) {
          const programEvent: MidiEvent = {
            type: 'program',
            time: 0,
            channel: track.channel ?? trackIndex ?? 0,
            program: track.instrument.number,
          };
          events.push(programEvent);
        }
      });
      events.sort((a, b) => a.time - b.time);
      midiEventsRef.current = events;
      setDuration(midi.duration);
      setMetadata({
        name: midi.name || '',
        tracks: midi.tracks.length,
        duration: midi.duration,
        ticks: midi.durationTicks,
        ppq: midi.header.ppq,
        tempo,
      });
      setIsLoaded(true);
      startScheduler();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse MIDI');
    }
  };

  const loadMidiFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        if (dataUrl) {
          setMidiFileName(file.name);
          setMidiFileDataUrl(dataUrl);
          const buffer = await dataUrlToArrayBuffer(dataUrl);
          loadMidiData(buffer);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load MIDI');
      }
    };
    reader.onerror = () => {
      setError('Failed to read MIDI file');
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!audioContext) return;
    if (!midiBusRef.current) {
      midiBusRef.current = createMidiBus();
    }
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0;
    output.current = {
      audioNode: gainNode,
      gain: gainNode,
      context: audioContext,
      metadata: {
        label,
        sourceType: 'midi',
      },
      midi: midiBusRef.current,
    };
    return () => {
      try { gainNode.disconnect(); } catch (e) {}
      output.current = null;
    };
  }, [audioContext, label]);

  useEffect(() => {
    if (!audioContext) return;
    let cancelled = false;
    loadEventSchedulerWorklet(audioContext).then(() => {
      if (cancelled) return;
      const node = new AudioWorkletNode(audioContext, 'midi-event-scheduler', {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      });
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      node.connect(silentGain);
      silentGain.connect(audioContext.destination);
      schedulerGainRef.current = silentGain;
      eventSchedulerRef.current = node;
      if (midiEventsRef.current.length > 0) {
        startScheduler();
        if (isPlaying && playStartTimeRef.current !== null) {
          const baseTime = positionRef.current / scaleRef.current;
          node.port.postMessage({
            type: 'play',
            startTime: playStartTimeRef.current,
            position: baseTime,
            scale: scaleRef.current,
          });
        }
      }
      node.port.onmessage = (event) => {
        if (event.data?.type === 'event') {
          const scheduledTime = typeof event.data.time === 'number' ? event.data.time : audioContext.currentTime;
          const delayMs = Math.max(0, (scheduledTime - audioContext.currentTime) * 1000);
          if (delayMs <= 1) {
            emitEvent(event.data.event as MidiEvent);
          } else {
            const timeoutId = window.setTimeout(() => {
              pendingTimeoutsRef.current.delete(timeoutId);
              emitEvent(event.data.event as MidiEvent);
            }, delayMs);
            pendingTimeoutsRef.current.add(timeoutId);
          }
        } else if (event.data?.type === 'end') {
          setIsPlaying(false);
          emitAllNotesOff();
        }
      };
    }).catch(() => {});
    return () => {
      cancelled = true;
      clearPendingTimeouts();
      if (eventSchedulerRef.current) {
        eventSchedulerRef.current.port.onmessage = null;
        try { eventSchedulerRef.current.disconnect(); } catch (e) {}
        eventSchedulerRef.current = null;
      }
      if (schedulerGainRef.current) {
        try { schedulerGainRef.current.disconnect(); } catch (e) {}
        schedulerGainRef.current = null;
      }
    };
  }, [audioContext]);

  const triggerKey = triggerInput?.current?.audioNode ? String(triggerInput.current.audioNode) : 'null';
  useEffect(() => {
    if (!audioContext || !triggerInput?.current) return;
    let cancelled = false;
    loadClockDetectorWorklet(audioContext).then(() => {
      if (cancelled) return;
      const node = new AudioWorkletNode(audioContext, 'midi-clock-detector', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        channelCount: 1,
      });
      triggerNodeRef.current = node;
      node.port.onmessage = (event) => {
        if (event.data?.type !== 'pulse') return;
        if (!isLoaded) return;
        stop();
        play();
      };
      const inGain = triggerInput.current?.gain;
      if (inGain) {
        inGain.connect(node);
      }
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (triggerNodeRef.current) {
        triggerNodeRef.current.port.onmessage = null;
        try { triggerNodeRef.current.disconnect(); } catch (e) {}
        triggerNodeRef.current = null;
      }
    };
  }, [audioContext, triggerKey, isLoaded]);

  const stopKey = stopInput?.current?.audioNode ? String(stopInput.current.audioNode) : 'null';
  useEffect(() => {
    if (!audioContext || !stopInput?.current) return;
    let cancelled = false;
    loadClockDetectorWorklet(audioContext).then(() => {
      if (cancelled) return;
      const node = new AudioWorkletNode(audioContext, 'midi-clock-detector', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        channelCount: 1,
      });
      stopNodeRef.current = node;
      node.port.onmessage = (event) => {
        if (event.data?.type !== 'pulse') return;
        emitAllNotesOff();
        stop();
      };
      const inGain = stopInput.current?.gain;
      if (inGain) {
        inGain.connect(node);
      }
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (stopNodeRef.current) {
        stopNodeRef.current.port.onmessage = null;
        try { stopNodeRef.current.disconnect(); } catch (e) {}
        stopNodeRef.current = null;
      }
    };
  }, [audioContext, stopKey]);

  useEffect(() => {
    setIsLoaded(false);
    setMetadata(null);
    setDuration(0);
    midiEventsRef.current = [];
    if (!midiFileDataUrl) return;
    const load = async () => {
      try {
        setError(null);
        const buffer = await dataUrlToArrayBuffer(midiFileDataUrl);
        loadMidiData(buffer);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load MIDI');
      }
    };
    load();
  }, [midiFileDataUrl]);

  useEffect(() => {
    setIsLoaded(false);
    setMetadata(null);
    setDuration(0);
    midiEventsRef.current = [];
    if (!midiUrl || midiFileDataUrl) return;
    const load = async () => {
      try {
        setError(null);
        const response = await fetch(midiUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch MIDI');
        }
        const buffer = await response.arrayBuffer();
        loadMidiData(buffer);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load MIDI');
      }
    };
    load();
  }, [midiUrl, midiFileDataUrl]);

  useEffect(() => {
    if (!isPlaying || !audioContext || !playStartTimeRef.current) return;
    const id = window.setInterval(() => {
      const now = audioContext.currentTime;
      const newPosition = Math.max(0, now - playStartTimeRef.current!);
      setPosition(newPosition);
    }, 100);
    return () => window.clearInterval(id);
  }, [isPlaying, audioContext, scale]);

  useEffect(() => {
    const prevScale = scaleRef.current;
    if (prevScale === scale) return;
    if (!isPlaying || !audioContext) return;
    const now = audioContext.currentTime;
    const baseTime = positionRef.current / prevScale;
    playStartTimeRef.current = now - positionRef.current;
    const events = midiEventsRef.current;
    const nextIndex = events.findIndex((event) => event.time >= baseTime);
    eventIndexRef.current = nextIndex < 0 ? events.length : nextIndex;
    eventSchedulerRef.current?.port.postMessage({
      type: 'events',
      events: midiEventsRef.current,
    });
    eventSchedulerRef.current?.port.postMessage({
      type: 'scale',
      value: scale,
    });
    eventSchedulerRef.current?.port.postMessage({
      type: 'play',
      startTime: playStartTimeRef.current,
      position: baseTime,
      scale: scale,
    });
  }, [scale, isPlaying, audioContext]);

  useImperativeHandle(ref, () => ({
    play,
    stop,
    pause,
    loadMidiFile,
  }), [play, stop, pause]);

  if (children) {
    return (
      <>
        {children({
          midiFileName,
          setMidiFileName,
          midiFileDataUrl,
          setMidiFileDataUrl,
          midiUrl,
          setMidiUrl,
          loadMidiFile,
          bpm,
          setBpm,
          isPlaying,
          isLoaded,
          position,
          duration: duration * scale,
          setPosition: setTransportPosition,
          metadata,
          play,
          pause,
          stop,
          error,
        })}
      </>
    );
  }

  return null;
});

MidiPlayer.displayName = 'MidiPlayer';
