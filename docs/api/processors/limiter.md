# Limiter

Limits audio peaks to prevent clipping and maintain consistent output levels, essential for mastering and preventing distortion.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `input` | `ModStreamRef` | Required | Reference to input audio signal |
| `output` | `ModStreamRef` | Required | Reference to output audio signal |
| `label` | `string` | `'limiter'` | Label for metadata |
| `threshold` | `number` | `-1` | Threshold in dB (controlled or initial value) |
| `onThresholdChange` | `(value: number) => void` | - | Callback when threshold changes |
| `release` | `number` | `0.05` | Release time in seconds (controlled or initial value) |
| `onReleaseChange` | `(value: number) => void` | - | Callback when release changes |
| `children` | `function` | - | Render prop function |

## Render Props

When using the `children` render prop, the following controls are provided:

| Property | Type | Description |
|----------|------|-------------|
| `threshold` | `number` | Current threshold in dB |
| `setThreshold` | `(value: number) => void` | Update the threshold |
| `release` | `number` | Current release time in seconds |
| `setRelease` | `(value: number) => void` | Update the release time |
| `isActive` | `boolean` | Whether the processor is active |

## Usage

### Basic Usage

```tsx
import { Limiter } from '@mode-7/mod';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);

  return (
    <Limiter
      input={inputRef}
      output={outputRef}
      threshold={-1}
      release={0.05}
    />
  );
}
```

### With Render Props

```tsx
import { Limiter } from '@mode-7/mod';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);

  return (
    <Limiter input={inputRef} output={outputRef}>
      {({ threshold, setThreshold, release, setRelease }) => (
        <div>
          <label>
            Threshold: {threshold.toFixed(1)} dB
            <input
              type="range"
              min="-20"
              max="0"
              step="0.1"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
            />
          </label>
          <label>
            Release: {(release * 1000).toFixed(0)} ms
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={release}
              onChange={(e) => setRelease(parseFloat(e.target.value))}
            />
          </label>
        </div>
      )}
    </Limiter>
  );
}
```

### Controlled Props

```tsx
import { Limiter } from '@mode-7/mod';
import { useState } from 'react';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);
  const [threshold, setThreshold] = useState(-1);
  const [release, setRelease] = useState(0.05);

  return (
    <div>
      <Limiter
        input={inputRef}
        output={outputRef}
        threshold={threshold}
        onThresholdChange={setThreshold}
        release={release}
        onReleaseChange={setRelease}
      />
      <button onClick={() => setThreshold(-3)}>Conservative</button>
      <button onClick={() => setThreshold(-1)}>Aggressive</button>
      <button onClick={() => setRelease(0.01)}>Fast</button>
      <button onClick={() => setRelease(0.2)}>Slow</button>
    </div>
  );
}
```

### Imperative Refs

```tsx
import { Limiter } from '@mode-7/mod';
import { useRef } from 'react';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);
  const limiterRef = useRef(null);

  const logState = () => {
    if (limiterRef.current) {
      const state = limiterRef.current.getState();
      console.log('Limiter state:', state);
    }
  };

  return (
    <div>
      <Limiter
        ref={limiterRef}
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

- The limiter prevents audio from exceeding the threshold level
- Threshold is typically set close to 0 dB to prevent clipping (e.g., -1 to -3 dB)
- Lower threshold values provide more aggressive limiting
- Fast release times (10-50ms) are transparent but may cause pumping on bass-heavy material
- Slower release times (100-500ms) are smoother but may reduce dynamic range
- Limiters are typically placed at the end of an effects chain
- Use for: preventing clipping, maximizing loudness, protecting speakers/headphones

## Related

- [Compressor](./compressor.md) - Dynamic range compression with ratio control
- [Gate](./gate.md) - Silences audio below a threshold
- [Distortion](./distortion.md) - Adds harmonic distortion
