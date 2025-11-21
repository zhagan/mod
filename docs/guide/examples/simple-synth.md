# Simple Synthesizer

Build a complete playable synthesizer with oscillators, filter, and envelope.

## What We'll Build

A monophonic synthesizer with:
- Two oscillators with waveform selection
- Resonant lowpass filter
- ADSR envelope
- Master volume control

## Complete Code

```tsx
import {
  AudioProvider,
  ToneGenerator,
  Filter,
  ADSR,
  Mixer,
  Monitor,
  useModStream,
  Slider,
  Select,
  Button
} from '@mode-7/mod';
import { useState } from 'react';

function SimpleSynth() {
  const osc1Out = useModStream();
  const osc2Out = useModStream();
  const mixed = useModStream();
  const envelope = useModStream();
  const filtered = useModStream();

  const [frequency, setFrequency] = useState(440);
  const [isPlaying, setIsPlaying] = useState(false);

  const notes = [
    { name: 'C', freq: 261.63 },
    { name: 'D', freq: 293.66 },
    { name: 'E', freq: 329.63 },
    { name: 'F', freq: 349.23 },
    { name: 'G', freq: 392.00 },
    { name: 'A', freq: 440.00 },
    { name: 'B', freq: 493.88 },
  ];

  return (
    <AudioProvider>
      <div className="synth">
        <h1>Simple Synthesizer</h1>

        {/* Oscillators */}
        <div className="oscillators">
          <h2>Oscillators</h2>

          <ToneGenerator output={osc1Out} frequency={frequency}>
            {({ type, setType, gain, setGain }) => (
              <div className="oscillator">
                <h3>Osc 1</h3>
                <Select
                  value={type}
                  onChange={setType}
                  options={[
                    { value: 'sine', label: 'Sine' },
                    { value: 'square', label: 'Square' },
                    { value: 'sawtooth', label: 'Sawtooth' },
                    { value: 'triangle', label: 'Triangle' },
                  ]}
                />
                <Slider
                  value={gain}
                  onChange={setGain}
                  min={0}
                  max={1}
                  step={0.01}
                  label="Level"
                />
              </div>
            )}
          </ToneGenerator>

          <ToneGenerator output={osc2Out} frequency={frequency * 1.5}>
            {({ type, setType, gain, setGain }) => (
              <div className="oscillator">
                <h3>Osc 2</h3>
                <Select
                  value={type}
                  onChange={setType}
                  options={[
                    { value: 'sine', label: 'Sine' },
                    { value: 'square', label: 'Square' },
                    { value: 'sawtooth', label: 'Sawtooth' },
                    { value: 'triangle', label: 'Triangle' },
                  ]}
                />
                <Slider
                  value={gain}
                  onChange={setGain}
                  min={0}
                  max={1}
                  step={0.01}
                  label="Level"
                />
              </div>
            )}
          </ToneGenerator>
        </div>

        {/* Mix oscillators */}
        <Mixer inputs={[osc1Out, osc2Out]} output={mixed} />

        {/* Envelope */}
        <div className="envelope">
          <h2>Envelope</h2>
          <ADSR output={envelope}>
            {({ attack, setAttack, decay, setDecay, sustain, setSustain, release, setRelease, trigger, release: releaseEnv }) => (
              <div>
                <Slider value={attack} onChange={setAttack} min={0.001} max={2} step={0.001} label="Attack" />
                <Slider value={decay} onChange={setDecay} min={0.001} max={2} step={0.001} label="Decay" />
                <Slider value={sustain} onChange={setSustain} min={0} max={1} step={0.01} label="Sustain" />
                <Slider value={release} onChange={setRelease} min={0.001} max={5} step={0.001} label="Release" />
              </div>
            )}
          </ADSR>
        </div>

        {/* Filter */}
        <Filter input={mixed} output={filtered} cvInput={envelope} cvTarget="frequency" cvAmount={8000}>
          {({ frequency, setFrequency, Q, setQ }) => (
            <div className="filter">
              <h2>Filter</h2>
              <Slider
                value={frequency}
                onChange={setFrequency}
                min={20}
                max={20000}
                label="Cutoff"
              />
              <Slider
                value={Q}
                onChange={setQ}
                min={0.1}
                max={30}
                step={0.1}
                label="Resonance"
              />
            </div>
          )}
        </Filter>

        {/* Keyboard */}
        <div className="keyboard">
          <h2>Keyboard</h2>
          {notes.map(note => (
            <Button
              key={note.name}
              onMouseDown={() => setFrequency(note.freq)}
            >
              {note.name}
            </Button>
          ))}
        </div>

        {/* Output */}
        <Monitor input={filtered}>
          {({ gain, setGain, isMuted, setMuted }) => (
            <div className="master">
              <h2>Master</h2>
              <Slider
                value={gain}
                onChange={setGain}
                min={0}
                max={1}
                step={0.01}
                label="Volume"
              />
              <Button
                active={isMuted}
                onClick={() => setMuted(!isMuted)}
                variant={isMuted ? 'danger' : 'default'}
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </Button>
            </div>
          )}
        </Monitor>
      </div>
    </AudioProvider>
  );
}

export default SimpleSynth;
```

## How It Works

### Signal Flow

```
Osc 1 ──┐
        ├─→ Mixer ──→ Filter ──→ Monitor ──→ Speakers
Osc 2 ──┘              ↑
                       │
                   Envelope (CV)
```

### Oscillators

Two tone generators provide the sound source:
- **Osc 1**: Fundamental frequency
- **Osc 2**: 1.5x frequency (perfect fifth above)

### Envelope

The ADSR envelope modulates the filter cutoff frequency, creating a classic synthesizer sweep effect.

### Filter

The lowpass filter shapes the timbre, with envelope modulation adding movement to the sound.

## Next Steps

- Add an [LFO for vibrato](/guide/examples/lfo-modulation)
- Create [rhythmic patterns](/guide/examples/rhythmic-patterns)
- Add [visualizations](/api/visualizations/oscilloscope)
