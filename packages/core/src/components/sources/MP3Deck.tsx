import React, { useEffect, useState, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

const MP3_DECK_WORKLETS = `
class GateDetector extends AudioWorkletProcessor {
  constructor() {
    super();
    this._isHigh = false;
  }
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel) return true;
    let isHigh = this._isHigh;
    for (let i = 0; i < channel.length; i++) {
      const value = channel[i];
      if (!isHigh && value > 0.5) {
        this.port.postMessage({ type: 'gate-on' });
        isHigh = true;
      } else if (isHigh && value < 0.2) {
        this.port.postMessage({ type: 'gate-off' });
        isHigh = false;
      }
    }
    this._isHigh = isHigh;
    return true;
  }
}

class CvFollower extends AudioWorkletProcessor {
  constructor() {
    super();
    this._counter = 0;
    this._sum = 0;
  }
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel) return true;
    for (let i = 0; i < channel.length; i++) {
      this._sum += channel[i];
      this._counter += 1;
      if (this._counter >= 256) {
        const avg = this._sum / this._counter;
        this.port.postMessage({ type: 'cv', value: avg });
        this._sum = 0;
        this._counter = 0;
      }
    }
    return true;
  }
}

registerProcessor('mp3-gate-detector', GateDetector);
registerProcessor('mp3-cv-follower', CvFollower);
`;

const mp3DeckWorkletLoaders = new WeakMap<AudioContext, Promise<void>>();
const mp3DeckWorkletUrls = new WeakMap<AudioContext, string>();

const loadMp3DeckWorklets = (audioContext: AudioContext) => {
  let loader = mp3DeckWorkletLoaders.get(audioContext);
  if (!loader) {
    const blob = new Blob([MP3_DECK_WORKLETS], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    mp3DeckWorkletUrls.set(audioContext, url);
    loader = audioContext.audioWorklet.addModule(url).then(() => {
      const loadedUrl = mp3DeckWorkletUrls.get(audioContext);
      if (loadedUrl) {
        URL.revokeObjectURL(loadedUrl);
        mp3DeckWorkletUrls.delete(audioContext);
      }
    }).catch((err) => {
      const loadedUrl = mp3DeckWorkletUrls.get(audioContext);
      if (loadedUrl) {
        URL.revokeObjectURL(loadedUrl);
        mp3DeckWorkletUrls.delete(audioContext);
      }
      mp3DeckWorkletLoaders.delete(audioContext);
      throw err;
    });
    mp3DeckWorkletLoaders.set(audioContext, loader);
  }
  return loader;
};

export interface MP3DeckHandle {
  play: () => void;
  pause: () => void;
  stop: () => void;
  trigger: () => void;
  seek: (time: number) => void;
  loadFile: (file: File) => void;
  getState: () => {
    src: string;
    fileName: string;
    fileDataUrl: string;
    gain: number;
    playbackMode: PlaybackMode;
    startTime: number;
    endTime: number;
    pitch: number;
    isPlaying: boolean;
    isReady: boolean;
    currentTime: number;
    duration: number;
    error: string | null;
  };
}

export type PlaybackMode = 'one-shot' | 'gate' | 'loop';

export interface MP3DeckRenderProps {
  src: string;
  setSrc: (src: string) => void;
  fileName: string;
  setFileName: (name: string) => void;
  fileDataUrl: string;
  setFileDataUrl: (dataUrl: string) => void;
  loadFile: (file: File) => void;
  gain: number;
  setGain: (value: number) => void;
  playbackMode: PlaybackMode;
  setPlaybackMode: (value: PlaybackMode) => void;
  startTime: number;
  setStartTime: (value: number) => void;
  endTime: number;
  setEndTime: (value: number) => void;
  pitch: number;
  setPitch: (value: number) => void;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  stop: () => void;
  trigger: () => void;
  currentTime: number;
  duration: number;
  sampleRate: number;
  seek: (time: number) => void;
  isActive: boolean;
  isReady: boolean;
  error: string | null;
}

export interface MP3DeckProps {
  output: ModStreamRef;
  trigger?: ModStreamRef;
  pitchCv?: ModStreamRef;
  label?: string;
  // Controlled props
  src?: string;
  onSrcChange?: (src: string) => void;
  fileName?: string;
  onFileNameChange?: (name: string) => void;
  fileDataUrl?: string;
  onFileDataUrlChange?: (dataUrl: string) => void;
  gain?: number;
  onGainChange?: (gain: number) => void;
  loop?: boolean;
  onLoopChange?: (loop: boolean) => void;
  playbackMode?: PlaybackMode;
  onPlaybackModeChange?: (mode: PlaybackMode) => void;
  startTime?: number;
  onStartTimeChange?: (time: number) => void;
  endTime?: number;
  onEndTimeChange?: (time: number) => void;
  pitch?: number;
  onPitchChange?: (pitch: number) => void;
  // Event callbacks
  onPlayingChange?: (isPlaying: boolean) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onError?: (error: string | null) => void;
  onEnd?: () => void;
  // Render props
  children?: (props: MP3DeckRenderProps) => ReactNode;
}

export const MP3Deck = React.forwardRef<MP3DeckHandle, MP3DeckProps>(({
  output,
  trigger: triggerInput,
  pitchCv,
  label = 'mp3-deck',
  src: controlledSrc,
  onSrcChange,
  fileName: controlledFileName,
  onFileNameChange,
  fileDataUrl: controlledFileDataUrl,
  onFileDataUrlChange,
  gain: controlledGain,
  onGainChange,
  loop: controlledLoop,
  onLoopChange,
  playbackMode: controlledPlaybackMode,
  onPlaybackModeChange,
  startTime: controlledStartTime,
  onStartTimeChange,
  endTime: controlledEndTime,
  onEndTimeChange,
  pitch: controlledPitch,
  onPitchChange,
  onPlayingChange,
  onTimeUpdate,
  onError,
  onEnd,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const [src, setSrc] = useControlledState(controlledSrc, '', onSrcChange);
  const [fileName, setFileName] = useControlledState(controlledFileName, '', onFileNameChange);
  const [fileDataUrl, setFileDataUrl] = useControlledState(controlledFileDataUrl, '', onFileDataUrlChange);
  const [gain, setGain] = useControlledState(controlledGain, 1.0, onGainChange);
  const [loop] = useControlledState(controlledLoop, false, onLoopChange);
  const [playbackMode, setPlaybackMode] = useControlledState<PlaybackMode>(
    controlledPlaybackMode,
    loop ? 'loop' : 'one-shot',
    onPlaybackModeChange
  );
  const [startTime, setStartTime] = useControlledState(controlledStartTime, 0, onStartTimeChange);
  const [endTime, setEndTime] = useControlledState(controlledEndTime, 0, onEndTimeChange);
  const [pitch, setPitch] = useControlledState(controlledPitch, 0.0, onPitchChange);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isWorkletReady, setIsWorkletReady] = useState(false);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const pitchCvNodeRef = useRef<AudioWorkletNode | null>(null);
  const triggerNodeRef = useRef<AudioWorkletNode | null>(null);
  const pitchCvValueRef = useRef(0);
  const gateStateRef = useRef(false);
  const pitchRef = useRef(pitch);
  const playbackModeRef = useRef<PlaybackMode>(playbackMode);
  const startTimeRef = useRef(startTime);
  const endTimeRef = useRef(endTime);
  const pendingAutoplayRef = useRef(false);
  const unlockListenerRef = useRef<(() => void) | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);
  const playRetryRef = useRef<number | null>(null);

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  const FADE_IN_TIME = 0.001;
  const FADE_OUT_TIME = 0.045;

  const fadeGainTo = (target: number, fadeTime: number) => {
    if (!audioContext || !gainNodeRef.current) return;
    const now = audioContext.currentTime;
    const param = gainNodeRef.current.gain;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.setTargetAtTime(target, now, Math.max(0.001, fadeTime / 3));
  };

  const fadeIn = () => {
    if (!audioContext || !gainNodeRef.current) return;
    const now = audioContext.currentTime;
    const param = gainNodeRef.current.gain;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.setTargetAtTime(gain, now, Math.max(0.001, FADE_IN_TIME / 3));
  };

  const pauseWithFade = (resetToStart: boolean) => {
    if (!audioElementRef.current) return;
    if (!audioContext || !gainNodeRef.current) {
      audioElementRef.current.pause();
      if (resetToStart) seekToStart();
      return;
    }
    if (stopTimeoutRef.current !== null) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    fadeGainTo(0, FADE_OUT_TIME);
    stopTimeoutRef.current = window.setTimeout(() => {
      if (!audioElementRef.current) return;
      audioElementRef.current.pause();
      if (resetToStart) seekToStart();
      if (gainNodeRef.current && audioContext) {
        const now = audioContext.currentTime;
        gainNodeRef.current.gain.cancelScheduledValues(now);
        gainNodeRef.current.gain.setValueAtTime(gain, now);
      }
      stopTimeoutRef.current = null;
    }, FADE_OUT_TIME * 1000);
  };

  const ensureUserGesturePlayback = () => {
    if (unlockListenerRef.current) return;
    const onUnlock = async () => {
      unlockListenerRef.current = null;
      window.removeEventListener('pointerdown', onUnlock);
      window.removeEventListener('keydown', onUnlock);
      if (!pendingAutoplayRef.current) return;
      pendingAutoplayRef.current = false;
      if (!audioContext) return;
      try {
        await audioContext.resume();
      } catch {
        return;
      }
      const mode = playbackModeRef.current;
      if ((mode === 'gate' || mode === 'loop') && !gateStateRef.current) return;
      triggerPlayback();
    };
    unlockListenerRef.current = onUnlock;
    window.addEventListener('pointerdown', onUnlock);
    window.addEventListener('keydown', onUnlock);
  };

  const handleAutoplayBlocked = () => {
    pendingAutoplayRef.current = true;
    setError(null);
    ensureUserGesturePlayback();
  };

  const isAutoplayError = (err: any) => {
    if (pendingAutoplayRef.current) return true;
    if (audioContext && audioContext.state !== 'running') return true;
    if (err?.name === 'NotAllowedError') return true;
    const message = typeof err?.message === 'string' ? err.message.toLowerCase() : '';
    return message.includes('user interaction') || message.includes('gesture') || message.includes('notallowed');
  };

  const isAbortPlayError = (err: any) => err?.name === 'AbortError';

  const getEffectiveStart = () => {
    if (!duration) return 0;
    return clamp(startTimeRef.current, 0, duration);
  };

  const getEffectiveEnd = () => {
    if (!duration) return 0;
    const end = endTimeRef.current > 0 ? endTimeRef.current : duration;
    return clamp(end, 0, duration);
  };

  const updatePlaybackRate = () => {
    if (!audioElementRef.current) return;
    const cvValue = Number.isFinite(pitchCvValueRef.current) ? pitchCvValueRef.current : 0;
    const semitones = clamp(cvValue, -24, 24);
    const baseOctaves = Number.isFinite(pitchRef.current) ? pitchRef.current : 0;
    const targetRate = Math.pow(2, baseOctaves + semitones / 12);
    const rate = clamp(targetRate, 0.25, 4);
    const element = audioElementRef.current;
    try {
      element.playbackRate = rate;
      element.defaultPlaybackRate = rate;
    } catch (err) {
      // Ignore unsupported rate errors and keep the last valid rate.
      const errorName = (err as Error | null)?.name;
      if (errorName !== 'NotSupportedError') {
        throw err;
      }
    }
    if ('preservesPitch' in element) {
      element.preservesPitch = false;
    }
    if ('mozPreservesPitch' in element) {
      (element as any).mozPreservesPitch = false;
    }
    if ('webkitPreservesPitch' in element) {
      (element as any).webkitPreservesPitch = false;
    }
  };

  const seekToStart = () => {
    if (!audioElementRef.current) return;
    audioElementRef.current.currentTime = getEffectiveStart();
  };

  const stopAtStart = () => {
    if (!audioElementRef.current) return;
    pauseWithFade(true);
  };

  const triggerPlayback = async () => {
    if (!audioElementRef.current) return;
    if (stopTimeoutRef.current !== null) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    if (audioContext && audioContext.state !== 'running') {
      handleAutoplayBlocked();
      return;
    }
    seekToStart();
    await play();
  };

  useEffect(() => {
    playbackModeRef.current = playbackMode;
  }, [playbackMode]);

  useEffect(() => {
    pitchRef.current = pitch;
    updatePlaybackRate();
  }, [pitch]);

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  useEffect(() => {
    endTimeRef.current = endTime;
  }, [endTime]);

  // Create output gain once (stable connection for Monitor)
  useEffect(() => {
    if (!audioContext) return;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = gain;
    gainNodeRef.current = gainNode;

    // Set output ref with stable gain node
    output.current = {
      audioNode: gainNode,
      gain: gainNode,
      context: audioContext,
      metadata: {
        label,
        sourceType: 'mp3',
      },
    };

    return () => {
      gainNode.disconnect();
      output.current = null;
      gainNodeRef.current = null;
    };
  }, [audioContext, label]);

  // Handle source changes separately
  useEffect(() => {
    if (!audioContext || !src || !gainNodeRef.current) return;

    let audioElement: HTMLAudioElement | null = null;
    let sourceNode: MediaElementAudioSourceNode | null = null;
    const currentSrc = src; // Capture current src for cleanup

    const setupAudio = async () => {
      try {
        // Clean up previous source if it exists
        if (sourceNodeRef.current) {
          try {
            sourceNodeRef.current.disconnect();
          } catch (e) {
            // Already disconnected
          }
          sourceNodeRef.current = null;
        }

        // Stop and clean up previous audio element
        if (audioElementRef.current) {
          const oldElement = audioElementRef.current;
          oldElement.pause();
          // Safe cleanup - removeAttribute may not exist in test environments
          if (typeof oldElement.removeAttribute === 'function') {
            oldElement.removeAttribute('src');
          } else {
            oldElement.src = '';
          }
          oldElement.load();
          audioElementRef.current = null;
        }

        // Reset state when loading new audio
        setIsReady(false);
        setIsPlaying(false);
        setError(null);
        setCurrentTime(0);
        setDuration(0);

        // Create fresh audio element
        audioElement = new Audio();
        if ('preservesPitch' in audioElement) {
          audioElement.preservesPitch = false;
        }
        if ('mozPreservesPitch' in audioElement) {
          (audioElement as any).mozPreservesPitch = false;
        }
        if ('webkitPreservesPitch' in audioElement) {
          (audioElement as any).webkitPreservesPitch = false;
        }
        audioElement.loop = false;
        // Only set crossOrigin for remote URLs, not blob URLs
        if (!src.startsWith('blob:')) {
          audioElement.crossOrigin = 'anonymous';
        }
        audioElement.preload = 'auto';
        audioElement.src = src;
        audioElementRef.current = audioElement;
        updatePlaybackRate();

        // Create source from audio element
        sourceNode = audioContext.createMediaElementSource(audioElement);
        sourceNodeRef.current = sourceNode;

        // Connect source to existing stable gain node
        sourceNode.connect(gainNodeRef.current!);

        // Set up event listeners
        audioElement.addEventListener('loadedmetadata', () => {
          setDuration(audioElement!.duration);
        });

        audioElement.addEventListener('canplaythrough', () => {
          // Audio is fully loaded and ready to play
          setIsReady(true);
        });

        audioElement.addEventListener('timeupdate', () => {
          const current = audioElement!.currentTime;
          const regionStart = getEffectiveStart();
          const regionEnd = getEffectiveEnd();
          if (regionEnd > 0 && current >= regionEnd) {
            if (playbackModeRef.current === 'loop') {
              audioElement!.currentTime = regionStart;
              if (!audioElement!.paused) {
                audioElement!.play().catch((err) => {
                  if (isAutoplayError(err)) {
                    handleAutoplayBlocked();
                    return;
                  }
                  if (isAbortPlayError(err)) {
                    return;
                  }
                  setError('Playback failed. User interaction may be required.');
                });
              }
            } else {
              audioElement!.pause();
              audioElement!.currentTime = regionStart;
              setIsPlaying(false);
              onEnd?.();
            }
          } else if (current < regionStart) {
            audioElement!.currentTime = regionStart;
          }
          setCurrentTime(audioElement!.currentTime);
        });

        audioElement.addEventListener('play', () => setIsPlaying(true));
        audioElement.addEventListener('pause', () => setIsPlaying(false));
        audioElement.addEventListener('ended', () => {
          setIsPlaying(false);
          onEnd?.();
        });

        audioElement.addEventListener('error', () => {
          setError('Failed to load audio file');
          setIsReady(false);
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audio');
        setIsReady(false);
      }
    };

    setupAudio();

    // Cleanup
    return () => {
      if (audioElement) {
        audioElement.pause();
        // Safe cleanup - removeAttribute may not exist in test environments
        if (typeof audioElement.removeAttribute === 'function') {
          audioElement.removeAttribute('src');
        } else {
          audioElement.src = '';
        }
        audioElement.load();
      }
      if (sourceNode) {
        sourceNode.disconnect();
      }
      // Only revoke blob URL if it matches the one we were using
      if (blobUrlRef.current === currentSrc && currentSrc.startsWith('blob:')) {
        URL.revokeObjectURL(currentSrc);
        blobUrlRef.current = null;
      }
    };
  }, [audioContext, src]);

  // Sync playback mode when legacy loop prop changes
  useEffect(() => {
    if (controlledPlaybackMode !== undefined) return;
    setPlaybackMode(loop ? 'loop' : 'one-shot');
  }, [loop, controlledPlaybackMode, setPlaybackMode]);

  // If a persisted data URL is provided, prefer it for playback
  useEffect(() => {
    if (!fileDataUrl) return;
    if (!src || src.startsWith('blob:')) {
      setSrc(fileDataUrl);
    }
  }, [fileDataUrl, src, setSrc]);

  // Update gain when it changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = gain;
    }
  }, [gain]);

  // Update playback rate when pitch or CV changes
  // Clamp playback position to region when start/end changes
  useEffect(() => {
    if (!audioElementRef.current || !duration) return;
    const start = getEffectiveStart();
    const end = getEffectiveEnd();
    if (end > 0 && end < start) return;
    if (audioElementRef.current.currentTime < start || (end > 0 && audioElementRef.current.currentTime > end)) {
      audioElementRef.current.currentTime = start;
    }
  }, [startTime, endTime, duration]);

  // Load file from File object
  const loadFile = (file: File) => {
    // Revoke previous blob URL to prevent memory leak
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) {
        setFileName(file.name);
        setFileDataUrl(result);
        setSrc(result);
      }
    };
    reader.onerror = () => {
      const url = URL.createObjectURL(file);
      blobUrlRef.current = url;
      setFileName(file.name);
      setSrc(url);
    };
    reader.readAsDataURL(file);
  };

  // Auto-pause when output becomes disconnected
  useEffect(() => {
    // Check if output is connected by seeing if gain node has any connections
    const checkConnection = () => {
      if (!output.current && isPlaying) {
        // Output was disconnected while playing - pause
        pause();
      }
    };

    // Check periodically (this is a fallback, ideally parent would handle this)
    const interval = setInterval(checkConnection, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Cleanup any pending unlock listeners
  useEffect(() => {
    return () => {
      if (unlockListenerRef.current) {
        window.removeEventListener('pointerdown', unlockListenerRef.current);
        window.removeEventListener('keydown', unlockListenerRef.current);
        unlockListenerRef.current = null;
      }
    };
  }, []);

  // Tighter loop watcher for short regions (timeupdate is too coarse for tiny loops).
  useEffect(() => {
    if (!isPlaying || playbackModeRef.current !== 'loop') return;
    const interval = setInterval(() => {
      const element = audioElementRef.current;
      if (!element) return;
      const regionStart = getEffectiveStart();
      const regionEnd = getEffectiveEnd();
      if (regionEnd > 0 && element.currentTime >= regionEnd) {
        element.currentTime = regionStart;
        if (!element.paused) {
          element.play().catch((err) => {
            if (isAutoplayError(err)) {
              handleAutoplayBlocked();
              return;
            }
            if (isAbortPlayError(err)) {
              return;
            }
            setError('Playback failed. User interaction may be required.');
          });
        }
      }
    }, 10);
    return () => clearInterval(interval);
  }, [isPlaying, playbackMode, startTime, endTime, duration]);

  // Set up CV/trigger worklets
  useEffect(() => {
    if (!audioContext) return;
    let cancelled = false;

    loadMp3DeckWorklets(audioContext).then(() => {
      if (cancelled) return;

      if (!triggerNodeRef.current) {
        const triggerNode = new AudioWorkletNode(audioContext, 'mp3-gate-detector', {
          numberOfInputs: 1,
          numberOfOutputs: 0,
          channelCount: 1,
        });
        triggerNode.port.onmessage = (event) => {
          const mode = playbackModeRef.current;
          if (event.data?.type === 'gate-on') {
            gateStateRef.current = true;
            if (mode === 'gate' || mode === 'loop' || mode === 'one-shot') {
              triggerPlayback();
            }
          }
          if (event.data?.type === 'gate-off') {
            gateStateRef.current = false;
            if (mode === 'gate' || mode === 'loop') {
              stopAtStart();
            }
          }
        };
        triggerNodeRef.current = triggerNode;
      }

      if (!pitchCvNodeRef.current) {
        const pitchNode = new AudioWorkletNode(audioContext, 'mp3-cv-follower', {
          numberOfInputs: 1,
          numberOfOutputs: 0,
          channelCount: 1,
        });
        pitchNode.port.onmessage = (event) => {
          if (event.data?.type !== 'cv') return;
          pitchCvValueRef.current = event.data.value;
          updatePlaybackRate();
        };
        pitchCvNodeRef.current = pitchNode;
      }
      setIsWorkletReady(true);
    }).catch((err) => {
      if (cancelled) return;
      console.error('Failed to load MP3Deck worklets', err);
    });

    return () => {
      cancelled = true;
      if (triggerNodeRef.current) {
        triggerNodeRef.current.port.onmessage = null;
        try { triggerNodeRef.current.disconnect(); } catch (e) {}
        triggerNodeRef.current = null;
      }
      if (pitchCvNodeRef.current) {
        pitchCvNodeRef.current.port.onmessage = null;
        try { pitchCvNodeRef.current.disconnect(); } catch (e) {}
        pitchCvNodeRef.current = null;
      }
      setIsWorkletReady(false);
    };
  }, [audioContext]);

  const triggerKey = triggerInput?.current?.audioNode ? String(triggerInput.current.audioNode) : 'null';
  useEffect(() => {
    if (!triggerInput?.current || !triggerNodeRef.current || !isWorkletReady) return;
    const inGain = triggerInput.current.gain;
    const listener = triggerNodeRef.current;
    inGain.connect(listener);
    return () => {
      try { inGain.disconnect(listener); } catch (e) {}
    };
  }, [triggerKey, isWorkletReady]);

  const pitchCvKey = pitchCv?.current?.audioNode ? String(pitchCv.current.audioNode) : 'null';
  useEffect(() => {
    if (!pitchCv?.current || !pitchCvNodeRef.current || !isWorkletReady) return;
    const inGain = pitchCv.current.gain;
    const listener = pitchCvNodeRef.current;
    inGain.connect(listener);
    return () => {
      try { inGain.disconnect(listener); } catch (e) {}
      pitchCvValueRef.current = 0;
      updatePlaybackRate();
    };
  }, [pitchCvKey, isWorkletReady]);

  // Playback controls
  const play = async () => {
    if (audioElementRef.current && audioContext) {
      if (stopTimeoutRef.current !== null) {
        clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }
      fadeIn();
      // Resume audio context if suspended
      if (audioContext.state !== 'running') {
        try {
          await audioContext.resume();
        } catch {
          handleAutoplayBlocked();
          return;
        }
      }
      const isRunning = audioContext.state === 'running';
      if (!isRunning) {
        handleAutoplayBlocked();
        return;
      }
      if (audioElementRef.current.currentTime < getEffectiveStart()) {
        seekToStart();
      }
      audioElementRef.current.play().catch((err) => {
        if (isAutoplayError(err)) {
          handleAutoplayBlocked();
          return;
        }
        if (isAbortPlayError(err)) {
          if (playRetryRef.current !== null) {
            return;
          }
          playRetryRef.current = window.setTimeout(() => {
            playRetryRef.current = null;
            audioElementRef.current?.play().catch((retryErr) => {
              if (isAutoplayError(retryErr)) {
                handleAutoplayBlocked();
                return;
              }
              if (isAbortPlayError(retryErr)) {
                return;
              }
              setError('Playback failed. User interaction may be required.');
            });
          }, 0);
          return;
        }
        setError('Playback failed. User interaction may be required.');
      });
    }
  };

  const pause = () => {
    pauseWithFade(false);
  };

  const stop = () => {
    pauseWithFade(true);
  };

  const seek = (time: number) => {
    if (audioElementRef.current) {
      const start = getEffectiveStart();
      const end = getEffectiveEnd();
      const bounded = end > 0 ? clamp(time, start, end) : Math.max(start, time);
      audioElementRef.current.currentTime = bounded;
    }
  };

  const triggerPlaybackCommand = async () => {
    if (playbackMode === 'gate') {
      gateStateRef.current = true;
    }
    await triggerPlayback();
  };

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    play,
    pause,
    stop,
    trigger: triggerPlaybackCommand,
    seek,
    loadFile,
    getState: () => ({
      src,
      fileName,
      fileDataUrl,
      gain,
      playbackMode,
      startTime,
      endTime,
      pitch,
      isPlaying,
      isReady,
      currentTime,
      duration,
      error
    }),
  }), [src, fileName, fileDataUrl, gain, playbackMode, startTime, endTime, pitch, isPlaying, isReady, currentTime, duration, error]);

  // Event callback effects
  useEffect(() => {
    onPlayingChange?.(isPlaying);
  }, [isPlaying, onPlayingChange]);

  useEffect(() => {
    onTimeUpdate?.(currentTime, duration);
  }, [currentTime, duration, onTimeUpdate]);

  useEffect(() => {
    onError?.(error);
  }, [error, onError]);

  if (error) {
    console.warn(`MP3Deck error: ${error}`);
  }

  // Render children with state
  if (children) {
    return <>{children({
      src,
      setSrc,
      fileName,
      setFileName,
      fileDataUrl,
      setFileDataUrl,
      loadFile,
      gain,
      setGain,
      playbackMode,
      setPlaybackMode,
      startTime,
      setStartTime,
      endTime,
      setEndTime,
      pitch,
      setPitch,
      isPlaying,
      play,
      pause,
      stop,
      trigger: triggerPlaybackCommand,
      currentTime,
      duration,
      sampleRate: audioContext?.sampleRate ?? 44100,
      seek,
      isActive: !!output.current,
      isReady,
      error,
    })}</>;
  }

  return null;
});

MP3Deck.displayName = 'MP3Deck';
