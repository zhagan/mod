# Architecture

Understanding mod's architecture will help you build complex audio applications efficiently. This guide covers the core concepts and design patterns that make mod work.

## System Overview

mod is built on three foundational layers:

```
┌─────────────────────────────────────┐
│      React Components (UI)          │
│  Render Props, Controlled Props     │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│      mod Components (Logic)          │
│  Audio Routing, State Management    │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│     Web Audio API (Processing)      │
│  AudioNodes, AudioContext           │
└─────────────────────────────────────┘
```

## The AudioProvider

The `AudioProvider` is the foundation of every mod application. It creates and manages the Web Audio API's AudioContext:

```tsx
<AudioProvider>
  {/* All audio modules go here */}
</AudioProvider>
```

### What it does:

- Creates a single AudioContext for the entire application
- Manages context lifecycle (initialization, suspension, resumption)
- Provides the context to all child components via React Context
- Ensures proper cleanup on unmount

### Context State

The AudioContext can be in three states:

- **suspended** - Initial state, not producing audio
- **running** - Actively processing audio
- **closed** - Shut down, cannot be restarted

Most browsers require user interaction before the AudioContext can start, so the first audio action (like playing a tone) will resume the context automatically.

## Module Types

mod components are organized into five categories:

### 1. Sources

Components that generate or input audio signals:

```tsx
<ToneGenerator output={ref} />      // Oscillator
<NoiseGenerator output={ref} />     // Noise
<Microphone output={ref} />         // Microphone input
<MP3Deck output={ref} />            // Audio file playback
<StreamingAudioDeck output={ref} /> // Streaming audio
```

**Characteristics:**
- Have an `output` prop (ModStreamRef)
- Produce audio signals
- No audio input

### 2. CV Generators

Components that generate control voltage signals for modulation:

```tsx
<LFO output={ref} />       // Low-frequency oscillator
<ADSR output={ref} />      // Envelope generator
<Clock output={ref} />     // Timing/tempo clock
<Sequencer output={ref} clock={clockRef} /> // Step sequencer (clock-driven)
```

**Characteristics:**
- Have an `output` prop (ModStreamRef)
- Produce modulation signals (not audible audio)
- Used to control parameters via `cv` props

### 3. Processors

Components that transform audio signals:

```tsx
<Filter input={ref1} output={ref2} />
<Delay input={ref1} output={ref2} />
<Reverb input={ref1} output={ref2} />
<Distortion input={ref1} output={ref2} />
```

**Characteristics:**
- Have both `input` and `output` props
- Transform the incoming signal
- Can be chained together

### 4. Mixers

Components that combine multiple signals:

```tsx
<Mixer inputs={[ref1, ref2, ref3]} output={outputRef} />
<CrossFade inputA={ref1} inputB={ref2} output={outputRef} />
```

**Characteristics:**
- Have multiple inputs and one output
- Combine signals through mixing, crossfading, etc.

### 5. Output

Components that send audio to speakers:

```tsx
<Monitor input={ref} />
```

**Characteristics:**
- Have an `input` prop only
- Connect to the AudioContext destination (speakers)
- Usually the final module in a signal chain

## Signal Flow

Audio flows through your application using refs:

```tsx
function SimpleChain() {
  const step1 = useModStream(); // Source output
  const step2 = useModStream(); // Processor output

  return (
    <>
      <ToneGenerator output={step1} />
      <Filter input={step1} output={step2} />
      <Monitor input={step2} />
    </>
  );
}
```

This creates the signal flow: ToneGenerator → Filter → Monitor → Speakers

### ModStreamRef

The `ModStreamRef` type is a React ref that holds audio node information:

```typescript
interface ModStream {
  audioNode: AudioNode;
  gain: GainNode;
  context: AudioContext;
  metadata: {
    label: string;
    sourceType?: string;
  };
}

type ModStreamRef = React.RefObject<ModStream | null>;
```

Use the `useModStream()` hook to create these refs:

```tsx
import { useModStream } from '@mode-7/mod';

const myStream = useModStream();
```

## Component Patterns

### Headless Components

All mod components are "headless" - they handle audio logic but don't render any UI by default. You control the UI using three patterns:

#### 1. Render Props

```tsx
<ToneGenerator output={ref}>
  {({ frequency, setFrequency, gain, setGain }) => (
    <div>
      <input value={frequency} onChange={e => setFrequency(+e.target.value)} />
    </div>
  )}
</ToneGenerator>
```

#### 2. Controlled Props

```tsx
const [freq, setFreq] = useState(440);

<ToneGenerator
  output={ref}
  frequency={freq}
  onFrequencyChange={setFreq}
/>
```

#### 3. Imperative Refs

```tsx
const toneRef = useRef<ToneGeneratorHandle>(null);

// Later:
toneRef.current?.setFrequency(880);
```

### Lifecycle Management

mod components handle Web Audio node lifecycle automatically:

1. **Mount**: Create audio nodes, connect them
2. **Update**: Update node parameters when props change
3. **Unmount**: Disconnect and clean up nodes

You don't need to manually manage AudioNode creation or cleanup.

## State Management

### Internal State

Each mod component manages its own audio parameter state internally by default:

```tsx
// Component manages its own frequency and gain
<ToneGenerator output={ref} />
```

### External State

Use controlled props to lift state to parent components:

```tsx
const [frequency, setFrequency] = useState(440);

<ToneGenerator
  output={ref}
  frequency={frequency}
  onFrequencyChange={setFrequency}
/>
```

This allows:
- Sharing state between components
- Persisting state to localStorage/URLs
- Connecting to external state managers (Redux, Zustand, etc.)

### CV Modulation State

CV modulation is one-way and automatic:

```tsx
<LFO output={lfoRef} />
```

The LFO's output automatically modulates the filter's frequency. No manual state management needed.

## Performance Considerations

### Audio Thread vs. UI Thread

The Web Audio API runs on a separate high-priority audio thread, isolated from React's rendering:

- **Audio processing**: Happens in real-time on the audio thread
- **Parameter changes**: Scheduled from UI thread, executed on audio thread
- **React updates**: Don't block audio processing

This means your UI can drop frames without affecting audio quality.

### Component Updates

mod uses React's reconciliation efficiently:

- Parameter changes use `AudioParam.setValueAtTime()` for smooth transitions
- Only changed parameters are updated
- Audio node graphs remain stable across re-renders

### Memory Management

Audio nodes are automatically cleaned up when components unmount. However:

- Blob URLs for audio files must be manually revoked
- Large audio buffers should be cleared when not needed
- Analyser nodes running at 60fps can impact performance

## Next Steps

- Learn about [connecting modules](/guide/connecting-modules)
- Understand [CV modulation](/guide/cv-modulation)
- Explore specific [module types](/guide/sources)
