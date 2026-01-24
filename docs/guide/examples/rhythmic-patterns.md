# Rhythmic Patterns

Create rhythmic sequences and patterns using sequencers, clocks, and gates.

## What We'll Build

A drum machine-style sequencer with:
- Clock for tempo control
- Multiple sequencers for different sounds
- Gate envelope for percussion
- Pattern programming

## Complete Code

```tsx
import {
  AudioProvider,
  Clock,
  Sequencer,
  NoiseGenerator,
  ToneGenerator,
  ADSR,
  Filter,
  Mixer,
  Monitor,
  useModStream,
  Slider,
  Button
} from '@mode-7/mod';
import { useState } from 'react';

function RhythmicPatterns() {
  const clock = useModStream();
  const kickSeq = useModStream();
  const kickGate = useModStream();
  const snareSeq = useModStream();
  const snareGate = useModStream();
  const hihatSeq = useModStream();
  const hihatGate = useModStream();
  
  const kickTone = useModStream();
  const kickEnv = useModStream();
  const kick = useModStream();
  
  const snareNoise = useModStream();
  const snareEnv = useModStream();
  const snare = useModStream();
  
  const hihatNoise = useModStream();
  const hihatEnv = useModStream();
  const hihat = useModStream();
  
  const mixed = useModStream();

  const [bpm, setBpm] = useState(120);

  return (
    <AudioProvider>
      <div className="drum-machine">
        <h1>Drum Machine</h1>

        {/* Master Clock */}
        <div className="clock-section">
          <h2>Clock</h2>
          <Clock output={clock}>
            {({ bpm, setBpm, isRunning, start, stop }) => (
              <div>
                <Slider
                  value={bpm}
                  onChange={setBpm}
                  min={60}
                  max={180}
                  label={`${bpm} BPM`}
                />
                <Button
                  onClick={isRunning ? stop : start}
                  variant={isRunning ? 'danger' : 'success'}
                >
                  {isRunning ? 'Stop' : 'Start'}
                </Button>
              </div>
            )}
          </Clock>
        </div>

        {/* Kick Drum */}
        <div className="drum">
          <h2>Kick Drum</h2>
          
          <Sequencer output={kickSeq} gateOutput={kickGate} clock={clock} numSteps={8}>
            {({ steps, setSteps }) => (
              <div className="pattern">
                {steps.map((step, i) => (
                  <Button
                    key={i}
                    active={step.active}
                    onClick={() => {
                      const next = [...steps];
                      next[i] = { ...next[i], active: !next[i].active };
                      setSteps(next);
                    }}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            )}
          </Sequencer>

          <ToneGenerator output={kickTone} frequency={60} waveform="sine" />
          
          <ADSR
            output={kickEnv}
            attack={0.001}
            decay={0.3}
            sustain={0}
            release={0.1}
            gate={kickGate}
          />
          
          <Filter
            input={kickTone}
            output={kick}
            type="lowpass"
            frequency={200}
            cv={kickEnv}
            cvAmount={1000}
          />
        </div>

        {/* Snare Drum */}
        <div className="drum">
          <h2>Snare Drum</h2>
          
          <Sequencer output={snareSeq} gateOutput={snareGate} clock={clock} numSteps={8}>
            {({ steps, setSteps }) => (
              <div className="pattern">
                {steps.map((step, i) => (
                  <Button
                    key={i}
                    active={step.active}
                    onClick={() => {
                      const next = [...steps];
                      next[i] = { ...next[i], active: !next[i].active };
                      setSteps(next);
                    }}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            )}
          </Sequencer>

          <NoiseGenerator output={snareNoise} type="white" />
          
          <ADSR
            output={snareEnv}
            attack={0.001}
            decay={0.15}
            sustain={0}
            release={0.05}
            gate={snareGate}
          />
          
          <Filter
            input={snareNoise}
            output={snare}
            type="highpass"
            frequency={1000}
            cv={snareEnv}
            cvAmount={2000}
          />
        </div>

        {/* Hi-Hat */}
        <div className="drum">
          <h2>Hi-Hat</h2>
          
          <Sequencer output={hihatSeq} gateOutput={hihatGate} clock={clock} numSteps={16}>
            {({ steps, setSteps }) => (
              <div className="pattern">
                {steps.map((step, i) => (
                  <Button
                    key={i}
                    active={step.active}
                    onClick={() => {
                      const next = [...steps];
                      next[i] = { ...next[i], active: !next[i].active };
                      setSteps(next);
                    }}
                    size="small"
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            )}
          </Sequencer>

          <NoiseGenerator output={hihatNoise} type="white" />
          
          <ADSR
            output={hihatEnv}
            attack={0.001}
            decay={0.05}
            sustain={0}
            release={0.02}
            gate={hihatGate}
          />
          
          <Filter
            input={hihatNoise}
            output={hihat}
            type="highpass"
            frequency={5000}
            Q={1}
            cv={hihatEnv}
          />
        </div>

        {/* Mixer */}
        <Mixer inputs={[kick, snare, hihat]} output={mixed}>
          {({ levels, setLevel }) => (
            <div className="mixer">
              <h2>Mix</h2>
              <Slider value={levels[0]} onChange={v => setLevel(0, v)} label="Kick" />
              <Slider value={levels[1]} onChange={v => setLevel(1, v)} label="Snare" />
              <Slider value={levels[2]} onChange={v => setLevel(2, v)} label="Hi-Hat" />
            </div>
          )}
        </Mixer>

        {/* Output */}
        <Monitor input={mixed}>
          {({ gain, setGain }) => (
            <Slider value={gain} onChange={setGain} min={0} max={1} label="Master" />
          )}
        </Monitor>
      </div>
    </AudioProvider>
  );
}

export default RhythmicPatterns;
```

## How It Works

### Clock Synchronization

One clock drives all sequencers, ensuring they stay in sync:

```
Clock → Kick Seq
     → Snare Seq
     → Hi-Hat Seq
```

### Drum Synthesis

Each drum uses a different synthesis method:

**Kick**: Low sine wave + envelope on filter cutoff  
**Snare**: Filtered white noise + short decay  
**Hi-Hat**: High-passed noise + very short decay

### Pattern Programming

Click buttons to toggle steps on/off. Each sequencer outputs 1 when active, 0 when inactive.

## Preset Patterns

### Four-on-the-floor
```
Kick:   [1,0,0,0,1,0,0,0]
Snare:  [0,0,1,0,0,0,1,0]
Hi-Hat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]
```

### Breakbeat
```
Kick:   [1,0,0,1,0,0,1,0]
Snare:  [0,0,1,0,0,1,0,0]
Hi-Hat: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
```

## Next Steps

- Add melody with [Sequencer modulation](/guide/cv-modulation)
- Explore [more CV Generators](/guide/cv-generators)
- Build a [complete synthesizer](/guide/examples/simple-synth)
