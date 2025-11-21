# Flanger

A flanger effect using modulated delay to create a sweeping, jet-like sound characteristic of classic flanger pedals.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `input` | `ModStreamRef` | Required | Reference to input audio signal |
| `output` | `ModStreamRef` | Required | Reference to output audio signal |
| `label` | `string` | `'flanger'` | Label for metadata |
| `rate` | `number` | `0.25` | LFO rate in Hz (controlled or initial value) |
| `onRateChange` | `(value: number) => void` | - | Callback when rate changes |
| `depth` | `number` | `0.003` | Depth of the delay modulation in seconds (controlled or initial value) |
| `onDepthChange` | `(value: number) => void` | - | Callback when depth changes |
| `feedback` | `number` | `0.5` | Amount of feedback (0-1) (controlled or initial value) |
| `onFeedbackChange` | `(value: number) => void` | - | Callback when feedback changes |
| `delay` | `number` | `0.005` | Base delay time in seconds (controlled or initial value) |
| `onDelayChange` | `(value: number) => void` | - | Callback when delay changes |
| `children` | `function` | - | Render prop function |

## Render Props

When using the `children` render prop, the following controls are provided:

| Property | Type | Description |
|----------|------|-------------|
| `rate` | `number` | Current LFO rate in Hz |
| `setRate` | `(value: number) => void` | Update the rate |
| `depth` | `number` | Current depth in seconds |
| `setDepth` | `(value: number) => void` | Update the depth |
| `feedback` | `number` | Current feedback amount |
| `setFeedback` | `(value: number) => void` | Update the feedback |
| `delay` | `number` | Current base delay time in seconds |
| `setDelay` | `(value: number) => void` | Update the delay |
| `isActive` | `boolean` | Whether the processor is active |

## Usage

### Basic Usage

```tsx
import { Flanger } from '@mod-audio/core';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);

  return (
    <Flanger
      input={inputRef}
      output={outputRef}
      rate={0.25}
      depth={0.003}
      feedback={0.5}
      delay={0.005}
    />
  );
}
```

### With Render Props

```tsx
import { Flanger } from '@mod-audio/core';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);

  return (
    <Flanger input={inputRef} output={outputRef}>
      {({ rate, setRate, depth, setDepth, feedback, setFeedback, delay, setDelay }) => (
        <div>
          <label>
            Rate: {rate.toFixed(2)} Hz
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
            />
          </label>
          <label>
            Depth: {(depth * 1000).toFixed(2)} ms
            <input
              type="range"
              min="0.001"
              max="0.01"
              step="0.0001"
              value={depth}
              onChange={(e) => setDepth(parseFloat(e.target.value))}
            />
          </label>
          <label>
            Feedback: {feedback.toFixed(2)}
            <input
              type="range"
              min="0"
              max="0.95"
              step="0.01"
              value={feedback}
              onChange={(e) => setFeedback(parseFloat(e.target.value))}
            />
          </label>
          <label>
            Delay: {(delay * 1000).toFixed(2)} ms
            <input
              type="range"
              min="0.001"
              max="0.02"
              step="0.0001"
              value={delay}
              onChange={(e) => setDelay(parseFloat(e.target.value))}
            />
          </label>
        </div>
      )}
    </Flanger>
  );
}
```

### Controlled Props

```tsx
import { Flanger } from '@mod-audio/core';
import { useState } from 'react';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);
  const [rate, setRate] = useState(0.25);
  const [depth, setDepth] = useState(0.003);
  const [feedback, setFeedback] = useState(0.5);
  const [delay, setDelay] = useState(0.005);

  return (
    <div>
      <Flanger
        input={inputRef}
        output={outputRef}
        rate={rate}
        onRateChange={setRate}
        depth={depth}
        onDepthChange={setDepth}
        feedback={feedback}
        onFeedbackChange={setFeedback}
        delay={delay}
        onDelayChange={setDelay}
      />
      <button onClick={() => setRate(0.1)}>Slow Sweep</button>
      <button onClick={() => setRate(1)}>Fast Sweep</button>
      <button onClick={() => setFeedback(0.8)}>Intense</button>
    </div>
  );
}
```

### Imperative Refs

```tsx
import { Flanger } from '@mod-audio/core';
import { useRef } from 'react';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);
  const flangerRef = useRef(null);

  const logState = () => {
    if (flangerRef.current) {
      const state = flangerRef.current.getState();
      console.log('Flanger state:', state);
    }
  };

  return (
    <div>
      <Flanger
        ref={flangerRef}
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

- The flanger creates a sweeping effect by modulating a short delay line
- Very short delay times (1-20ms) are characteristic of flanging
- Higher feedback values create more dramatic, metallic effects
- Be careful with high feedback values to avoid excessive resonance
- The rate controls how fast the sweep occurs
- Depth controls how wide the frequency sweep is

## Related

- [Phaser](./phaser.md) - Similar modulation effect using all-pass filters
- [Chorus](./chorus.md) - Related effect with longer delays
- [Delay](./delay.md) - Basic delay effect
