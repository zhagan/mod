# RingModulator

Ring modulation effect that multiplies the input signal with a sine wave oscillator to create metallic, bell-like, and inharmonic tones.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `input` | `ModStreamRef` | Required | Reference to input audio signal |
| `output` | `ModStreamRef` | Required | Reference to output audio signal |
| `label` | `string` | `'ringmodulator'` | Label for metadata |
| `frequency` | `number` | `440` | Modulation frequency in Hz (controlled or initial value) |
| `onFrequencyChange` | `(value: number) => void` | - | Callback when frequency changes |
| `wet` | `number` | `0.5` | Wet/dry mix (0-1) (controlled or initial value) |
| `onWetChange` | `(value: number) => void` | - | Callback when wet changes |
| `children` | `function` | - | Render prop function |

## Render Props

When using the `children` render prop, the following controls are provided:

| Property | Type | Description |
|----------|------|-------------|
| `frequency` | `number` | Current modulation frequency in Hz |
| `setFrequency` | `(value: number) => void` | Update the frequency |
| `wet` | `number` | Current wet/dry mix (0-1) |
| `setWet` | `(value: number) => void` | Update the wet mix |
| `isActive` | `boolean` | Whether the processor is active |

## Usage

### Basic Usage

```tsx
import { RingModulator } from '@mod-audio/core';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);

  return (
    <RingModulator
      input={inputRef}
      output={outputRef}
      frequency={440}
      wet={0.5}
    />
  );
}
```

### With Render Props

```tsx
import { RingModulator } from '@mod-audio/core';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);

  return (
    <RingModulator input={inputRef} output={outputRef}>
      {({ frequency, setFrequency, wet, setWet }) => (
        <div>
          <label>
            Frequency: {frequency.toFixed(1)} Hz
            <input
              type="range"
              min="20"
              max="2000"
              step="1"
              value={frequency}
              onChange={(e) => setFrequency(parseFloat(e.target.value))}
            />
          </label>
          <label>
            Wet/Dry: {(wet * 100).toFixed(0)}%
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={wet}
              onChange={(e) => setWet(parseFloat(e.target.value))}
            />
          </label>
        </div>
      )}
    </RingModulator>
  );
}
```

### Controlled Props

```tsx
import { RingModulator } from '@mod-audio/core';
import { useState } from 'react';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);
  const [frequency, setFrequency] = useState(440);
  const [wet, setWet] = useState(0.5);

  return (
    <div>
      <RingModulator
        input={inputRef}
        output={outputRef}
        frequency={frequency}
        onFrequencyChange={setFrequency}
        wet={wet}
        onWetChange={setWet}
      />
      <button onClick={() => setFrequency(220)}>Low</button>
      <button onClick={() => setFrequency(880)}>High</button>
      <button onClick={() => setWet(1)}>Full Wet</button>
      <button onClick={() => setWet(0.3)}>Subtle</button>
    </div>
  );
}
```

### Imperative Refs

```tsx
import { RingModulator } from '@mod-audio/core';
import { useRef } from 'react';

function MyComponent() {
  const inputRef = useRef<ModStreamRef>(null);
  const outputRef = useRef<ModStreamRef>(null);
  const ringModRef = useRef(null);

  const logState = () => {
    if (ringModRef.current) {
      const state = ringModRef.current.getState();
      console.log('RingModulator state:', state);
    }
  };

  return (
    <div>
      <RingModulator
        ref={ringModRef}
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

- Ring modulation creates sum and difference frequencies (f1 + f2 and f1 - f2)
- This produces inharmonic, metallic, and bell-like tones
- The effect is most dramatic with harmonic-rich input signals
- Low frequencies (20-100 Hz) create tremolo-like effects
- Mid frequencies (100-500 Hz) create robotic, metallic sounds
- High frequencies (500-2000 Hz) create bright, dissonant tones
- Wet parameter controls the balance between dry and modulated signal
- Use low wet values (0.2-0.4) for subtle character changes
- Use high wet values (0.7-1.0) for dramatic, sci-fi effects
- Classic ring mod sounds: Dalek voices, sci-fi lasers, bell tones

## Related

- [Tremolo](./tremolo.md) - Amplitude modulation effect
- [Phaser](./phaser.md) - Phase modulation effect
- [Chorus](./chorus.md) - Pitch and time modulation
