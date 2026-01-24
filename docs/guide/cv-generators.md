# CV Generators

CV (Control Voltage) generators produce modulation signals to dynamically control parameters of other modules.

## LFO (Low Frequency Oscillator)

Creates cyclic modulation at sub-audio and audio rates.

**Rate**: 0.01 Hz - 20 Hz (or higher)  
**Waveforms**: Sine, triangle, square, sawtooth  
**API**: [LFO](/api/cv/lfo)

```tsx
<LFO output={ref} frequency={2} waveform="sine" amplitude={1} />
```

**Common uses**:
- Vibrato (pitch modulation)
- Tremolo (amplitude modulation)
- Filter sweeps
- Panning modulation

## ADSR (Envelope Generator)

Creates attack-decay-sustain-release envelopes for one-shot modulation.

**Stages**: Attack → Decay → Sustain → Release  
**API**: [ADSR](/api/cv/adsr)

```tsx
<ADSR output={ref} attack={0.1} decay={0.2} sustain={0.7} release={0.5}>
  {({ trigger, release }) => (
    <button onMouseDown={trigger} onMouseUp={release}>
      Trigger
    </button>
  )}
</ADSR>
```

**Common uses**:
- Filter envelopes
- Amplitude envelopes
- Pitch envelopes
- Parameter automation

## Sequencer

Creates stepped patterns with multiple values.

**Steps**: 1-64 steps (configurable)  
**API**: [Sequencer](/api/cv/sequencer)

```tsx
<Clock output={clock} bpm={120}>
  {({ start }) => <button onClick={start}>Start</button>}
</Clock>
<Sequencer
  output={ref}
  clock={clock}
  steps={[0, 2, 4, 6].map((index) => ({
    active: true,
    value: index / 8,
    lengthPct: 80,
    slide: false,
    accent: false,
  }))}
/>
```

**Common uses**:
- Melodic sequences
- Rhythmic patterns
- Parameter stepping
- Gating patterns

## Clock

Provides timing/tempo synchronization.

**BPM**: 20-300 BPM  
**API**: [Clock](/api/cv/clock)

```tsx
<Clock output={ref} bpm={120} />
```

**Common uses**:
- Syncing LFOs
- Syncing sequencers
- Master tempo control
- Rhythmic modulation

## Usage Examples

### Filter Sweep with LFO
```tsx
const audio = useModStream();
const lfo = useModStream();
const output = useModStream();

<ToneGenerator output={audio} frequency={110} />
<LFO output={lfo} frequency={0.5} waveform="sine" />
<Filter
  input={audio}
  output={output}
  cv={lfo}
  cvAmount={5000}
/>
```

### Envelope-Controlled Filter
```tsx
const audio = useModStream();
const env = useModStream();
const output = useModStream();

<NoiseGenerator output={audio} />
<ADSR output={env} attack={0.01} decay={0.1} sustain={0} release={0.2} />
<Filter
  input={audio}
  output={output}
  cv={env}
  cvAmount={8000}
/>
```

### Sequenced Melody
```tsx
const seq = useModStream();
const clock = useModStream();
const tone = useModStream();

<Clock output={clock}>
  {({ start }) => <button onClick={start}>Start</button>}
</Clock>
<Sequencer
  output={seq}
  clock={clock}
  steps={[0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25].map((value) => ({
    active: value > 0,
    value,
    lengthPct: 80,
    slide: false,
    accent: false,
  }))}
/>
<ToneGenerator
  output={tone}
  cv={seq}
  cvAmount={880}
  frequency={220}
/>
```

## Next Steps

- Learn about [CV Modulation](/guide/cv-modulation)
- Explore [Processors](/guide/processors)
- Build [LFO Modulation example](/guide/examples/lfo-modulation)
