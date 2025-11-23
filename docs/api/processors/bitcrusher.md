# BitCrusher

Lo-fi effect that reduces bit depth and sample rate to create digital distortion and vintage digital audio artifacts.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `input` | `ModStreamRef` | Required | Reference to input audio signal |
| `output` | `ModStreamRef` | Required | Reference to output audio signal |
| `label` | `string` | `'bitcrusher'` | Label for metadata |
| `bitDepth` | `number` | `8` | Bit depth reduction (1-16) (controlled or initial value) |
| `onBitDepthChange` | `(value: number) => void` | - | Callback when bitDepth changes |
| `sampleReduction` | `number` | `1` | Sample rate reduction factor (controlled or initial value) |
| `onSampleReductionChange` | `(value: number) => void` | - | Callback when sampleReduction changes |
| `enabled` | `boolean` | `true` | Whether the component is enabled or bypassed |
| `onEnabledChange` | `(enabled: boolean) => void` | `-` | Callback when enabled state changes |
| `children` | `function` | - | Render prop function |

## Render Props

When using the `children` render prop, the following controls are provided:

| Property | Type | Description |
|----------|------|-------------|
| `bitDepth` | `number` | Current bit depth |
| `setBitDepth` | `(value: number) => void` | Update the bit depth |
| `sampleReduction` | `number` | Current sample reduction factor |
| `setSampleReduction` | `(value: number) => void` | Update the sample reduction |
| `enabled` | `boolean` | Whether the component is enabled |
| `setEnabled` | `(value: boolean) => void` | Toggle enabled/bypass state |
| `isActive` | `boolean` | Whether the processor is active |

## Usage

### Basic Usage

```tsx
import { BitCrusher } from '@mode-7/mod';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);

  return (
    <BitCrusher
      input={inputRef}
      output={outputRef}
      bitDepth={8}
      sampleReduction={1}
    />
  );
}
```

### With Render Props

```tsx
import { BitCrusher } from '@mode-7/mod';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);

  return (
    <BitCrusher input={inputRef} output={outputRef}>
      {({ bitDepth, setBitDepth, sampleReduction, setSampleReduction }) => (
        <div>
          <label>
            Bit Depth: {bitDepth}
            <input
              type="range"
              min="1"
              max="16"
              step="1"
              value={bitDepth}
              onChange={(e) => setBitDepth(parseInt(e.target.value))}
            />
          </label>
          <label>
            Sample Reduction: {sampleReduction}x
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={sampleReduction}
              onChange={(e) => setSampleReduction(parseInt(e.target.value))}
            />
          </label>
        </div>
      )}
    </BitCrusher>
  );
}
```

### Controlled Props

```tsx
import { BitCrusher } from '@mode-7/mod';
import { useState } from 'react';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);
  const [bitDepth, setBitDepth] = useState(8);
  const [sampleReduction, setSampleReduction] = useState(1);

  return (
    <div>
      <BitCrusher
        input={inputRef}
        output={outputRef}
        bitDepth={bitDepth}
        onBitDepthChange={setBitDepth}
        sampleReduction={sampleReduction}
        onSampleReductionChange={setSampleReduction}
      />
      <button onClick={() => setBitDepth(4)}>4-bit (Very Lo-Fi)</button>
      <button onClick={() => setBitDepth(8)}>8-bit (Classic)</button>
      <button onClick={() => setBitDepth(12)}>12-bit (Subtle)</button>
      <button onClick={() => setSampleReduction(10)}>Heavy Aliasing</button>
    </div>
  );
}
```

### Imperative Refs

```tsx
import { BitCrusher } from '@mode-7/mod';
import { useRef } from 'react';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);
  const bitCrusherRef = useRef(null);

  const logState = () => {
    if (bitCrusherRef.current) {
      const state = bitCrusherRef.current.getState();
      console.log('BitCrusher state:', state);
    }
  };

  return (
    <div>
      <BitCrusher
        ref={bitCrusherRef}
        input={inputRef}
        output={outputRef}
      />
      <button onClick={logState}>Log State</button>
    </div>
  );
}
```

**Note:** The imperative handle provides read-only access via `getState()`. To control the component programmatically, use the controlled props pattern shown above.

## Bypass/Enable

The `enabled` prop allows you to bypass the component's processing. When `enabled` is `false`, the audio passes through directly without any processing, saving CPU resources. This implements a true bypass.

### Usage

```tsx
import { BitCrusher } from '@mode-7/mod';
import { useState } from 'react';

function App() {
  const [enabled, setEnabled] = useState(true);

  return (
    <BitCrusher
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
<BitCrusher input={input} output={output}>
  {({ enabled, setEnabled, bitDepth, setBitDepth, sampleReduction, setSampleReduction }) => (
    <div>
      <button onClick={() => setEnabled(!enabled)}>
        {enabled ? 'Bypass' : 'Enable'}
      </button>
      {/* Other controls */}
    </div>
  )}
</BitCrusher>
```

## Important Notes

- Lower bit depths create more distortion and quantization noise
- Bit depth of 1 produces extreme digital distortion
- Bit depth of 8 resembles vintage samplers and video game audio
- Sample reduction creates aliasing artifacts
- Higher sample reduction values create more dramatic downsampling effects
- Combine low bit depth and high sample reduction for extreme lo-fi effects
- Use subtle settings (12-16 bit, low sample reduction) for vintage warmth

## Related

- [Distortion](./distortion.md) - Analog-style distortion effect
- [Filter](./filter.md) - Frequency filtering
- [RingModulator](./ringmodulator.md) - Ring modulation effect
