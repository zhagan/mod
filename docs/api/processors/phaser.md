# Phaser

A phaser effect that modulates all-pass filters to create a sweeping, swirling sound characteristic of classic phaser pedals.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `input` | `ModStreamRef` | Required | Reference to input audio signal |
| `output` | `ModStreamRef` | Required | Reference to output audio signal |
| `label` | `string` | `'phaser'` | Label for metadata |
| `rate` | `number` | `0.5` | LFO rate in Hz (controlled or initial value) |
| `onRateChange` | `(value: number) => void` | - | Callback when rate changes |
| `depth` | `number` | `500` | Depth of the phaser effect in Hz (controlled or initial value) |
| `onDepthChange` | `(value: number) => void` | - | Callback when depth changes |
| `feedback` | `number` | `0.5` | Amount of feedback (0-1) (controlled or initial value) |
| `onFeedbackChange` | `(value: number) => void` | - | Callback when feedback changes |
| `baseFreq` | `number` | `800` | Base frequency of the all-pass filters in Hz (controlled or initial value) |
| `onBaseFreqChange` | `(value: number) => void` | - | Callback when baseFreq changes |
| `children` | `function` | - | Render prop function |

## Render Props

When using the `children` render prop, the following controls are provided:

| Property | Type | Description |
|----------|------|-------------|
| `rate` | `number` | Current LFO rate in Hz |
| `setRate` | `(value: number) => void` | Update the rate |
| `depth` | `number` | Current depth in Hz |
| `setDepth` | `(value: number) => void` | Update the depth |
| `feedback` | `number` | Current feedback amount |
| `setFeedback` | `(value: number) => void` | Update the feedback |
| `baseFreq` | `number` | Current base frequency in Hz |
| `setBaseFreq` | `(value: number) => void` | Update the base frequency |
| `isActive` | `boolean` | Whether the processor is active |

## Usage

### Basic Usage

```tsx
import { Phaser } from '@mod-audio/core';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);

  return (
    <Phaser
      input={inputRef}
      output={outputRef}
      rate={0.5}
      depth={500}
      feedback={0.5}
      baseFreq={800}
    />
  );
}
```

### With Render Props

```tsx
import { Phaser } from '@mod-audio/core';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);

  return (
    <Phaser input={inputRef} output={outputRef}>
      {({ rate, setRate, depth, setDepth, feedback, setFeedback, baseFreq, setBaseFreq }) => (
        <div>
          <label>
            Rate: {rate.toFixed(2)} Hz
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
            />
          </label>
          <label>
            Depth: {depth.toFixed(0)} Hz
            <input
              type="range"
              min="100"
              max="2000"
              step="10"
              value={depth}
              onChange={(e) => setDepth(parseFloat(e.target.value))}
            />
          </label>
          <label>
            Feedback: {feedback.toFixed(2)}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={feedback}
              onChange={(e) => setFeedback(parseFloat(e.target.value))}
            />
          </label>
          <label>
            Base Frequency: {baseFreq.toFixed(0)} Hz
            <input
              type="range"
              min="200"
              max="2000"
              step="10"
              value={baseFreq}
              onChange={(e) => setBaseFreq(parseFloat(e.target.value))}
            />
          </label>
        </div>
      )}
    </Phaser>
  );
}
```

### Controlled Props

```tsx
import { Phaser } from '@mod-audio/core';
import { useState } from 'react';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);
  const [rate, setRate] = useState(0.5);
  const [depth, setDepth] = useState(500);
  const [feedback, setFeedback] = useState(0.5);
  const [baseFreq, setBaseFreq] = useState(800);

  return (
    <div>
      <Phaser
        input={inputRef}
        output={outputRef}
        rate={rate}
        onRateChange={setRate}
        depth={depth}
        onDepthChange={setDepth}
        feedback={feedback}
        onFeedbackChange={setFeedback}
        baseFreq={baseFreq}
        onBaseFreqChange={setBaseFreq}
      />
      <button onClick={() => setRate(0.25)}>Slow</button>
      <button onClick={() => setRate(2)}>Fast</button>
      <button onClick={() => setFeedback(0.8)}>High Feedback</button>
    </div>
  );
}
```

### Imperative Refs

```tsx
import { Phaser } from '@mod-audio/core';
import { useRef } from 'react';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);
  const phaserRef = useRef(null);

  const logState = () => {
    if (phaserRef.current) {
      const state = phaserRef.current.getState();
      console.log('Phaser state:', state);
    }
  };

  return (
    <div>
      <Phaser
        ref={phaserRef}
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

- The phaser creates a sweeping effect by modulating all-pass filters
- Higher feedback values create more pronounced resonance
- The LFO rate controls how fast the sweep occurs
- Depth controls the intensity of the frequency modulation
- Base frequency sets the center point of the sweep

## Related

- [Flanger](./flanger.md) - Similar modulation effect with delay
- [Chorus](./chorus.md) - Another modulation-based effect
- [Tremolo](./tremolo.md) - Amplitude modulation effect
