---
layout: doc
title: Building mod Apps with AI Assistants
---

# Building mod Apps with AI Assistants

This guide helps AI assistants (LLMs) effectively build audio applications using mod. If you're an AI helping a user build a mod app, this page provides everything you need.

## Quick Start

mod is a React library for building modular audio applications using the Web Audio API. Components represent audio modules that you connect together like a modular synthesizer.

### Basic Template

```tsx
import { AudioProvider, ToneGenerator, Monitor, useModStream } from '@mode-7/mod';

function App() {
  const audio = useModStream();

  return (
    <AudioProvider>
      <ToneGenerator output={audio} frequency={440} type="sine" gain={0.5} />
      <Monitor input={audio} />
    </AudioProvider>
  );
}
```

## Essential Rules

1. **Always wrap in AudioProvider** - All mod components must be inside `<AudioProvider>`
2. **Use useModStream for connections** - Create refs with `const ref = useModStream()`
3. **Every chain needs Monitor** - Audio won't play without `<Monitor input={ref} />`
4. **Import from @mode-7/mod** - All components come from this package
5. **Sources → Processors → Monitor** - Signal flows through connected refs

## Component Categories

### Sources (Audio Generators)
Generate or input audio signals. Have `output` prop only.

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| [ToneGenerator](/api/sources/tone-generator) | Pure tones | frequency, type (sine/square/sawtooth/triangle), gain |
| [NoiseGenerator](/api/sources/noise-generator) | Noise | type (white/pink/brown), gain |
| [Microphone](/api/sources/microphone) | Mic input | gain |
| [MP3Deck](/api/sources/mp3-deck) | Audio files | src, loop, gain |
| [StreamingAudioDeck](/api/sources/streaming-audio-deck) | Streaming audio | url, loop, gain |

### CV Generators (Modulation)
Generate control voltage signals. Have `output` prop, connect to `cvInput` of processors.

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| [LFO](/api/cv/lfo) | Cyclic modulation | rate (Hz), waveform, depth |
| [ADSR](/api/cv/adsr) | Envelopes | attack, decay, sustain, release |
| [Sequencer](/api/cv/sequencer) | Step patterns | steps (array), bpm |
| [Clock](/api/cv/clock) | Tempo sync | bpm |

### Processors (Effects)
Transform audio. Have `input` and `output` props. Can have `cvInput` for modulation.

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| [Filter](/api/processors/filter) | Frequency filtering | type, frequency, Q, cvInput, cvTarget, cvAmount |
| [Delay](/api/processors/delay) | Echo | delayTime, feedback, mix |
| [Reverb](/api/processors/reverb) | Spatial reverb | roomSize, damping, mix |
| [Distortion](/api/processors/distortion) | Distortion/overdrive | drive, type |
| [Compressor](/api/processors/compressor) | Dynamics | threshold, ratio, attack, release |
| [Tremolo](/api/processors/tremolo) | Amplitude modulation | rate, depth |
| [Chorus](/api/processors/chorus) | Chorus | rate, depth, delay |
| [Phaser](/api/processors/phaser) | Phase shifting | rate, depth, stages |
| [Flanger](/api/processors/flanger) | Flanging | rate, depth, feedback |
| [Panner](/api/processors/panner) | Stereo panning | pan (-1 to 1) |
| [EQ](/api/processors/eq) | Equalization | lowGain, midGain, highGain |
| [BitCrusher](/api/processors/bitcrusher) | Lo-fi degradation | bits, sampleRate |
| [Limiter](/api/processors/limiter) | Peak limiting | threshold |
| [Gate](/api/processors/gate) | Noise gate | threshold |
| [AutoWah](/api/processors/autowah) | Auto-wah | baseFrequency, sensitivity |
| [RingModulator](/api/processors/ringmodulator) | Ring modulation | frequency |
| [VCA](/api/processors/vca) | Voltage controlled amp | gain, cv, cvAmount |

### Mixers
Combine multiple signals. Have multiple inputs, one output.

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| [Mixer](/api/mixers/mixer) | Mix N channels | inputs (array of refs) |
| [CrossFade](/api/mixers/crossfade) | Blend two sources | inputA, inputB, position (0-1), mode |

### Output
Send to speakers. Have `input` prop only.

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| [Monitor](/api/output/monitor) | Output to speakers | gain, mute |

### Visualizations
Observe audio without affecting it. Have `input` prop.

| Component | Purpose | Render Props |
|-----------|---------|--------------|
| [Oscilloscope](/api/visualizations/oscilloscope) | Waveform | dataArray, bufferLength |
| [SpectrumAnalyzer](/api/visualizations/spectrum-analyzer) | Frequency spectrum | dataArray, bufferLength |
| [LevelMeter](/api/visualizations/level-meter) | Audio levels | level, peak, isClipping |

### ModUI Components
Pre-styled UI controls for audio apps.

**Controls**: [Slider](/api/ui/controls/slider), [Knob](/api/ui/controls/knob), [XYPad](/api/ui/controls/xypad), [Button](/api/ui/controls/button), [Select](/api/ui/controls/select), [FilePicker](/api/ui/controls/filepicker), [TextInput](/api/ui/controls/textinput), [ProgressBar](/api/ui/controls/progressbar)

