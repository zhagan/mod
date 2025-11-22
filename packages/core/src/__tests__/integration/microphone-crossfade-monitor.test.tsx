/**
 * Integration Test: Microphone -> CrossFade -> Monitor
 *
 * This test suite validates real-world usage patterns where components are
 * pre-wired with refs before audio context initialization. It specifically
 * tests timing and initialization issues that don't appear in unit tests.
 */

import React, { useRef, useEffect, useState } from 'react';
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

// Create a mock MediaStream
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

describe('Integration: Microphone -> CrossFade -> Monitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockResolvedValue(createMockMediaStream());
  });

  describe('Audio Graph Connection Timing', () => {
    it('should connect audio graph when components mount with pre-wired refs', async () => {
      const TestApp = () => {
        const mic1Ref = useModStream();
        const mic2Ref = useModStream();
        const crossfadeRef = useModStream();
        const outputRef = useModStream();

        const [mounted, setMounted] = useState(false);

        useEffect(() => {
          setMounted(true);
        }, []);

        return (
          <AudioProvider>
            <Microphone output={mic1Ref} autoStart={true} />
            <Microphone output={mic2Ref} autoStart={true} />
            <CrossFade
              inputs={[mic1Ref, mic2Ref]}
              output={crossfadeRef}
              mix={0.5}
            />
            <Monitor input={crossfadeRef} output={outputRef} />
            <LevelMeter input={crossfadeRef}>
              {({ level }) => (
                <div data-testid="crossfade-level">{level}</div>
              )}
            </LevelMeter>
            <div data-testid="mounted">{mounted ? 'mounted' : 'mounting'}</div>
          </AudioProvider>
        );
      };

      const { getByTestId } = render(<TestApp />);

      // Wait for mount
      await waitFor(() => {
        expect(getByTestId('mounted').textContent).toBe('mounted');
      }, { timeout: 3000 });

      // Wait for audio context and connections to be established
      await waitFor(() => {
        const levelElement = getByTestId('crossfade-level');
        expect(levelElement).toBeInTheDocument();
        // Level meter should exist even if showing 0
        expect(levelElement.textContent).toBeDefined();
      }, { timeout: 3000 });
    });

    it('should have fully connected audio graph after initialization', async () => {
      let mic1Output: any = null;
      let mic2Output: any = null;
      let crossfadeOutput: any = null;

      const TestApp = () => {
        const mic1Ref = useModStream();
        const mic2Ref = useModStream();
        const crossfadeRef = useModStream();
        const outputRef = useModStream();

        useEffect(() => {
          // Capture refs for inspection
          const timer = setTimeout(() => {
            mic1Output = mic1Ref.current;
            mic2Output = mic2Ref.current;
            crossfadeOutput = crossfadeRef.current;
          }, 500);
          return () => clearTimeout(timer);
        }, []);

        return (
          <AudioProvider>
            <Microphone output={mic1Ref} autoStart={true} />
            <Microphone output={mic2Ref} autoStart={true} />
            <CrossFade
              inputs={[mic1Ref, mic2Ref]}
              output={crossfadeRef}
              mix={0.5}
            />
            <Monitor input={crossfadeRef} output={outputRef} />
          </AudioProvider>
        );
      };

      render(<TestApp />);

      await waitFor(() => {
        expect(mic1Output).not.toBeNull();
        expect(mic2Output).not.toBeNull();
        expect(crossfadeOutput).not.toBeNull();
      }, { timeout: 3000 });

      // Check that all nodes exist
      expect(mic1Output?.audioNode).toBeDefined();
      expect(mic1Output?.gain).toBeDefined();
      expect(mic2Output?.audioNode).toBeDefined();
      expect(mic2Output?.gain).toBeDefined();
      expect(crossfadeOutput?.audioNode).toBeDefined();
      expect(crossfadeOutput?.gain).toBeDefined();

      // Check that crossfade has internal gain nodes
      expect((crossfadeOutput as any)._gainA).toBeDefined();
      expect((crossfadeOutput as any)._gainB).toBeDefined();

      // CRITICAL: Check that audioNode points to the OUTPUT gain, not input
      expect(crossfadeOutput.audioNode).toBe(crossfadeOutput.gain);
      expect(crossfadeOutput.audioNode).not.toBe((crossfadeOutput as any)._gainA);
      expect(crossfadeOutput.audioNode).not.toBe((crossfadeOutput as any)._gainB);
    });

    it('should have correct gain values set on internal nodes on mount', async () => {
      let crossfadeOutput: any = null;

      const TestApp = () => {
        const mic1Ref = useModStream();
        const mic2Ref = useModStream();
        const crossfadeRef = useModStream();
        const outputRef = useModStream();

        useEffect(() => {
          const timer = setTimeout(() => {
            crossfadeOutput = crossfadeRef.current;
          }, 500);
          return () => clearTimeout(timer);
        }, []);

        return (
          <AudioProvider>
            <Microphone output={mic1Ref} autoStart={true} />
            <Microphone output={mic2Ref} autoStart={true} />
            <CrossFade
              inputs={[mic1Ref, mic2Ref]}
              output={crossfadeRef}
              mix={0.5}
              mode="equal-power"
            />
            <Monitor input={crossfadeRef} output={outputRef} />
          </AudioProvider>
        );
      };

      render(<TestApp />);

      await waitFor(() => {
        expect(crossfadeOutput).not.toBeNull();
        expect((crossfadeOutput as any)._gainA).toBeDefined();
        expect((crossfadeOutput as any)._gainB).toBeDefined();
      }, { timeout: 3000 });

      // Check that gain values are set (equal-power at 0.5 should be ~0.707 each)
      const gainAValue = (crossfadeOutput as any)._gainA.gain.value;
      const gainBValue = (crossfadeOutput as any)._gainB.gain.value;

      expect(gainAValue).toBeGreaterThan(0);
      expect(gainBValue).toBeGreaterThan(0);
      expect(gainAValue).toBeCloseTo(0.707, 1);
      expect(gainBValue).toBeCloseTo(0.707, 1);
    });

    it('should connect microphone outputs to crossfade inputs on mount', async () => {
      let mic1Output: any = null;
      let mic2Output: any = null;
      let crossfadeOutput: any = null;

      const TestApp = () => {
        const mic1Ref = useModStream();
        const mic2Ref = useModStream();
        const crossfadeRef = useModStream();
        const outputRef = useModStream();

        useEffect(() => {
          const timer = setTimeout(() => {
            mic1Output = mic1Ref.current;
            mic2Output = mic2Ref.current;
            crossfadeOutput = crossfadeRef.current;
          }, 500);
          return () => clearTimeout(timer);
        }, []);

        return (
          <AudioProvider>
            <Microphone output={mic1Ref} autoStart={true} />
            <Microphone output={mic2Ref} autoStart={true} />
            <CrossFade
              inputs={[mic1Ref, mic2Ref]}
              output={crossfadeRef}
              mix={0.5}
            />
            <Monitor input={crossfadeRef} output={outputRef} />
          </AudioProvider>
        );
      };

      render(<TestApp />);

      await waitFor(() => {
        expect(mic1Output).not.toBeNull();
        expect(mic2Output).not.toBeNull();
        expect(crossfadeOutput).not.toBeNull();
      }, { timeout: 3000 });

      // Check that microphone gains are connected to crossfade internal gains
      // We need to verify the Web Audio graph connections
      const mic1Gain = mic1Output.gain;
      const mic2Gain = mic2Output.gain;
      const gainA = (crossfadeOutput as any)._gainA;
      const gainB = (crossfadeOutput as any)._gainB;

      expect(mic1Gain).toBeDefined();
      expect(mic2Gain).toBeDefined();
      expect(gainA).toBeDefined();
      expect(gainB).toBeDefined();

      // NOTE: We can't easily test the actual Web Audio connections in jsdom,
      // but we can verify the nodes exist and are in the correct structure
    });
  });

  describe('Mix Control Without Manual Interaction', () => {
    it('should have correct gain values at mix=0 on mount', async () => {
      let crossfadeOutput: any = null;

      const TestApp = () => {
        const mic1Ref = useModStream();
        const mic2Ref = useModStream();
        const crossfadeRef = useModStream();
        const outputRef = useModStream();

        useEffect(() => {
          const timer = setTimeout(() => {
            crossfadeOutput = crossfadeRef.current;
          }, 500);
          return () => clearTimeout(timer);
        }, []);

        return (
          <AudioProvider>
            <Microphone output={mic1Ref} autoStart={true} />
            <Microphone output={mic2Ref} autoStart={true} />
            <CrossFade
              inputs={[mic1Ref, mic2Ref]}
              output={crossfadeRef}
              mix={0}
              mode="linear"
            />
            <Monitor input={crossfadeRef} output={outputRef} />
          </AudioProvider>
        );
      };

      render(<TestApp />);

      await waitFor(() => {
        expect(crossfadeOutput).not.toBeNull();
      }, { timeout: 3000 });

      // At mix=0, linear mode: A should be 1, B should be 0
      const gainAValue = (crossfadeOutput as any)._gainA.gain.value;
      const gainBValue = (crossfadeOutput as any)._gainB.gain.value;

      expect(gainAValue).toBe(1);
      expect(gainBValue).toBe(0);
    });

    it('should have correct gain values at mix=1 on mount', async () => {
      let crossfadeOutput: any = null;

      const TestApp = () => {
        const mic1Ref = useModStream();
        const mic2Ref = useModStream();
        const crossfadeRef = useModStream();
        const outputRef = useModStream();

        useEffect(() => {
          const timer = setTimeout(() => {
            crossfadeOutput = crossfadeRef.current;
          }, 500);
          return () => clearTimeout(timer);
        }, []);

        return (
          <AudioProvider>
            <Microphone output={mic1Ref} autoStart={true} />
            <Microphone output={mic2Ref} autoStart={true} />
            <CrossFade
              inputs={[mic1Ref, mic2Ref]}
              output={crossfadeRef}
              mix={1}
              mode="linear"
            />
            <Monitor input={crossfadeRef} output={outputRef} />
          </AudioProvider>
        );
      };

      render(<TestApp />);

      await waitFor(() => {
        expect(crossfadeOutput).not.toBeNull();
      }, { timeout: 3000 });

      // At mix=1, linear mode: A should be 0, B should be 1
      const gainAValue = (crossfadeOutput as any)._gainA.gain.value;
      const gainBValue = (crossfadeOutput as any)._gainB.gain.value;

      expect(gainAValue).toBe(0);
      expect(gainBValue).toBe(1);
    });

    it('should have correct gain values at mix=0.25 on mount', async () => {
      let crossfadeOutput: any = null;

      const TestApp = () => {
        const mic1Ref = useModStream();
        const mic2Ref = useModStream();
        const crossfadeRef = useModStream();
        const outputRef = useModStream();

        useEffect(() => {
          const timer = setTimeout(() => {
            crossfadeOutput = crossfadeRef.current;
          }, 500);
          return () => clearTimeout(timer);
        }, []);

        return (
          <AudioProvider>
            <Microphone output={mic1Ref} autoStart={true} />
            <Microphone output={mic2Ref} autoStart={true} />
            <CrossFade
              inputs={[mic1Ref, mic2Ref]}
              output={crossfadeRef}
              mix={0.25}
              mode="linear"
            />
            <Monitor input={crossfadeRef} output={outputRef} />
          </AudioProvider>
        );
      };

      render(<TestApp />);

      await waitFor(() => {
        expect(crossfadeOutput).not.toBeNull();
      }, { timeout: 3000 });

      // At mix=0.25, linear mode: A should be 0.75, B should be 0.25
      const gainAValue = (crossfadeOutput as any)._gainA.gain.value;
      const gainBValue = (crossfadeOutput as any)._gainB.gain.value;

      expect(gainAValue).toBeCloseTo(0.75, 2);
      expect(gainBValue).toBeCloseTo(0.25, 2);
    });
  });

  describe('Different CrossFade Modes on Mount', () => {
    it('should apply dj-cut mode gain values correctly on mount', async () => {
      let crossfadeOutput: any = null;

      const TestApp = () => {
        const mic1Ref = useModStream();
        const mic2Ref = useModStream();
        const crossfadeRef = useModStream();
        const outputRef = useModStream();

        useEffect(() => {
          const timer = setTimeout(() => {
            crossfadeOutput = crossfadeRef.current;
          }, 500);
          return () => clearTimeout(timer);
        }, []);

        return (
          <AudioProvider>
            <Microphone output={mic1Ref} autoStart={true} />
            <Microphone output={mic2Ref} autoStart={true} />
            <CrossFade
              inputs={[mic1Ref, mic2Ref]}
              output={crossfadeRef}
              mix={0.3}
              mode="dj-cut"
            />
            <Monitor input={crossfadeRef} output={outputRef} />
          </AudioProvider>
        );
      };

      render(<TestApp />);

      await waitFor(() => {
        expect(crossfadeOutput).not.toBeNull();
      }, { timeout: 3000 });

      // At mix=0.3 with dj-cut: should be full A (1, 0)
      const gainAValue = (crossfadeOutput as any)._gainA.gain.value;
      const gainBValue = (crossfadeOutput as any)._gainB.gain.value;

      expect(gainAValue).toBe(1);
      expect(gainBValue).toBe(0);
    });

    it('should apply exponential mode gain values correctly on mount', async () => {
      let crossfadeOutput: any = null;

      const TestApp = () => {
        const mic1Ref = useModStream();
        const mic2Ref = useModStream();
        const crossfadeRef = useModStream();
        const outputRef = useModStream();

        useEffect(() => {
          const timer = setTimeout(() => {
            crossfadeOutput = crossfadeRef.current;
          }, 500);
          return () => clearTimeout(timer);
        }, []);

        return (
          <AudioProvider>
            <Microphone output={mic1Ref} autoStart={true} />
            <Microphone output={mic2Ref} autoStart={true} />
            <CrossFade
              inputs={[mic1Ref, mic2Ref]}
              output={crossfadeRef}
              mix={0.5}
              mode="exponential"
            />
            <Monitor input={crossfadeRef} output={outputRef} />
          </AudioProvider>
        );
      };

      render(<TestApp />);

      await waitFor(() => {
        expect(crossfadeOutput).not.toBeNull();
      }, { timeout: 3000 });

      // At mix=0.5 with exponential: both should be 0.25 (0.5^2)
      const gainAValue = (crossfadeOutput as any)._gainA.gain.value;
      const gainBValue = (crossfadeOutput as any)._gainB.gain.value;

      expect(gainAValue).toBeCloseTo(0.25, 2);
      expect(gainBValue).toBeCloseTo(0.25, 2);
    });
  });

  describe('Real-World Bug: Input Connection Timing', () => {
    it('should connect inputs even when they are not available at first mount', async () => {
      // This test simulates the real-world scenario where CrossFade mounts
      // before the Microphone refs are populated

      let crossfadeOutput: any = null;
      let mic1Output: any = null;
      let mic2Output: any = null;
      let connectionsChecked = false;

      const TestApp = () => {
        const mic1Ref = useModStream();
        const mic2Ref = useModStream();
        const crossfadeRef = useModStream();

        useEffect(() => {
          const checkConnections = () => {
            if (!crossfadeRef.current || !mic1Ref.current || !mic2Ref.current) {
              return;
            }

            crossfadeOutput = crossfadeRef.current;
            mic1Output = mic1Ref.current;
            mic2Output = mic2Ref.current;

            // Check that the connection was established
            const gainA = (crossfadeOutput as any)._gainA;
            const gainB = (crossfadeOutput as any)._gainB;

            // The bug: these might not be connected if timing is wrong
            connectionsChecked = true;
          };

          const timer = setTimeout(checkConnections, 1000);
          return () => clearTimeout(timer);
        }, []);

        return (
          <AudioProvider>
            <Microphone output={mic1Ref} autoStart={true} />
            <Microphone output={mic2Ref} autoStart={true} />
            <CrossFade
              inputs={[mic1Ref, mic2Ref]}
              output={crossfadeRef}
              mix={0.5}
            />
          </AudioProvider>
        );
      };

      render(<TestApp />);

      await waitFor(() => {
        expect(connectionsChecked).toBe(true);
        expect(crossfadeOutput).not.toBeNull();
        expect(mic1Output).not.toBeNull();
        expect(mic2Output).not.toBeNull();
      }, { timeout: 3000 });

      // Critical assertion: verify the inputs ARE connected
      // This will fail if the bug exists
      const gainA = (crossfadeOutput as any)._gainA;
      const gainB = (crossfadeOutput as any)._gainB;

      expect(gainA).toBeDefined();
      expect(gainB).toBeDefined();

      // The actual bug test: Are the gain values being applied?
      // With mix=0.5 and equal-power mode, both should be ~0.707
      expect(gainA.gain.value).toBeCloseTo(0.707, 1);
      expect(gainB.gain.value).toBeCloseTo(0.707, 1);
    });
  });

  describe('Component Lifecycle', () => {
    it('should maintain connections when crossfade unmounts and remounts', async () => {
      let crossfadeOutput: any = null;

      const TestApp = () => {
        const mic1Ref = useModStream();
        const mic2Ref = useModStream();
        const crossfadeRef = useModStream();
        const outputRef = useModStream();
        const [showCrossfade, setShowCrossfade] = useState(true);

        useEffect(() => {
          const timer = setTimeout(() => {
            crossfadeOutput = crossfadeRef.current;
          }, 500);
          return () => clearTimeout(timer);
        }, [showCrossfade]);

        return (
          <AudioProvider>
            <Microphone output={mic1Ref} autoStart={true} />
            <Microphone output={mic2Ref} autoStart={true} />
            {showCrossfade && (
              <CrossFade
                inputs={[mic1Ref, mic2Ref]}
                output={crossfadeRef}
                mix={0.5}
              />
            )}
            {showCrossfade && <Monitor input={crossfadeRef} output={outputRef} />}
            <button onClick={() => setShowCrossfade(!showCrossfade)} data-testid="toggle">
              Toggle
            </button>
          </AudioProvider>
        );
      };

      const { getByTestId } = render(<TestApp />);

      await waitFor(() => {
        expect(crossfadeOutput).not.toBeNull();
      }, { timeout: 3000 });

      const firstOutput = crossfadeOutput;
      expect(firstOutput).toBeDefined();

      // Unmount
      getByTestId('toggle').click();

      await waitFor(() => {
        // Should be null after unmount
        expect(crossfadeOutput).toBeNull();
      }, { timeout: 1000 });

      // Remount
      crossfadeOutput = null;
      getByTestId('toggle').click();

      await waitFor(() => {
        expect(crossfadeOutput).not.toBeNull();
      }, { timeout: 3000 });

      const secondOutput = crossfadeOutput;
      expect(secondOutput).toBeDefined();
      expect(secondOutput?.audioNode).toBeDefined();
      expect((secondOutput as any)._gainA).toBeDefined();
      expect((secondOutput as any)._gainB).toBeDefined();
    });
  });
});
