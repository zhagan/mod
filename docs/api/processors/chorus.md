# Chorus

The `Chorus` component adds depth and thickness to audio by creating multiple delayed copies with slight pitch variations.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `input` | `ModStreamRef` | Required | Audio signal to process |
| `output` | `ModStreamRef` | Required | Processed audio output |
| `label` | `string` | `'chorus'` | Label for the component in metadata |
| `rate` | `number` | `1.5` | LFO rate in Hz (controlled or initial value) |
| `onRateChange` | `(rate: number) => void` | - | Callback when rate changes |
| `depth` | `number` | `0.002` | Modulation depth (controlled or initial value) |
| `onDepthChange` | `(depth: number) => void` | - | Callback when depth changes |
| `delay` | `number` | `0.02` | Base delay time in seconds (controlled or initial value) |
| `onDelayChange` | `(delay: number) => void` | - | Callback when delay changes |
| `wet` | `number` | `0.5` | Wet/dry mix 0-1 (controlled or initial value) |
| `onWetChange` | `(wet: number) => void` | - | Callback when wet/dry mix changes |
| `enabled` | `boolean` | `true` | Whether the component is enabled or bypassed |
| `onEnabledChange` | `(enabled: boolean) => void` | `-` | Callback when enabled state changes |
| `children` | `function` | - | Render prop function receiving control props |

## Render Props

When using the `children` render prop, the following controls are provided:

| Property | Type | Description |
|----------|------|-------------|
| `rate` | `number` | Current LFO rate in Hz |
| `setRate` | `(value: number) => void` | Update the rate |
| `depth` | `number` | Current modulation depth |
| `setDepth` | `(value: number) => void` | Update the depth |
| `delay` | `number` | Current base delay time |
| `setDelay` | `(value: number) => void` | Update the delay |
| `wet` | `number` | Current wet/dry mix |
| `setWet` | `(value: number) => void` | Update the wet/dry mix |
| `enabled` | `boolean` | Whether the component is enabled |
| `setEnabled` | `(value: boolean) => void` | Toggle enabled/bypass state |
| `isActive` | `boolean` | Whether the effect is active |

## Usage

### Basic Usage

```tsx
import { ToneGenerator, Chorus, Monitor } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const toneOut = useRef(null);
  const chorusOut = useRef(null);

  return (
    <>
      <ToneGenerator output={toneOut} />
      <Chorus input={toneOut} output={chorusOut} />
      <Monitor input={chorusOut} />
    </>
  );
}
```

### With Render Props (UI Controls)

```tsx
import { Chorus } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  return (
    <Chorus input={inputRef} output={outputRef}>
      {({ rate, setRate, depth, setDepth, delay, setDelay, wet, setWet }) => (
        <div>
          <div>
            <label>Rate: {rate.toFixed(2)} Hz</label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </div>
          <div>
            <label>Depth: {(depth * 1000).toFixed(1)} ms</label>
            <input
              type="range"
              min="0.001"
              max="0.01"
              step="0.0001"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
            />
          </div>
          <div>
            <label>Delay: {(delay * 1000).toFixed(0)} ms</label>
            <input
              type="range"
              min="0.01"
              max="0.05"
              step="0.001"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
            />
          </div>
          <div>
            <label>Mix: {(wet * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={wet}
              onChange={(e) => setWet(Number(e.target.value))}
            />
          </div>
        </div>
      )}
    </Chorus>
  );
}
```

### Controlled Props

```tsx
import { ToneGenerator, Chorus, Monitor } from '@mode-7/mod';
import { useState, useRef } from 'react';

function App() {
  const toneOut = useRef(null);
  const outputRef = useRef(null);
  const [rate, setRate] = useState(1.5);
  const [depth, setDepth] = useState(0.002);
  const [delay, setDelay] = useState(0.02);
  const [wet, setWet] = useState(0.5);

  return (
    <>
      <ToneGenerator output={toneOut} />
      <Chorus
        input={toneOut}
        output={outputRef}
        rate={rate}
        onRateChange={setRate}
        depth={depth}
        onDepthChange={setDepth}
        delay={delay}
        onDelayChange={setDelay}
        wet={wet}
        onWetChange={setWet}
      />
      <Monitor input={outputRef} />
    </>
  );
}
```

### Imperative Refs

```tsx
import { ToneGenerator, Chorus, ChorusHandle, Monitor } from '@mode-7/mod';
import { useRef, useEffect } from 'react';

function App() {
  const chorusRef = useRef<ChorusHandle>(null);
  const toneOut = useRef(null);
  const outputRef = useRef(null);

  useEffect(() => {
    // Access current state
    if (chorusRef.current) {
      const state = chorusRef.current.getState();
      console.log('Rate:', state.rate);
      console.log('Depth:', state.depth);
      console.log('Delay:', state.delay);
      console.log('Wet:', state.wet);
    }
  }, []);

  return (
    <>
      <ToneGenerator output={toneOut} />
      <Chorus ref={chorusRef} input={toneOut} output={outputRef} />
      <Monitor input={outputRef} />
    </>
  );
}
```

**Note:** The imperative handle provides read-only access via `getState()`. To control the component programmatically, use the controlled props pattern shown above.

## Bypass/Enable

The `enabled` prop allows you to bypass the component's processing. When `enabled` is `false`, the audio passes through directly without any processing, saving CPU resources. This implements a true bypass.

### Usage

```tsx
import { Chorus } from '@mode-7/mod';
import { useState } from 'react';

function App() {
  const [enabled, setEnabled] = useState(true);

  return (
    <Chorus
      input={input}
      output={output}
      enabled={enabled}
      onEnabledChange={setEnabled}
    />
  );
}
```

### With Render Props

```tsx
<Chorus input={input} output={output}>
  {({ enabled, setEnabled, rate, setRate, depth, setDepth, delay, setDelay, wet, setWet }) => (
    <div>
      <button onClick={() => setEnabled(!enabled)}>
        {enabled ? 'Bypass' : 'Enable'}
      </button>
      {/* Other controls */}
    </div>
  )}
</Chorus>
```

## Important Notes

### Rate

- Controls the speed of the chorus modulation
- Typical range: 0.1 to 5 Hz
- Lower rates create subtle movement
- Higher rates create more dramatic effects

### Depth

- Controls the amount of pitch variation
- Very small values (0.001-0.005) work best
- Too much depth can sound unnatural

### Delay

- Base delay time before modulation
- Typical range: 0.01 to 0.05 seconds
- Shorter delays create tighter chorus
- Longer delays create more separated effect

## Related

- [Flanger](/api/processors/flanger) - Similar but more dramatic effect
- [Phaser](/api/processors/phaser) - Related modulation effect
- [ToneGenerator](/api/sources/tone-generator) - Generate audio to process
- [Monitor](/api/output/monitor) - Output the processed audio
