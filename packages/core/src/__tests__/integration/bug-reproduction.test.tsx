/**
 * Bug Reproduction Test: Pre-wired Refs Pattern
 *
 * This test reproduces the exact bug reported by the user where:
 * 1. Refs are created at component mount with useModStream()
 * 2. These refs are passed to CrossFade immediately (but are null)
 * 3. Microphone components populate the refs asynchronously
 * 4. CrossFade never detects the refs are ready and doesn't connect
 *
 * This is the REAL-WORLD pattern used in production code.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { AudioProvider } from '../../context/AudioContext';
import { Microphone } from '../../components/sources/Microphone';
import { CrossFade } from '../../components/mixers/CrossFade';
import { Monitor } from '../../components/output/Monitor';
import { LevelMeter } from '../../components/visualizations/LevelMeter';
import { useModStream } from '../../hooks/useModStream';

// Mock getUserMedia
const mockGetUserMedia = jest.fn();
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

function createMockMediaStream(): MediaStream {
  const mockStream = {
    id: Math.random().toString(36),
    active: true,
    getTracks: jest.fn(() => []),
    getAudioTracks: jest.fn(() => [
      {
        id: 'audio-track-1',
        kind: 'audio',
        label: 'Mock Audio Track',
        enabled: true,
        muted: false,
        readyState: 'live',
        stop: jest.fn(),
      },
    ]),
    getVideoTracks: jest.fn(() => []),
  } as unknown as MediaStream;

  return mockStream;
}

describe('Bug Reproduction: Pre-wired Refs Pattern', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockResolvedValue(createMockMediaStream());
  });

  it('SHOULD FAIL: CrossFade does not connect inputs when refs are pre-wired', async () => {
    /**
     * This is the EXACT pattern from the user's MixerComponent:
     *
     * const mic1Ref = useModStream();
     * const mic2Ref = useModStream();
     * const crossfadeOutputRef = useModStream();
     *
     * return (
     *   <AudioProvider>
     *     <MicrophoneChannel output={mic1Ref} />
     *     <MicrophoneChannel output={mic2Ref} />
     *     <CrossFade inputs={[mic1Ref, mic2Ref]} output={crossfadeOutputRef} />
     *     <Monitor input={crossfadeOutputRef} />
     *   </AudioProvider>
     * );
     */

    const MixerApp = () => {
      // THIS IS THE KEY: refs are created here, before any component mounts
      const mic1Ref = useModStream();
      const mic2Ref = useModStream();
      const crossfadeOutputRef = useModStream();

      return (
        <AudioProvider>
          {/* Microphones will populate their output refs asynchronously */}
          <Microphone output={mic1Ref} autoStart={true} />
          <Microphone output={mic2Ref} autoStart={true} />

          {/* CrossFade receives empty refs initially */}
          <CrossFade
            inputs={[mic1Ref, mic2Ref]}
            output={crossfadeOutputRef}
            mix={0.5}
            mode="linear"
          />

          {/* Monitor for output */}
          <Monitor input={crossfadeOutputRef}>
            {() => <div data-testid="monitor">Monitor Active</div>}
          </Monitor>

          {/* Debug: Level meters to check signal flow */}
          <LevelMeter input={mic1Ref}>
            {({ level }) => <div data-testid="mic1-level">{level}</div>}
          </LevelMeter>
          <LevelMeter input={mic2Ref}>
            {({ level }) => <div data-testid="mic2-level">{level}</div>}
          </LevelMeter>
          <LevelMeter input={crossfadeOutputRef}>
            {({ level }) => <div data-testid="crossfade-level">{level}</div>}
          </LevelMeter>
        </AudioProvider>
      );
    };

    const { getByTestId } = render(<MixerApp />);

    // Wait for everything to mount and initialize
    await waitFor(() => {
      expect(getByTestId('monitor')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Give extra time for audio graph to connect
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Now let's inspect the actual audio graph state
    // We need to get the refs somehow - let's use a different approach
    // by capturing them during render

    let capturedMic1: any = null;
    let capturedMic2: any = null;
    let capturedCrossfade: any = null;

    const InspectorApp = () => {
      const mic1Ref = useModStream();
      const mic2Ref = useModStream();
      const crossfadeOutputRef = useModStream();

      // Capture refs for inspection
      React.useEffect(() => {
        const timer = setTimeout(() => {
          capturedMic1 = mic1Ref.current;
          capturedMic2 = mic2Ref.current;
          capturedCrossfade = crossfadeOutputRef.current;
        }, 1500);
        return () => clearTimeout(timer);
      }, []);

      return (
        <AudioProvider>
          <Microphone output={mic1Ref} autoStart={true} />
          <Microphone output={mic2Ref} autoStart={true} />
          <CrossFade
            inputs={[mic1Ref, mic2Ref]}
            output={crossfadeOutputRef}
            mix={0.5}
            mode="linear"
          />
          <div data-testid="ready">Ready</div>
        </AudioProvider>
      );
    };

    const { getByTestId: getById2 } = render(<InspectorApp />);

    await waitFor(() => {
      expect(getById2('ready')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Wait for capture
    await new Promise(resolve => setTimeout(resolve, 2000));

    // THE BUG: Verify that refs exist
    expect(capturedMic1).not.toBeNull();
    expect(capturedMic2).not.toBeNull();
    expect(capturedCrossfade).not.toBeNull();

    console.log('=== DEBUGGING AUDIO GRAPH STATE ===');
    console.log('Mic 1:', capturedMic1 ? 'EXISTS' : 'NULL');
    console.log('Mic 2:', capturedMic2 ? 'EXISTS' : 'NULL');
    console.log('Crossfade:', capturedCrossfade ? 'EXISTS' : 'NULL');

    if (capturedCrossfade) {
      const gainA = (capturedCrossfade as any)._gainA;
      const gainB = (capturedCrossfade as any)._gainB;

      console.log('Crossfade gainA:', gainA ? 'EXISTS' : 'NULL');
      console.log('Crossfade gainB:', gainB ? 'EXISTS' : 'NULL');

      if (gainA && gainB) {
        console.log('Crossfade gainA.gain.value:', gainA.gain.value);
        console.log('Crossfade gainB.gain.value:', gainB.gain.value);

        // At mix=0.5 with linear mode, both should be 0.5
        // THIS IS THE BUG TEST: These values should be set, but they might not be
        // if the inputs never connected

        console.log('Expected: gainA=0.5, gainB=0.5');
        console.log('Actual: gainA=' + gainA.gain.value + ', gainB=' + gainB.gain.value);

        // THE CRITICAL ASSERTION
        expect(gainA.gain.value).toBe(0.5);
        expect(gainB.gain.value).toBe(0.5);
      }
    }
  });

  it('Manual test: Log the state changes during initialization', async () => {
    const logs: string[] = [];

    const LoggingApp = () => {
      const mic1Ref = useModStream();
      const mic2Ref = useModStream();
      const crossfadeOutputRef = useModStream();

      // Log state at different intervals
      React.useEffect(() => {
        logs.push('Component mounted');

        const checks = [100, 200, 500, 1000, 1500];
        const timers = checks.map(delay =>
          setTimeout(() => {
            logs.push(`t+${delay}ms: mic1=${!!mic1Ref.current}, mic2=${!!mic2Ref.current}, crossfade=${!!crossfadeOutputRef.current}`);

            if (crossfadeOutputRef.current) {
              const cf = crossfadeOutputRef.current as any;
              logs.push(`  crossfade.gainA=${cf._gainA?.gain?.value}, gainB=${cf._gainB?.gain?.value}`);
            }
          }, delay)
        );

        return () => timers.forEach(clearTimeout);
      }, []);

      return (
        <AudioProvider>
          <Microphone output={mic1Ref} autoStart={true} />
          <Microphone output={mic2Ref} autoStart={true} />
          <CrossFade
            inputs={[mic1Ref, mic2Ref]}
            output={crossfadeOutputRef}
            mix={0.5}
            mode="linear"
          />
          <div data-testid="ready">Ready</div>
        </AudioProvider>
      );
    };

    const { getByTestId } = render(<LoggingApp />);

    await waitFor(() => {
      expect(getByTestId('ready')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Wait for all logs
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n=== INITIALIZATION TIMELINE ===');
    logs.forEach(log => console.log(log));
    console.log('=================================\n');

    // This test just logs, doesn't assert
    expect(logs.length).toBeGreaterThan(0);
  });
});
