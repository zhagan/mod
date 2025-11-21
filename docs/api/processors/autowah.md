# AutoWah

Envelope-following wah filter that creates dynamic filter sweeps based on the input signal's amplitude, similar to a touch-sensitive wah pedal.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `input` | `ModStreamRef` | Required | Reference to input audio signal |
| `output` | `ModStreamRef` | Required | Reference to output audio signal |
| `label` | `string` | `'autowah'` | Label for metadata |
| `sensitivity` | `number` | `1000` | Sensitivity of the envelope follower (controlled or initial value) |
| `onSensitivityChange` | `(value: number) => void` | - | Callback when sensitivity changes |
| `baseFreq` | `number` | `200` | Base frequency in Hz (controlled or initial value) |
| `onBaseFreqChange` | `(value: number) => void` | - | Callback when baseFreq changes |
| `maxFreq` | `number` | `2000` | Maximum frequency in Hz (controlled or initial value) |
| `onMaxFreqChange` | `(value: number) => void` | - | Callback when maxFreq changes |
| `Q` | `number` | `5` | Filter resonance/Q factor (controlled or initial value) |
| `onQChange` | `(value: number) => void` | - | Callback when Q changes |
| `children` | `function` | - | Render prop function |

## Render Props

When using the `children` render prop, the following controls are provided:

| Property | Type | Description |
|----------|------|-------------|
| `sensitivity` | `number` | Current sensitivity value |
| `setSensitivity` | `(value: number) => void` | Update the sensitivity |
| `baseFreq` | `number` | Current base frequency in Hz |
| `setBaseFreq` | `(value: number) => void` | Update the base frequency |
| `maxFreq` | `number` | Current maximum frequency in Hz |
| `setMaxFreq` | `(value: number) => void` | Update the maximum frequency |
| `Q` | `number` | Current Q factor |
| `setQ` | `(value: number) => void` | Update the Q factor |
| `isActive` | `boolean` | Whether the processor is active |

## Usage

### Basic Usage

```tsx
import { AutoWah } from '@mode-7/mod';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);

  return (
    <AutoWah
      input={inputRef}
      output={outputRef}
      sensitivity={1000}
      baseFreq={200}
      maxFreq={2000}
      Q={5}
    />
  );
}
```

### With Render Props

```tsx
import { AutoWah } from '@mode-7/mod';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);

  return (
    <AutoWah input={inputRef} output={outputRef}>
      {({ sensitivity, setSensitivity, baseFreq, setBaseFreq, maxFreq, setMaxFreq, Q, setQ }) => (
        <div>
          <label>
            Sensitivity: {sensitivity.toFixed(0)}
            <input
              type="range"
              min="100"
              max="5000"
              step="10"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
            />
          </label>
          <label>
            Base Frequency: {baseFreq.toFixed(0)} Hz
            <input
              type="range"
              min="100"
              max="1000"
              step="10"
              value={baseFreq}
              onChange={(e) => setBaseFreq(parseFloat(e.target.value))}
            />
          </label>
          <label>
            Max Frequency: {maxFreq.toFixed(0)} Hz
            <input
              type="range"
              min="500"
              max="5000"
              step="10"
              value={maxFreq}
              onChange={(e) => setMaxFreq(parseFloat(e.target.value))}
            />
          </label>
          <label>
            Resonance (Q): {Q.toFixed(1)}
            <input
              type="range"
              min="0.5"
              max="20"
              step="0.1"
              value={Q}
              onChange={(e) => setQ(parseFloat(e.target.value))}
            />
          </label>
        </div>
      )}
    </AutoWah>
  );
}
```

### Controlled Props

```tsx
import { AutoWah } from '@mode-7/mod';
import { useState } from 'react';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);
  const [sensitivity, setSensitivity] = useState(1000);
  const [baseFreq, setBaseFreq] = useState(200);
  const [maxFreq, setMaxFreq] = useState(2000);
  const [Q, setQ] = useState(5);

  return (
    <div>
      <AutoWah
        input={inputRef}
        output={outputRef}
        sensitivity={sensitivity}
        onSensitivityChange={setSensitivity}
        baseFreq={baseFreq}
        onBaseFreqChange={setBaseFreq}
        maxFreq={maxFreq}
        onMaxFreqChange={setMaxFreq}
        Q={Q}
        onQChange={setQ}
      />
      <button onClick={() => setSensitivity(500)}>Subtle</button>
      <button onClick={() => setSensitivity(2000)}>Intense</button>
      <button onClick={() => setQ(10)}>High Resonance</button>
    </div>
  );
}
```

### Imperative Refs

```tsx
import { AutoWah } from '@mode-7/mod';
import { useRef } from 'react';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);
  const autoWahRef = useRef(null);

  const logState = () => {
    if (autoWahRef.current) {
      const state = autoWahRef.current.getState();
      console.log('AutoWah state:', state);
    }
  };

  return (
    <div>
      <AutoWah
        ref={autoWahRef}
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

- The autowah responds to the input signal's volume envelope
- Louder signals sweep the filter from baseFreq toward maxFreq
- Sensitivity controls how responsive the filter is to volume changes
- Higher sensitivity values create more dramatic sweeps
- baseFreq sets the resting frequency (when signal is quiet)
- maxFreq sets the peak frequency (when signal is loud)
- Q controls the resonance and "vowel-like" character of the filter
- Higher Q values create more pronounced, vocal-like sweeps
- Works best with percussive or dynamic sources (guitar, bass, drums)
- Try different base/max frequency ranges for different timbres

## Related

- [Filter](./filter.md) - Static frequency filtering
- [LFO](/api/cv/lfo.md) - Low-frequency oscillator for modulation
- [Compressor](./compressor.md) - Dynamic range compression