**Visualizations**: [OscilloscopeCanvas](/api/ui/visualizations/oscilloscope), [SpectrumAnalyzerCanvas](/api/ui/visualizations/spectrum-analyzer), [LevelMeterCanvas](/api/ui/visualizations/level-meter)

## Common Patterns

### 1. Basic Signal Chain
```tsx
const signal = useModStream();

<ToneGenerator output={signal} frequency={440} />
<Monitor input={signal} />
```

### 2. Source → Effect → Output
```tsx
const dry = useModStream();
const wet = useModStream();

<ToneGenerator output={dry} />
<Filter input={dry} output={wet} frequency={1000} Q={5} />
<Monitor input={wet} />
```

### 3. Multiple Effects Chain
```tsx
const source = useModStream();
const filtered = useModStream();
const delayed = useModStream();
const reverbed = useModStream();

<NoiseGenerator output={source} />
<Filter input={source} output={filtered} />
<Delay input={filtered} output={delayed} />
<Reverb input={delayed} output={reverbed} />
<Monitor input={reverbed} />
```

### 4. Mixing Multiple Sources
```tsx
const tone1 = useModStream();
const tone2 = useModStream();
const mixed = useModStream();

<ToneGenerator output={tone1} frequency={220} />
<ToneGenerator output={tone2} frequency={440} />
<Mixer inputs={[tone1, tone2]} output={mixed} />
<Monitor input={mixed} />
```

### 5. CV Modulation (LFO → Filter)
```tsx
const audio = useModStream();
const lfo = useModStream();
const filtered = useModStream();

<ToneGenerator output={audio} frequency={220} />
<LFO output={lfo} rate={2} waveform="sine" />
<Filter
  input={audio}
  output={filtered}
  frequency={1000}
  cvInput={lfo}
  cvTarget="frequency"
  cvAmount={5000}
/>
<Monitor input={filtered} />
```

### 6. Envelope-Controlled Filter
```tsx
const audio = useModStream();
const env = useModStream();
const filtered = useModStream();

<NoiseGenerator output={audio} />
<ADSR output={env} attack={0.01} decay={0.2} sustain={0.3} release={0.5}>
  {({ trigger }) => <button onClick={trigger}>Trigger</button>}
</ADSR>
<Filter
  input={audio}
  output={filtered}
  cvInput={env}
  cvTarget="frequency"
  cvAmount={8000}
/>
<Monitor input={filtered} />
```

### 7. Crossfade Between Sources
```tsx
const sourceA = useModStream();
const sourceB = useModStream();
const output = useModStream();

<ToneGenerator output={sourceA} frequency={220} />
<NoiseGenerator output={sourceB} type="white" />
<CrossFade inputA={sourceA} inputB={sourceB} output={output} position={0.5} />
<Monitor input={output} />
```

### 8. With UI Controls (Render Props)
```tsx
const audio = useModStream();

<ToneGenerator output={audio}>
  {({ frequency, setFrequency, type, setType, gain, setGain }) => (
    <div>
      <Slider value={frequency} onChange={setFrequency} min={20} max={2000} label="Frequency" />
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
      <Slider value={gain} onChange={setGain} min={0} max={1} step={0.01} label="Gain" />
    </div>
  )}
</ToneGenerator>
<Monitor input={audio} />
```

### 9. With Visualization
```tsx
const audio = useModStream();

<ToneGenerator output={audio} />

<Oscilloscope input={audio}>
  {({ dataArray, bufferLength }) => (
    <OscilloscopeCanvas dataArray={dataArray} bufferLength={bufferLength} height={150} />
  )}
</Oscilloscope>

<Monitor input={audio} />
```

### 10. Controlled Props Pattern
```tsx
const [frequency, setFrequency] = useState(440);
const [gain, setGain] = useState(0.5);
const audio = useModStream();

<ToneGenerator
  output={audio}
  frequency={frequency}
  onFrequencyChange={setFrequency}
  gain={gain}
  onGainChange={setGain}
/>
```

## Component Usage Patterns

mod components support three patterns:

### 1. Render Props (Most Common)
```tsx
<ToneGenerator output={ref}>
  {({ frequency, setFrequency, gain, setGain }) => (
    <div>
      <input value={frequency} onChange={e => setFrequency(+e.target.value)} />
    </div>
  )}
</ToneGenerator>
```

### 2. Controlled Props
```tsx
const [freq, setFreq] = useState(440);

<ToneGenerator output={ref} frequency={freq} onFrequencyChange={setFreq} />
```

### 3. Imperative Refs
```tsx
const toneRef = useRef<ToneGeneratorHandle>(null);

useEffect(() => {
  toneRef.current?.setFrequency(880);
}, []);

<ToneGenerator ref={toneRef} output={ref} />
```

## CV Modulation

Connect CV generators to processors using `cvInput`, `cvTarget`, and `cvAmount`:

