---
layout: home

hero:
  name: MOD
  text: Modular Web Audio
  tagline: Build synthesizers, effects processors, and generative music apps with composable React components
  image:
    src: /logo.png
    alt: MOD logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Try Playground
      link: /playground/
    - theme: alt
      text: View on GitHub
      link: https://github.com/Mode7Labs/mod

features:
  - icon: 🎛️
    title: Modular Synthesis Paradigm
    details: Components mirror hardware modular synthesizers - oscillators, filters, envelopes, and effects that connect like patch cables. Your JSX becomes your signal flow.

  - icon: 🔌
    title: Three Usage Patterns
    details: Choose render props for custom UIs, controlled props for external state, or imperative refs for programmatic control. Use the right pattern for each component.

  - icon: ⚡
    title: CV Modulation System
    details: Hardware-inspired control voltage routing. Connect LFOs and envelopes to any parameter for dynamic, audio-rate modulation - just like real modular gear.

  - icon: 🎨
    title: Headless Components
    details: Complete UI control. Build with ModUI (included), native HTML, Material-UI, Chakra, or any component library. Mobile, desktop, web - anywhere React runs.

  - icon: 🔥
    title: Developer Experience
    details: TypeScript-first with zero dependencies. Automatic cleanup, hot module reload, and React-native architecture. Built FOR React, not adapted to it.

  - icon: 📊
    title: 42 Components Ready
    details: 5 audio sources, 4 CV generators, 16 processors, 2 mixers, 3 visualizations, and 11 pre-built UI controls. Everything you need out of the box.
---

## Quick Example

```tsx
// A complete synthesizer in 10 lines
import { AudioProvider, Sequencer, ADSR, ToneGenerator, Filter, VCA, Delay, Reverb, Monitor, useModStream } from '@mode-7/mod';

function Synth() {
  const seq = useModStream(), gate = useModStream(), env = useModStream();
  const tone = useModStream(), filtered = useModStream(), vca = useModStream();
  const delayed = useModStream(), final = useModStream();

  return (
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
  );
}
```

That's a complete **step sequencer → envelope → oscillator → filter → VCA → delay → reverb** signal chain. No imperative code, no manual node management, just React components.

## Installation

```bash
npm install @mode-7/mod
```

## Why MOD?

### 🎯 Declarative Over Imperative

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

### 🔧 React-Native Architecture

Built **FOR** React, not adapted to it:
- Automatic lifecycle management (no memory leaks)
- Hot module reload support
- Component composition patterns
- TypeScript-first design
- Zero external dependencies in core

### 🎚️ Complete UI Flexibility

Unlike opinionated libraries, MOD is **headless**:

**Render Props Pattern:**
```tsx
<ToneGenerator output={ref}>
  {({ frequency, setFrequency }) => (
    <Slider value={frequency} onChange={setFrequency} />
  )}
</ToneGenerator>
```

**Controlled Props Pattern:**
```tsx
const [freq, setFreq] = useState(440);
<ToneGenerator output={ref} frequency={freq} onFrequencyChange={setFreq} />
```

**Imperative Refs:**
```tsx
const ref = useRef<ToneGeneratorHandle>(null);
// Later: ref.current?.setFrequency(880);
```

Use **ModUI** (included), native HTML, or your favorite component library.

### ⚡ Hardware-Inspired CV Modulation

```tsx
<LFO output={lfo} frequency={3} />
<Filter input={audio} output={out} cv={lfo} cvAmount={5000} />
// LFO sweeps filter cutoff ±5000Hz
```

Connect any CV source (LFO, ADSR, Sequencer) to any parameter for dynamic, audio-rate modulation - just like patching hardware modular gear.

## Component Library

### 🎵 **5 Audio Sources**
Generate or capture audio
- **ToneGenerator** - Oscillator (sine, square, sawtooth, triangle)
- **NoiseGenerator** - White and pink noise
- **Microphone** - Live audio input
- **MP3Deck** - Audio file playback
- **StreamingAudioDeck** - Stream from URLs

