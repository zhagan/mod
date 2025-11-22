/**
 * Integration test: MP3Deck track queueing pattern
 *
 * Tests the correct pattern for implementing a track queue with MP3Deck
 */

import React, { useState, useRef } from 'react';
import { render, waitFor, act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioProvider } from '../../context/AudioContext';
import { MP3Deck } from '../../components/sources/MP3Deck';
import { useModStream } from '../../hooks/useModStream';

// Mock Web Audio API
const mockAudioContext = {
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: {
      value: 1,
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
      setTargetAtTime: jest.fn(),
      cancelScheduledValues: jest.fn(),
    },
  })),
  createMediaElementSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  destination: {},
  currentTime: 0,
  sampleRate: 44100,
  state: 'running',
  close: jest.fn(() => Promise.resolve()),
};

(global as any).AudioContext = jest.fn(() => mockAudioContext);

// Mock Audio element
class MockAudio {
  src = '';
  currentTime = 0;
  duration = 100;
  paused = true;
  loop = false;
  volume = 1;
  playbackRate = 1;

  private listeners: { [key: string]: Function[] } = {};

  addEventListener(event: string, handler: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }

  removeEventListener(event: string, handler: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(h => h !== handler);
    }
  }

  play() {
    this.paused = false;
    this.trigger('play');
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    this.trigger('pause');
  }

  load() {
    this.trigger('loadedmetadata');
    this.trigger('canplay');
  }

  trigger(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(handler => handler(data));
    }
  }

  // Simulate track ending
  simulateEnd() {
    this.currentTime = this.duration;
    this.paused = true;
    this.trigger('ended');
  }
}

// Mock URL.createObjectURL and revokeObjectURL
const mockBlobUrls = new Map<string, File>();
let blobUrlCounter = 0;

global.URL.createObjectURL = jest.fn((blob: Blob | File) => {
  const url = `blob:mock-${blobUrlCounter++}`;
  mockBlobUrls.set(url, blob as File);
  return url;
});

global.URL.revokeObjectURL = jest.fn((url: string) => {
  mockBlobUrls.delete(url);
});

interface QueuedTrack {
  id: string;
  file: File;
}

// Track the most recent Audio instance for testing
let mostRecentAudioInstance: MockAudio | null = null;

// Override MockAudio constructor to capture instances
class MockAudioWithTracking extends MockAudio {
  constructor() {
    super();
    mostRecentAudioInstance = this;
  }
}

(global as any).Audio = MockAudioWithTracking;

function MP3DeckWithQueue() {
  const output = useModStream();
  const [queue, setQueue] = useState<QueuedTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const addToQueue = (file: File) => {
    setQueue(prev => [...prev, { id: Math.random().toString(), file }]);
  };

  const playTrack = (index: number) => {
    setCurrentIndex(index);
  };

  const handleTrackEnd = () => {
    // Auto-advance to next track
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(-1); // Queue finished
    }
  };

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  return (
    <div>
      <MP3Deck
        output={output}
        onEnd={handleTrackEnd}
      >
        {({ loadFile, play, isPlaying, currentTime, duration }) => {
          // Load current track when it changes
          React.useEffect(() => {
            if (currentTrack) {
              loadFile(currentTrack.file);
              // Auto-play when track loads
              setTimeout(() => play(), 0);
            }
          }, [currentTrack?.id]);

          return (
            <div>
              {/* Queue controls */}
              <button onClick={() => {
                const file = new File(['audio data'], 'track1.mp3', { type: 'audio/mp3' });
                addToQueue(file);
              }}>
                Add Track 1
              </button>

              <button onClick={() => {
                const file = new File(['audio data 2'], 'track2.mp3', { type: 'audio/mp3' });
                addToQueue(file);
              }}>
                Add Track 2
              </button>

              <div data-testid="queue-length">{queue.length}</div>
              <div data-testid="current-index">{currentIndex}</div>
              <div data-testid="is-playing">{isPlaying ? 'playing' : 'paused'}</div>
              <div data-testid="current-track">{currentTrack?.file.name || 'none'}</div>

              {/* Track list */}
              {queue.map((track, idx) => (
                <button
                  key={track.id}
                  onClick={() => playTrack(idx)}
                  data-testid={`play-track-${idx}`}
                >
                  Play {track.file.name}
                </button>
              ))}
            </div>
          );
        }}
      </MP3Deck>
    </div>
  );
}

