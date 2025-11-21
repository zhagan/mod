# MOD

<p align="center">
  <img src="./packages/demo/assets/logo.png" alt="MOD logo" width="120">
</p>

<p align="center">
  <strong>Modular Web Audio Components for React</strong>
</p>

<p align="center">
  Build synthesizers, effects processors, drum machines, and generative music apps with composable React components
</p>

<p align="center">
  <a href="https://mode7labs.github.io/mod">Documentation</a> •
  <a href="https://mode7labs.github.io/mod/playground">Playground</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#examples">Examples</a>
</p>

---

## What is MOD?

**MOD** brings the philosophy of **hardware modular synthesizers** to React. Instead of wrestling with the low-level Web Audio API or being constrained by opinionated libraries, MOD gives you composable building blocks that snap together just like modules in a modular synth rack.

```tsx
// A complete synthesizer in 10 lines
<AudioProvider>
  <Sequencer output={seq} gateOutput={gate} bpm={120} />
  <ADSR gate={gate} output={env} attack={0.01} decay={0.3} sustain={0.5} release={0.5} />
  <ToneGenerator output={tone} cv={seq} frequency={220} />
  <Filter input={tone} output={filtered} type="lowpass" frequency={800} />
  <VCA input={filtered} output={vca} cv={env} gain={0} />
  <Delay input={vca} output={delayed} time={0.375} feedback={0.4} />
  <Reverb input={delayed} output={final} />
  <Monitor input={final} />
</AudioProvider>
```

That's a complete **step sequencer → envelope → oscillator → filter → VCA → delay → reverb** signal chain. No imperative code, no manual node management, just React components.

## Why MOD?

### 🎛️ Modular Synthesis Paradigm

MOD mirrors hardware modular synthesizers:
- **Components are modules** (oscillators, filters, envelopes, effects)
- **Refs are patch cables** (connect outputs to inputs)
- **CV props are modulation** (LFOs and envelopes control parameters)
- **Signal flow is visual** (your JSX mirrors your audio graph)

### 🔌 Three Usage Patterns

Choose the right approach for each use case:

**1. Render Props** - Build custom UIs
```tsx
<ToneGenerator output={ref}>
  {({ frequency, setFrequency }) => (
    <Slider value={frequency} onChange={setFrequency} />
  )}
</ToneGenerator>
```

**2. Controlled Props** - External state management
```tsx
const [freq, setFreq] = useState(440);
<ToneGenerator output={ref} frequency={freq} onFrequencyChange={setFreq} />
```

**3. Imperative Refs** - Programmatic control
```tsx
const ref = useRef<ToneGeneratorHandle>(null);
// Later: ref.current?.setFrequency(880);
```

### ⚡ CV Modulation System

Hardware-inspired control voltage routing:

```tsx
<LFO output={lfo} frequency={3} />
<Filter input={audio} output={out} cv={lfo} cvAmount={5000} />
// LFO sweeps filter cutoff ±5000Hz
```

Connect any CV source (LFO, ADSR, Sequencer) to any parameter for dynamic, audio-rate modulation.

### 🎨 Headless Components

Complete UI control - build with anything:
- Native HTML inputs
- **ModUI** (included) - Pre-built audio controls (Knob, Slider, XYPad)
- Your component library (Material-UI, Chakra, etc.)
- Mobile, desktop, web, anywhere React runs

### 🔥 Developer Experience

- **TypeScript-first** - Comprehensive types for everything
- **Zero dependencies** - Core library has no external deps
- **React-native** - Built FOR React, not adapted to it
- **Automatic cleanup** - No memory leaks or manual lifecycle
- **Hot module reload** - Changes reflect instantly during development

## Installation

```bash
npm install @mode-7/mod
```

## Quick Start

### Simple Synthesizer

```tsx
import { AudioProvider, ToneGenerator, Monitor, useModStream } from '@mode-7/mod';

function Synth() {
  const tone = useModStream();

  return (
    <AudioProvider>
      <ToneGenerator output={tone} frequency={440} />
      <Monitor input={tone} />
    </AudioProvider>
  );
}
```

### With Modulation

```tsx
import { LFO, ToneGenerator, Monitor, useModStream } from '@mode-7/mod';

function ModulatedSynth() {
  const lfo = useModStream();
  const tone = useModStream();

  return (
    <AudioProvider>
      <LFO output={lfo} frequency={5} />
      <ToneGenerator output={tone} frequency={440} cv={lfo} cvAmount={100} />
      <Monitor input={tone} />
    </AudioProvider>
  );
}
```

### With UI Controls

