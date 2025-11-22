import React, { useEffect, useState, useRef, ReactNode, useImperativeHandle } from 'react';
import { useAudioContext } from '../../context/AudioContext';
import { ModStreamRef } from '../../types/ModStream';
import { useControlledState } from '../../hooks/useControlledState';

export interface MP3DeckHandle {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  loadFile: (file: File) => void;
  getState: () => {
    src: string;
    gain: number;
    loop: boolean;
    isPlaying: boolean;
    isReady: boolean;
    currentTime: number;
    duration: number;
    error: string | null;
  };
}

export interface MP3DeckRenderProps {
  src: string;
  setSrc: (src: string) => void;
  loadFile: (file: File) => void;
  gain: number;
  setGain: (value: number) => void;
  loop: boolean;
  setLoop: (value: boolean) => void;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  stop: () => void;
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
  isActive: boolean;
  isReady: boolean;
  error: string | null;
}

export interface MP3DeckProps {
  output: ModStreamRef;
  label?: string;
  // Controlled props
  src?: string;
  onSrcChange?: (src: string) => void;
  gain?: number;
  onGainChange?: (gain: number) => void;
  loop?: boolean;
  onLoopChange?: (loop: boolean) => void;
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
  label = 'mp3-deck',
  src: controlledSrc,
  onSrcChange,
  gain: controlledGain,
  onGainChange,
  loop: controlledLoop,
  onLoopChange,
  onPlayingChange,
  onTimeUpdate,
  onError,
  onEnd,
  children,
}, ref) => {
  const audioContext = useAudioContext();
  const [src, setSrc] = useControlledState(controlledSrc, '', onSrcChange);
  const [gain, setGain] = useControlledState(controlledGain, 1.0, onGainChange);
  const [loop, setLoop] = useControlledState(controlledLoop, false, onLoopChange);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const blobUrlRef = useRef<string | null>(null);

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
        audioElement.loop = loop;
        // Only set crossOrigin for remote URLs, not blob URLs
        if (!src.startsWith('blob:')) {
          audioElement.crossOrigin = 'anonymous';
        }
        audioElement.preload = 'auto';
        audioElement.src = src;
        audioElementRef.current = audioElement;

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

  // Update loop when it changes
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.loop = loop;
    }
  }, [loop]);

  // Update gain when it changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = gain;
    }
  }, [gain]);

  // Load file from File object
  const loadFile = (file: File) => {
    // Revoke previous blob URL to prevent memory leak
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    blobUrlRef.current = url;
    setSrc(url);
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

  // Playback controls
  const play = async () => {
    if (audioElementRef.current && audioContext) {
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      audioElementRef.current.play().catch(() => {
        setError('Playback failed. User interaction may be required.');
      });
    }
  };

  const pause = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  };

  const stop = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
  };

  const seek = (time: number) => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = time;
    }
  };

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    play,
    pause,
    stop,
    seek,
    loadFile,
    getState: () => ({ src, gain, loop, isPlaying, isReady, currentTime, duration, error }),
  }), [src, gain, loop, isPlaying, isReady, currentTime, duration, error]);

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
      loadFile,
      gain,
      setGain,
      loop,
      setLoop,
      isPlaying,
      play,
      pause,
      stop,
      currentTime,
      duration,
      seek,
      isActive: !!output.current,
      isReady,
      error,
    })}</>;
  }

  return null;
});

MP3Deck.displayName = 'MP3Deck';