describe('MP3Deck Queue Pattern', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBlobUrls.clear();
    blobUrlCounter = 0;
    mostRecentAudioInstance = null;
  });

  it('should queue multiple tracks and play them in order', async () => {
    const user = userEvent.setup();

    render(
      <AudioProvider>
        <MP3DeckWithQueue />
      </AudioProvider>
    );

    // Initially no tracks
    expect(screen.getByTestId('queue-length')).toHaveTextContent('0');
    expect(screen.getByTestId('current-index')).toHaveTextContent('-1');

    // Add first track
    await user.click(screen.getByText('Add Track 1'));

    await waitFor(() => {
      expect(screen.getByTestId('queue-length')).toHaveTextContent('1');
    });

    // Add second track
    await user.click(screen.getByText('Add Track 2'));

    await waitFor(() => {
      expect(screen.getByTestId('queue-length')).toHaveTextContent('2');
    });

    // Play first track
    await user.click(screen.getByTestId('play-track-0'));

    await waitFor(() => {
      expect(screen.getByTestId('current-index')).toHaveTextContent('0');
      expect(screen.getByTestId('current-track')).toHaveTextContent('track1.mp3');
    });

    // Check that a blob URL was created
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('should auto-advance to next track when current track ends', async () => {
    const user = userEvent.setup();

    render(
      <AudioProvider>
        <MP3DeckWithQueue />
      </AudioProvider>
    );

    // Add two tracks
    await user.click(screen.getByText('Add Track 1'));
    await user.click(screen.getByText('Add Track 2'));

    await waitFor(() => {
      expect(screen.getByTestId('queue-length')).toHaveTextContent('2');
    });

    // Play first track
    await user.click(screen.getByTestId('play-track-0'));

    await waitFor(() => {
      expect(screen.getByTestId('current-track')).toHaveTextContent('track1.mp3');
    });

    // Simulate first track ending
    await act(async () => {
      if (mostRecentAudioInstance) {
        mostRecentAudioInstance.simulateEnd();
      }
    });

    // Should auto-advance to track 2
    await waitFor(() => {
      expect(screen.getByTestId('current-index')).toHaveTextContent('1');
      expect(screen.getByTestId('current-track')).toHaveTextContent('track2.mp3');
    });
  });

  it('should handle manually switching tracks', async () => {
    const user = userEvent.setup();

    render(
      <AudioProvider>
        <MP3DeckWithQueue />
      </AudioProvider>
    );

    // Add three tracks
    await user.click(screen.getByText('Add Track 1'));
    await user.click(screen.getByText('Add Track 2'));

    await waitFor(() => {
      expect(screen.getByTestId('queue-length')).toHaveTextContent('2');
    });

    // Play first track
    await user.click(screen.getByTestId('play-track-0'));

    await waitFor(() => {
      expect(screen.getByTestId('current-track')).toHaveTextContent('track1.mp3');
    });

    // Switch to second track
    await user.click(screen.getByTestId('play-track-1'));

    await waitFor(() => {
      expect(screen.getByTestId('current-track')).toHaveTextContent('track2.mp3');
    });
  });

  it('should handle loading a new file during playback', async () => {
    const user = userEvent.setup();

    render(
      <AudioProvider>
        <MP3DeckWithQueue />
      </AudioProvider>
    );

    // Add two tracks
    await user.click(screen.getByText('Add Track 1'));
    await user.click(screen.getByText('Add Track 2'));

    await waitFor(() => {
      expect(screen.getByTestId('queue-length')).toHaveTextContent('2');
    });

    // Play first track
    await user.click(screen.getByTestId('play-track-0'));

    await waitFor(() => {
      expect(screen.getByTestId('current-track')).toHaveTextContent('track1.mp3');
      expect(screen.getByTestId('is-playing')).toHaveTextContent('playing');
    });

    const firstAudioInstance = mostRecentAudioInstance;
    expect(firstAudioInstance?.paused).toBe(false);

    // Switch to second track while first is playing
    await user.click(screen.getByTestId('play-track-1'));

    await waitFor(() => {
      expect(screen.getByTestId('current-track')).toHaveTextContent('track2.mp3');
    });

    // The old audio instance should have been cleaned up (paused)
    expect(firstAudioInstance?.paused).toBe(true);
    expect(firstAudioInstance?.src).toBe('');

    // New audio instance should be playing
    const secondAudioInstance = mostRecentAudioInstance;
    expect(secondAudioInstance).not.toBe(firstAudioInstance);
    await waitFor(() => {
      expect(screen.getByTestId('is-playing')).toHaveTextContent('playing');
    });
  });

  it('should clean up blob URLs properly', async () => {
    const user = userEvent.setup();

    const { unmount } = render(
      <AudioProvider>
        <MP3DeckWithQueue />
      </AudioProvider>
    );

    // Add and play a track
    await user.click(screen.getByText('Add Track 1'));
    await user.click(screen.getByTestId('play-track-0'));

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    const createCallCount = (URL.createObjectURL as jest.Mock).mock.calls.length;

    // Unmount should trigger cleanup
    unmount();

    // Blob URLs should be revoked
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(createCallCount);
  });
});