```tsx
import { ToneGenerator, Monitor, Slider } from '@mode-7/mod';

function InteractiveSynth() {
  const tone = useModStream();

  return (
    <AudioProvider>
      <ToneGenerator output={tone}>
        {({ frequency, setFrequency }) => (
          <Slider
            label="Frequency"
            value={frequency}
            onChange={setFrequency}
            min={20}
            max={2000}
          />
        )}
      </ToneGenerator>
      <Monitor input={tone} />
    </AudioProvider>
  );
}
```

## Components Library

### 🎵 Sources (5)
Generate or capture audio
- **ToneGenerator** - Oscillator (sine, square, sawtooth, triangle)
- **NoiseGenerator** - White and pink noise
- **Microphone** - Live audio input
- **MP3Deck** - Audio file playback
- **StreamingAudioDeck** - Stream from URLs

### 📈 CV Generators (4)
Control voltage for modulation
- **LFO** - Low-frequency oscillator (0.01-20Hz)
- **ADSR** - Attack-Decay-Sustain-Release envelope
- **Sequencer** - Step sequencer with CV and gate outputs
- **Clock** - Tempo sync and gate triggers

### 🎚️ Processors (16)
Transform audio signals

**Filters & EQ:**
- **Filter** - Multi-mode filter (8 types) with CV modulation
- **EQ** - 3-band parametric EQ
- **AutoWah** - Envelope-following filter

**Time-Based:**
- **Delay** - Echo with feedback
- **Reverb** - Convolution reverb

**Modulation:**
- **Chorus** - Thick, wide chorus
- **Flanger** - Sweeping comb filter
- **Phaser** - Phase-shifting modulation
- **Tremolo** - Amplitude modulation
- **RingModulator** - Metallic ring mod

**Dynamics:**
- **Compressor** - Dynamic range compression
- **Limiter** - Peak limiting
- **Gate** - Noise gate
- **VCA** - Voltage controlled amplifier

**Distortion:**
- **Distortion** - Waveshaping distortion
- **BitCrusher** - Lo-fi degradation

**Spatial:**
- **Panner** - Stereo panning with CV

### 🎛️ Mixers (2)
Combine signals
- **Mixer** - 4-channel mixer
- **CrossFade** - Crossfade between two inputs

### 🔊 Output (1)
- **Monitor** - Audio output with device selection

### 📊 Visualizations (3)
Real-time analysis
- **Oscilloscope** - Waveform display
- **SpectrumAnalyzer** - Frequency spectrum
- **LevelMeter** - Audio level metering

### 🎨 ModUI Components (11)
Pre-built audio controls

**Controls:**
- **Slider** - Range slider with +/- buttons
- **Knob** - Rotary control (270° rotation)
- **XYPad** - 2D control surface
- **Button** - Customizable button
- **Select** - Dropdown selector
- **TextInput** - Text input field
- **FilePicker** - File selection
- **ProgressBar** - Progress/scrub bar

**Visualizations:**
- **OscilloscopeCanvas** - Waveform renderer
- **SpectrumAnalyzerCanvas** - Spectrum renderer
- **LevelMeterCanvas** - Level meter renderer

## Examples

### Drum Machine

```tsx
function DrumMachine() {
  const clock = useModStream();
  const kickSeq = useModStream();
  const kickGate = useModStream();
  const kickEnv = useModStream();
  const kick = useModStream();

  return (
    <AudioProvider>
      {/* Tempo control */}
      <Clock output={clock} bpm={120} />

      {/* Kick drum */}
      <Sequencer output={kickSeq} gateOutput={kickGate} steps={[1,0,0,0, 1,0,0,0]} />
      <ToneGenerator output={kick} frequency={60} cv={kickSeq} />
      <ADSR gate={kickGate} output={kickEnv} attack={0.001} decay={0.3} sustain={0} />
      <VCA input={kick} output={kick} cv={kickEnv} />

      <Monitor input={kick} />
    </AudioProvider>
  );
}
```

### Effects Processor

```tsx
function EffectsChain() {
  const input = useModStream();
  const filtered = useModStream();
  const compressed = useModStream();
  const delayed = useModStream();
  const output = useModStream();

  return (
    <AudioProvider>
      <Microphone output={input} />
      <Filter input={input} output={filtered} type="lowpass" frequency={1000} />
      <Compressor input={filtered} output={compressed} threshold={-20} ratio={4} />
      <Delay input={compressed} output={delayed} time={0.25} feedback={0.3} />
      <Reverb input={delayed} output={output} />
      <Monitor input={output} />
    </AudioProvider>
  );
}
```

