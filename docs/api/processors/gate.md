# Gate

Noise gate that silences audio below a threshold, useful for reducing background noise and controlling signal bleed.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `input` | `ModStreamRef` | Required | Reference to input audio signal |
| `output` | `ModStreamRef` | Required | Reference to output audio signal |
| `label` | `string` | `'gate'` | Label for metadata |
| `threshold` | `number` | `-40` | Threshold in dB (controlled or initial value) |
| `onThresholdChange` | `(value: number) => void` | - | Callback when threshold changes |
| `attack` | `number` | `0.01` | Attack time in seconds (controlled or initial value) |
| `onAttackChange` | `(value: number) => void` | - | Callback when attack changes |
| `release` | `number` | `0.1` | Release time in seconds (controlled or initial value) |
| `onReleaseChange` | `(value: number) => void` | - | Callback when release changes |
| `children` | `function` | - | Render prop function |

## Render Props

When using the `children` render prop, the following controls are provided:

| Property | Type | Description |
|----------|------|-------------|
| `threshold` | `number` | Current threshold in dB |
| `setThreshold` | `(value: number) => void` | Update the threshold |
| `attack` | `number` | Current attack time in seconds |
| `setAttack` | `(value: number) => void` | Update the attack time |
| `release` | `number` | Current release time in seconds |
| `setRelease` | `(value: number) => void` | Update the release time |
| `isActive` | `boolean` | Whether the processor is active |

## Usage

### Basic Usage

```tsx
import { Gate } from '@mode-7/mod';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);

  return (
    <Gate
      input={inputRef}
      output={outputRef}
      threshold={-40}
      attack={0.01}
      release={0.1}
    />
  );
}
```

### With Render Props

```tsx
import { Gate } from '@mode-7/mod';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);

  return (
    <Gate input={inputRef} output={outputRef}>
      {({ threshold, setThreshold, attack, setAttack, release, setRelease }) => (
        <div>
          <label>
            Threshold: {threshold.toFixed(1)} dB
            <input
              type="range"
              min="-80"
              max="0"
              step="1"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
            />
          </label>
          <label>
            Attack: {(attack * 1000).toFixed(1)} ms
            <input
              type="range"
              min="0.001"
              max="0.1"
              step="0.001"
              value={attack}
              onChange={(e) => setAttack(parseFloat(e.target.value))}
            />
          </label>
          <label>
            Release: {(release * 1000).toFixed(0)} ms
            <input
              type="range"
              min="0.01"
              max="1"
              step="0.01"
              value={release}
              onChange={(e) => setRelease(parseFloat(e.target.value))}
            />
          </label>
        </div>
      )}
    </Gate>
  );
}
```

### Controlled Props

```tsx
import { Gate } from '@mode-7/mod';
import { useState } from 'react';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);
  const [threshold, setThreshold] = useState(-40);
  const [attack, setAttack] = useState(0.01);
  const [release, setRelease] = useState(0.1);

  return (
    <div>
      <Gate
        input={inputRef}
        output={outputRef}
        threshold={threshold}
        onThresholdChange={setThreshold}
        attack={attack}
        onAttackChange={setAttack}
        release={release}
        onReleaseChange={setRelease}
      />
      <button onClick={() => setThreshold(-50)}>Gentle</button>
      <button onClick={() => setThreshold(-30)}>Aggressive</button>
      <button onClick={() => setRelease(0.05)}>Fast Release</button>
      <button onClick={() => setRelease(0.3)}>Slow Release</button>
    </div>
  );
}
```

### Imperative Refs

```tsx
import { Gate } from '@mode-7/mod';
import { useRef } from 'react';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);
  const gateRef = useRef(null);

  const logState = () => {
    if (gateRef.current) {
      const state = gateRef.current.getState();
      console.log('Gate state:', state);
    }
  };

  return (
    <div>
      <Gate
        ref={gateRef}
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

- The gate mutes audio when the signal falls below the threshold
- Threshold determines at what level the gate opens/closes
- Lower threshold values (-60 to -80 dB) catch quieter noise
- Higher threshold values (-20 to -40 dB) are more aggressive
- Attack controls how quickly the gate opens when signal exceeds threshold
- Fast attack (1-10ms) preserves transients but may click
- Release controls how quickly the gate closes when signal falls below threshold
- Slow release (100-500ms) creates smoother, more natural decay
- Fast release (10-50ms) creates choppy, staccato effects
- Use for: noise reduction, drum gating, creative rhythmic effects

## Related

- [Compressor](./compressor.md) - Dynamic range compression
- [Limiter](./limiter.md) - Prevents audio from exceeding a threshold
- [Filter](./filter.md) - Frequency filtering
