# Tremolo

Amplitude modulation effect that creates rhythmic volume variations in the audio signal.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `input` | `ModStreamRef` | Required | Reference to input audio signal |
| `output` | `ModStreamRef` | Required | Reference to output audio signal |
| `label` | `string` | `'tremolo'` | Label for metadata |
| `rate` | `number` | `5` | LFO rate in Hz (controlled or initial value) |
| `onRateChange` | `(value: number) => void` | - | Callback when rate changes |
| `depth` | `number` | `0.5` | Depth of the amplitude modulation (0-1) (controlled or initial value) |
| `onDepthChange` | `(value: number) => void` | - | Callback when depth changes |
| `children` | `function` | - | Render prop function |

## Render Props

When using the `children` render prop, the following controls are provided:

| Property | Type | Description |
|----------|------|-------------|
| `rate` | `number` | Current LFO rate in Hz |
| `setRate` | `(value: number) => void` | Update the rate |
| `depth` | `number` | Current depth (0-1) |
| `setDepth` | `(value: number) => void` | Update the depth |
| `isActive` | `boolean` | Whether the processor is active |

## Usage

### Basic Usage

```tsx
import { Tremolo } from '@mod-audio/core';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);

  return (
    <Tremolo
      input={inputRef}
      output={outputRef}
      rate={5}
      depth={0.5}
    />
  );
}
```

### With Render Props

```tsx
import { Tremolo } from '@mod-audio/core';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);

  return (
    <Tremolo input={inputRef} output={outputRef}>
      {({ rate, setRate, depth, setDepth }) => (
        <div>
          <label>
            Rate: {rate.toFixed(2)} Hz
            <input
              type="range"
              min="0.1"
              max="20"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
            />
          </label>
          <label>
            Depth: {(depth * 100).toFixed(0)}%
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={depth}
              onChange={(e) => setDepth(parseFloat(e.target.value))}
            />
          </label>
        </div>
      )}
    </Tremolo>
  );
}
```

### Controlled Props

```tsx
import { Tremolo } from '@mod-audio/core';
import { useState } from 'react';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);
  const [rate, setRate] = useState(5);
  const [depth, setDepth] = useState(0.5);

  return (
    <div>
      <Tremolo
        input={inputRef}
        output={outputRef}
        rate={rate}
        onRateChange={setRate}
        depth={depth}
        onDepthChange={setDepth}
      />
      <button onClick={() => setRate(2)}>Slow</button>
      <button onClick={() => setRate(8)}>Fast</button>
      <button onClick={() => setDepth(0.9)}>Deep</button>
    </div>
  );
}
```

### Imperative Refs

```tsx
import { Tremolo } from '@mod-audio/core';
import { useRef } from 'react';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);
  const tremoloRef = useRef(null);

  const logState = () => {
    if (tremoloRef.current) {
      const state = tremoloRef.current.getState();
      console.log('Tremolo state:', state);
    }
  };

  return (
    <div>
      <Tremolo
        ref={tremoloRef}
        input={inputRef}
        output={outputRef}
      />
      <button onClick={logState}>Log State</button>
    </div>
  );
}
```

**Note:** The imperative handle provides read-only access via `getState()`. To control the component programmatically, use the controlled props pattern shown above.

## Important Notes

- Tremolo modulates the amplitude (volume) of the signal
- Rate controls the speed of the volume oscillation
- Depth controls how much the volume varies (0 = no effect, 1 = maximum variation)
- Common rates range from 2-10 Hz for musical tremolo effects
- Slower rates (0.5-2 Hz) create a gentle pulsing effect
- Faster rates (10-20 Hz) can create rhythmic, choppy effects

## Related

- [RingModulator](./ringmodulator.md) - Ring modulation effect
- [Panner](./panner.md) - Stereo panning
- [Phaser](./phaser.md) - Phase modulation effect
