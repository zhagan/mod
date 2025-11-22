# useModStream

The `useModStream` hook creates a reference for connecting audio modules together. It's the fundamental building block for routing audio in mod.

## Usage

```typescript
const streamRef = useModStream(label?);
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | `string` | `undefined` | Optional label for debugging purposes |

## Returns

Returns a `ModStreamRef` that can be used as the `output` prop for source and processor components, and as the `input` prop for processor and output components.

## Basic Example

```tsx
import { AudioProvider, ToneGenerator, Monitor, useModStream } from '@mode-7/mod';

function App() {
  const toneOut = useModStream('tone-output');

  return (
    <AudioProvider>
      <ToneGenerator output={toneOut} frequency={440} />
      <Monitor input={toneOut} />
    </AudioProvider>
  );
}
```

## Connecting Multiple Modules

Create multiple refs to build complex audio graphs:

```tsx
import {
  AudioProvider,
  MP3Deck,
  Filter,
  Delay,
  Monitor,
  useModStream
} from '@mode-7/mod';
import { useRef } from 'react';

function EffectsChain() {
  const deckOut = useModStream('deck-output');
  const filterOut = useModStream('filter-output');
  const delayOut = useModStream('delay-output');

  return (
    <AudioProvider>
      {/* Source */}
      <MP3Deck output={deckOut} />

      {/* Effects chain */}
      <Filter input={deckOut} output={filterOut} type="lowpass" frequency={2000} />
      <Delay input={filterOut} output={delayOut} time={0.5} feedback={0.3} />

      {/* Output */}
      <Monitor input={delayOut} />
    </AudioProvider>
  );
}
```

## Mixing Multiple Sources

Use with Mixer to combine audio streams:

```tsx
import { AudioProvider, Microphone, MP3Deck, Mixer, Monitor, useModStream } from '@mode-7/mod';

function SimpleMixer() {
  const micOut = useModStream('microphone');
  const deckOut = useModStream('deck');
  const mixerOut = useModStream('mixer-output');

  return (
    <AudioProvider>
      {/* Sources */}
      <Microphone output={micOut} />
      <MP3Deck output={deckOut} />

      {/* Mix them together */}
      <Mixer inputs={[micOut, deckOut]} output={mixerOut}>
        {({ levels, setLevel }) => (
          <div>
            <label>Mic: {levels[0]}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={levels[0]}
              onChange={(e) => setLevel(0, parseFloat(e.target.value))}
            />

            <label>Deck: {levels[1]}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={levels[1]}
              onChange={(e) => setLevel(1, parseFloat(e.target.value))}
            />
          </div>
        )}
      </Mixer>

      {/* Output */}
      <Monitor input={mixerOut} />
    </AudioProvider>
  );
}
```

## CV Modulation

Use refs to connect CV generators to processors:

```tsx
import {
  AudioProvider,
  ToneGenerator,
  Filter,
  LFO,
  Monitor,
  useModStream
} from '@mode-7/mod';

function ModulatedFilter() {
  const toneOut = useModStream('tone');
  const filterOut = useModStream('filter');
  const lfoOut = useModStream('lfo');

  return (
    <AudioProvider>
      {/* Audio source */}
      <ToneGenerator output={toneOut} frequency={220} />

      {/* CV modulation */}
      <LFO output={lfoOut} frequency={2} waveform="sine" />

      {/* Modulated filter */}
      <Filter
        input={toneOut}
        output={filterOut}
        type="lowpass"
        frequencyCV={lfoOut}
        frequencyRange={[200, 2000]}
      />

      {/* Output */}
      <Monitor input={filterOut} />
    </AudioProvider>
  );
}
```

## Important Notes

### Ref Stability

ModStream refs are stable and don't change between renders. You can safely use them in dependency arrays:

```tsx
useEffect(() => {
  // Safe to depend on the ref
  console.log('Stream connected:', streamRef.current);
}, [streamRef]);
```

### Debugging

The optional `label` parameter helps identify streams during debugging:

```tsx
const kickOut = useModStream('kick-drum');
const snareOut = useModStream('snare-drum');
const mixOut = useModStream('drum-mix');

// Labels appear in the console and can help trace audio routing issues
```

### Null Safety

Always check if the ref's `current` value exists before accessing its properties:

```tsx
const streamRef = useModStream();

useEffect(() => {
  if (streamRef.current) {
    // Safe to access properties
    console.log(streamRef.current.context);
  }
}, [streamRef]);
```

### Reactive Updates

ModStream refs trigger re-renders in consuming components when they transition between null and connected states. This ensures your UI updates when audio connections are established or torn down.

## Type Definition

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

type ModStreamRef = React.MutableRefObject<ModStream | null>;
```

## Related

- [useModStreamToMediaStream](/api/hooks/use-mod-stream-to-media-stream) - Convert to MediaStream for WebRTC/recording
- [Connecting Modules](/guide/connecting-modules) - Guide on audio routing
- [Architecture](/guide/architecture) - Understanding the mod architecture