```tsx
<LFO output={lfoRef} rate={5} />
<Filter
  input={audioRef}
  output={outRef}
  frequency={1000}        // Base frequency
  cvInput={lfoRef}        // CV source
  cvTarget="frequency"    // What to modulate
  cvAmount={3000}         // Modulation depth (±3000Hz)
/>
```

**Common cvTargets:**
- Filter: `frequency`, `Q`
- Processors: Check component docs for available targets

## Signal Flow Rules

1. **Sources** have `output` only
2. **Processors** have `input` AND `output`
3. **Mixers** have `inputs` (array) AND `output`
4. **Monitor** has `input` only
5. **CV generators** have `output`, connect to `cvInput` props
6. **Visualizations** have `input`, don't affect audio

## Complete Example: Simple Synthesizer

```tsx
import {
  AudioProvider,
  ToneGenerator,
  Filter,
  ADSR,
  Monitor,
  useModStream,
  Slider,
  Select,
  Button
} from '@mode-7/mod';
import { useState } from 'react';

function Synth() {
  const osc = useModStream();
  const env = useModStream();
  const filtered = useModStream();
  const [frequency, setFrequency] = useState(440);

  return (
    <AudioProvider>
      <h1>Simple Synth</h1>

      {/* Oscillator */}
      <ToneGenerator output={osc} frequency={frequency}>
        {({ type, setType, gain, setGain }) => (
          <div>
            <Slider
              value={frequency}
              onChange={setFrequency}
              min={20}
              max={2000}
              label="Frequency"
            />
            <Select
              value={type}
              onChange={setType}
              options={[
                { value: 'sine', label: 'Sine' },
                { value: 'square', label: 'Square' },
                { value: 'sawtooth', label: 'Sawtooth' },
              ]}
            />
            <Slider value={gain} onChange={setGain} min={0} max={1} label="Level" />
          </div>
        )}
      </ToneGenerator>

      {/* Envelope */}
      <ADSR output={env}>
        {({ attack, setAttack, decay, setDecay, sustain, setSustain, release, setRelease, trigger }) => (
          <div>
            <h3>Envelope</h3>
            <Button onClick={trigger}>Trigger</Button>
            <Slider value={attack} onChange={setAttack} min={0.001} max={2} label="Attack" />
            <Slider value={decay} onChange={setDecay} min={0.001} max={2} label="Decay" />
            <Slider value={sustain} onChange={setSustain} min={0} max={1} label="Sustain" />
            <Slider value={release} onChange={setRelease} min={0.001} max={5} label="Release" />
          </div>
        )}
      </ADSR>

      {/* Filter with envelope modulation */}
      <Filter
        input={osc}
        output={filtered}
        cvInput={env}
        cvTarget="frequency"
        cvAmount={8000}
      >
        {({ frequency, setFrequency, Q, setQ }) => (
          <div>
            <h3>Filter</h3>
            <Slider value={frequency} onChange={setFrequency} min={20} max={20000} label="Cutoff" />
            <Slider value={Q} onChange={setQ} min={0.1} max={30} label="Resonance" />
          </div>
        )}
      </Filter>

      {/* Output */}
      <Monitor input={filtered}>
        {({ gain, setGain, isMuted, setMuted }) => (
          <div>
            <Slider value={gain} onChange={setGain} min={0} max={1} label="Master" />
            <Button active={isMuted} onClick={() => setMuted(!isMuted)}>
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
          </div>
        )}
      </Monitor>
    </AudioProvider>
  );
}
```

## Troubleshooting

### No Audio Output
- ✅ Check AudioProvider wraps all components
- ✅ Check Monitor is connected
- ✅ Check browser autoplay policy (user must interact first)
- ✅ Check volume/gain settings

### TypeScript Errors
- ✅ Import types: `import type { ModStreamRef } from '@mode-7/mod'`
- ✅ Use component-specific Handle types for refs

### Connection Errors
- ✅ Sources connect to `input` props
- ✅ Processors output to other processors' `input`
- ✅ Always end with Monitor
- ✅ CV generators connect to `cvInput`, not `input`

## Documentation Links

- **Getting Started**: [/guide/getting-started](/guide/getting-started)
- **Architecture**: [/guide/architecture](/guide/architecture)
- **Audio Context**: [/guide/audio-context](/guide/audio-context)
- **Connecting Modules**: [/guide/connecting-modules](/guide/connecting-modules)
- **CV Modulation**: [/guide/cv-modulation](/guide/cv-modulation)
- **API Reference**: [/api/overview](/api/overview)
- **Examples**: [/guide/examples/simple-synth](/guide/examples/simple-synth)

## Quick Reference Card

```tsx
// Install
npm install @mode-7/mod

// Import
import {
  AudioProvider,
  ToneGenerator,
  Filter,
  Monitor,
  useModStream
} from '@mode-7/mod';

// Create connections
const ref = useModStream();

// Basic structure
<AudioProvider>
  <Source output={ref1} />
  <Processor input={ref1} output={ref2} />
  <Monitor input={ref2} />
</AudioProvider>

// Modulation
<CVGenerator output={cvRef} />
<Processor cvInput={cvRef} cvTarget="paramName" cvAmount={100} />
```

---

**For more details, explore the full documentation at [/guide/getting-started](/guide/getting-started)**
