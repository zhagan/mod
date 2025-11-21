# CV Generators

CV (Control Voltage) generators produce modulation signals to dynamically control parameters of other modules.

## LFO (Low Frequency Oscillator)

Creates cyclic modulation at sub-audio and audio rates.

**Rate**: 0.01 Hz - 20 Hz (or higher)  
**Waveforms**: Sine, triangle, square, sawtooth  
**API**: [LFO](/api/cv/lfo)

```tsx
<LFO output={ref} rate={2} waveform="sine" depth={1} />
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
<Sequencer output={ref} steps={[1, 0, 0.5, 0, 0.7, 0, 1, 0]} bpm={120}>
  {({ isPlaying, play, stop }) => (
    <button onClick={isPlaying ? stop : play}>
      {isPlaying ? 'Stop' : 'Play'}
    </button>
  )}
</Sequencer>
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
<LFO output={lfo} rate={0.5} waveform="sine" />
<Filter
  input={audio}
  output={output}
  cvInput={lfo}
  cvTarget="frequency"
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
  cvInput={env}
  cvTarget="frequency"
  cvAmount={8000}
/>
```

### Sequenced Melody
```tsx
const seq = useModStream();
const tone = useModStream();

<Sequencer output={seq} steps={[0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25]} />
<ToneGenerator
  output={tone}
  cvInput={seq}
  cvTarget="frequency"
  cvAmount={880}
  frequency={220}
/>
```

## Next Steps

- Learn about [CV Modulation](/guide/cv-modulation)
- Explore [Processors](/guide/processors)
- Build [LFO Modulation example](/guide/examples/lfo-modulation)