### Generative Ambient

```tsx
function AmbientGenerator() {
  const lfo1 = useModStream();
  const lfo2 = useModStream();
  const osc1 = useModStream();
  const osc2 = useModStream();
  const mixed = useModStream();
  const filtered = useModStream();
  const output = useModStream();

  return (
    <AudioProvider>
      {/* Slow-moving LFOs */}
      <LFO output={lfo1} frequency={0.1} />
      <LFO output={lfo2} frequency={0.07} />

      {/* Two oscillators with LFO modulation */}
      <ToneGenerator output={osc1} frequency={220} cv={lfo1} cvAmount={50} />
      <ToneGenerator output={osc2} frequency={330} cv={lfo2} cvAmount={75} />

      {/* Mix and process */}
      <Mixer inputs={[osc1, osc2]} output={mixed} levels={[0.5, 0.5]} />
      <Filter input={mixed} output={filtered} type="lowpass" cv={lfo1} cvAmount={2000} />
      <Reverb input={filtered} output={output} decay={5} />

      <Monitor input={output} />
    </AudioProvider>
  );
}
```

## Use Cases

**Perfect for building:**
- 🎹 Synthesizers and virtual instruments
- 🥁 Drum machines and samplers
- 🎸 Guitar pedal emulators and effect chains
- 🎼 Generative music and algorithmic composition
- 📚 Educational tools for teaching audio/synthesis
- 🎮 Game audio engines
- 🎨 Audio-reactive visualizations
- 🔧 Browser-based DAWs and production tools

## How It Compares

### vs Raw Web Audio API

**Web Audio API:**
```typescript
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();
const filter = audioContext.createBiquadFilter();
oscillator.connect(gainNode);
gainNode.connect(filter);
filter.connect(audioContext.destination);
oscillator.start();
// Manual cleanup, state sync, lifecycle management...
```

**MOD:**
```tsx
<AudioProvider>
  <ToneGenerator output={tone} />
  <Filter input={tone} output={filtered} />
  <Monitor input={filtered} />
</AudioProvider>
```

MOD abstracts the complexity while maintaining full control.

### vs Tone.js

**Tone.js** is excellent for music-focused apps with built-in instruments and a transport system.

**MOD** excels at:
- React-native integration (built FOR React)
- Complete UI control (headless components)
- Modular synthesis paradigm (CV routing)
- Three flexible usage patterns
- Granular control when needed

Choose **Tone.js** for music theory utilities and built-in instruments.
Choose **MOD** for React apps, custom UIs, and modular synthesis.

## Architecture

MOD follows a **signal-flow architecture**:

1. **Sources** generate audio (oscillators, noise, microphone, files)
2. **CV Generators** produce control signals (LFO, envelopes, sequencers)
3. **Processors** transform audio (filters, effects, dynamics)
4. **Mixers** combine multiple signals
5. **Output** sends to speakers/headphones
6. **Visualizations** observe signals (non-destructive)

Connect modules using refs:
```tsx
const stream = useModStream(); // Creates a connection point
<Source output={stream} />     // Outputs to stream
<Processor input={stream} />   // Reads from stream
```

Modulate parameters using CV:
```tsx
<LFO output={lfo} />
<Filter input={audio} cv={lfo} cvAmount={5000} />
```

## Documentation

**Full documentation:** [mode7labs.github.io/mod](https://mode7labs.github.io/mod)

- [Getting Started](https://mode7labs.github.io/mod/guide/getting-started)
- [Architecture](https://mode7labs.github.io/mod/guide/architecture)
- [CV Modulation](https://mode7labs.github.io/mod/guide/cv-modulation)
- [API Reference](https://mode7labs.github.io/mod/api/overview)
- [Playground](https://mode7labs.github.io/mod/playground) - Interactive examples

## Browser Support

- Chrome 35+
- Firefox 25+
- Safari 14.1+
- Edge 79+

Any browser with Web Audio API support.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Check out [CONTRIBUTORS.md](./CONTRIBUTORS.md) for planned features and future work.

## License

MIT License - see [LICENSE](./LICENSE)

## Acknowledgments

Built with ❤️ for the Web Audio community.

Inspired by hardware modular synthesizers and the creative possibilities of React.

---

<p align="center">
  <strong>Ready to build something amazing?</strong>
</p>

<p align="center">
  <a href="https://mode7labs.github.io/mod/playground">Try the Playground</a> •
  <a href="https://mode7labs.github.io/mod/guide/getting-started">Read the Docs</a> •
  <a href="https://github.com/Mode7Labs/mod/issues">Report Issues</a>
</p>