### 📈 **4 CV Generators**
Control voltage for modulation
- **LFO** - Low-frequency oscillator (0.01-20Hz)
- **ADSR** - Attack-Decay-Sustain-Release envelope
- **Sequencer** - Step sequencer with CV and gate outputs
- **Clock** - Tempo sync and gate triggers

### 🎚️ **16 Processors**
Transform audio signals
- **Filters & EQ:** Filter (8 types), EQ (3-band), AutoWah
- **Time-Based:** Delay, Reverb
- **Modulation:** Chorus, Flanger, Phaser, Tremolo, RingModulator
- **Dynamics:** Compressor, Limiter, Gate, VCA
- **Distortion:** Distortion, BitCrusher
- **Spatial:** Panner (stereo with CV)

### 🎛️ **2 Mixers** • **1 Output** • **3 Visualizations** • **11 UI Components**
Everything you need to build complete audio applications.

[View Full Component Reference →](/api/overview)

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

## Real-World Examples

### Drum Machine
```tsx
function DrumMachine() {
  const clock = useModStream(), kickSeq = useModStream(), kickGate = useModStream();
  const kickEnv = useModStream(), kick = useModStream();

  return (
    <AudioProvider>
      <Clock output={clock} bpm={120} />
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
  const input = useModStream(), filtered = useModStream(), compressed = useModStream();
  const delayed = useModStream(), output = useModStream();

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
  const lfo1 = useModStream(), lfo2 = useModStream();
  const osc1 = useModStream(), osc2 = useModStream();
  const mixed = useModStream(), filtered = useModStream(), output = useModStream();

  return (
    <AudioProvider>
      <LFO output={lfo1} frequency={0.1} />
      <LFO output={lfo2} frequency={0.07} />
      <ToneGenerator output={osc1} frequency={220} cv={lfo1} cvAmount={50} />
      <ToneGenerator output={osc2} frequency={330} cv={lfo2} cvAmount={75} />
      <Mixer inputs={[osc1, osc2]} output={mixed} levels={[0.5, 0.5]} />
      <Filter input={mixed} output={filtered} type="lowpass" cv={lfo1} cvAmount={2000} />
      <Reverb input={filtered} output={output} decay={5} />
      <Monitor input={output} />
    </AudioProvider>
  );
}
```

## Build with AI Assistants

MOD is designed to work seamlessly with AI coding assistants like Claude, ChatGPT, and Copilot. Our comprehensive documentation makes it easy for LLMs to generate working audio applications.

**Get started with an AI assistant:**

::: code-group
```bash [Claude Code]
# In Claude Code, reference the LLM guide:
@https://mode7labs.github.io/mod/llm-guide

# Then ask to build anything:
"Build me a synthesizer with an LFO-modulated filter"
"Create a drum machine with a step sequencer"
"Make an effects processor with reverb and delay"
```

```bash [Claude Desktop]
# In Claude Desktop, start with:
Read https://mode7labs.github.io/mod/llm-guide

# Then describe what you want:
"Build a simple synth with envelope control"
"Create a mixer with multiple channels"
```

```bash [Chat]
# In any AI chat:
Based on the mod documentation at mode7labs.github.io/mod,
create an audio visualizer with oscilloscope and spectrum analyzer
```
:::

Our [LLM Guide](/llm-guide) includes:
- Complete component reference with props
- 10+ common patterns with working code
- Signal flow examples
- Troubleshooting tips
- Full synthesizer example

## How It Compares

### vs Web Audio API
**Web Audio API** requires manual node management, imperative connections, and lifecycle handling.

**MOD** provides declarative components with automatic cleanup and React integration.

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

## Browser Support

- Chrome 35+
- Firefox 25+
- Safari 14.1+
- Edge 79+

Any browser with Web Audio API support.

## Ready to dive in?

<div class="vp-doc" style="margin-top: 2rem;">
  <a href="/guide/getting-started" class="vp-button brand" style="margin-right: 1rem;">Get Started</a>
  <a href="/playground/" class="vp-button brand" style="margin-right: 1rem;">Try Playground</a>
  <a href="/api/overview" class="vp-button alt">API Reference</a>
</div>
