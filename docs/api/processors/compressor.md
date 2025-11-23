# Compressor

The `Compressor` component controls the dynamic range of audio signals, reducing the volume of loud parts while leaving quieter parts unchanged. Essential for mixing and mastering.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `input` | `ModStreamRef` | Required | Audio signal to compress |
| `output` | `ModStreamRef` | Required | Compressed audio output |
| `label` | `string` | `'compressor'` | Label for the component in metadata |
| `threshold` | `number` | `-24` | Threshold in dB (controlled or initial value) |
| `onThresholdChange` | `(threshold: number) => void` | `-` | Callback when threshold changes |
| `knee` | `number` | `30` | Knee width (controlled or initial value) |
| `onKneeChange` | `(knee: number) => void` | `-` | Callback when knee changes |
| `ratio` | `number` | `12` | Compression ratio (controlled or initial value) |
| `onRatioChange` | `(ratio: number) => void` | `-` | Callback when ratio changes |
| `attack` | `number` | `0.003` | Attack time in seconds (controlled or initial value) |
| `onAttackChange` | `(attack: number) => void` | `-` | Callback when attack changes |
| `release` | `number` | `0.25` | Release time in seconds (controlled or initial value) |
| `onReleaseChange` | `(release: number) => void` | `-` | Callback when release changes |
| `enabled` | `boolean` | `true` | Whether the component is enabled or bypassed |
| `onEnabledChange` | `(enabled: boolean) => void` | `-` | Callback when enabled state changes |
| `children` | `function` | - | Render prop function receiving control props |

## Render Props

When using the `children` render prop, the following controls are provided:

| Property | Type | Description |
|----------|------|-------------|
| `threshold` | `number` | Threshold in dB (-100 to 0) |
| `setThreshold` | `(value: number) => void` | Update the threshold |
| `knee` | `number` | Knee width in dB (0 to 40) |
| `setKnee` | `(value: number) => void` | Update the knee |
| `ratio` | `number` | Compression ratio (1 to 20) |
| `setRatio` | `(value: number) => void` | Update the ratio |
| `attack` | `number` | Attack time in seconds (0 to 1) |
| `setAttack` | `(value: number) => void` | Update the attack time |
| `release` | `number` | Release time in seconds (0 to 1) |
| `setRelease` | `(value: number) => void` | Update the release time |
| `enabled` | `boolean` | Whether the component is enabled |
| `setEnabled` | `(value: boolean) => void` | Toggle enabled/bypass state |
| `isActive` | `boolean` | Whether the compressor is active |

## Usage

### Basic Usage

```tsx
import { Microphone, Compressor, Monitor } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const micOut = useRef(null);
  const compOut = useRef(null);

  return (
    <>
      <Microphone output={micOut} />
      <Compressor input={micOut} output={compOut} />
      <Monitor input={compOut} />
    </>
  );
}
```

### With UI Controls

```tsx
import { Compressor } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const inputRef = useRef(null);
  const compOut = useRef(null);

  return (
    <Compressor input={inputRef} output={compOut}>
      {({
        threshold,
        setThreshold,
        knee,
        setKnee,
        ratio,
        setRatio,
        attack,
        setAttack,
        release,
        setRelease
      }) => (
        <div>
          <div>
            <label>Threshold: {threshold.toFixed(1)} dB</label>
            <input
              type="range"
              min="-60"
              max="0"
              step="0.1"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
          </div>

          <div>
            <label>Ratio: {ratio.toFixed(1)}:1</label>
            <input
              type="range"
              min="1"
              max="20"
              step="0.1"
              value={ratio}
              onChange={(e) => setRatio(Number(e.target.value))}
            />
          </div>

          <div>
            <label>Knee: {knee.toFixed(1)} dB</label>
            <input
              type="range"
              min="0"
              max="40"
              step="0.1"
              value={knee}
              onChange={(e) => setKnee(Number(e.target.value))}
            />
          </div>

          <div>
            <label>Attack: {(attack * 1000).toFixed(1)} ms</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={attack}
              onChange={(e) => setAttack(Number(e.target.value))}
            />
          </div>

          <div>
            <label>Release: {(release * 1000).toFixed(0)} ms</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={release}
              onChange={(e) => setRelease(Number(e.target.value))}
            />
          </div>
        </div>
      )}
    </Compressor>
  );
}
```

### Compressor Presets

```tsx
import { Compressor } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const inputRef = useRef(null);
  const compOut = useRef(null);

  const presets = {
    vocal: {
      threshold: -18,
      ratio: 4,
      knee: 10,
      attack: 0.005,
      release: 0.05
    },
    drums: {
      threshold: -12,
      ratio: 6,
      knee: 5,
      attack: 0.001,
      release: 0.1
    },
    bass: {
      threshold: -20,
      ratio: 8,
      knee: 15,
      attack: 0.01,
      release: 0.2
    },
    master: {
      threshold: -10,
      ratio: 2,
      knee: 6,
      attack: 0.003,
      release: 0.1
    },
    limiter: {
      threshold: -3,
      ratio: 20,
      knee: 0,
      attack: 0.001,
      release: 0.05
    }
  };

  return (
    <Compressor input={inputRef} output={compOut}>
      {({ setThreshold, setRatio, setKnee, setAttack, setRelease }) => (
        <div>
          <h3>Presets:</h3>
          {Object.entries(presets).map(([name, settings]) => (
            <button
              key={name}
              onClick={() => {
                setThreshold(settings.threshold);
                setRatio(settings.ratio);
                setKnee(settings.knee);
                setAttack(settings.attack);
                setRelease(settings.release);
              }}
            >
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>
      )}
    </Compressor>
  );
}
```

### Mastering Chain

```tsx
import { MP3Deck, EQ, Compressor, Monitor } from '@mode-7/mod';
import { useRef } from 'react';

function App() {
  const deckOut = useRef(null);
  const eqOut = useRef(null);
  const compOut = useRef(null);

  return (
    <>
      <MP3Deck output={deckOut}>
        {({ loadFile }) => (
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) loadFile(file);
            }}
          />
        )}
      </MP3Deck>

      <EQ input={deckOut} output={eqOut} />

      <Compressor input={eqOut} output={compOut}>
        {({ setThreshold, setRatio, setKnee, setAttack, setRelease }) => {
          React.useEffect(() => {
            // Master bus compression settings
            setThreshold(-10);
            setRatio(2);
            setKnee(6);
            setAttack(0.003);
            setRelease(0.1);
          }, []);
          return null;
        }}
      </Compressor>

      <Monitor input={compOut} />
    </>
  );
}
```

### Controlled Props

Manage compressor state externally using controlled props:

```tsx
import { Compressor } from '@mode-7/mod';
import { useRef, useState } from 'react';

function App() {
  const inputRef = useRef(null);
  const compOut = useRef(null);

  const [threshold, setThreshold] = useState(-24);
  const [ratio, setRatio] = useState(4);
  const [attack, setAttack] = useState(0.003);
  const [release, setRelease] = useState(0.25);

  return (
    <>
      <Compressor
        input={inputRef}
        output={compOut}
        threshold={threshold}
        onThresholdChange={setThreshold}
        ratio={ratio}
        onRatioChange={setRatio}
        attack={attack}
        onAttackChange={setAttack}
        release={release}
        onReleaseChange={setRelease}
      />

      <div>
        <label>Threshold: {threshold.toFixed(1)} dB</label>
        <input
          type="range"
          min="-60"
          max="0"
          step="0.1"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
        />
      </div>

      <div>
        <label>Ratio: {ratio.toFixed(1)}:1</label>
        <input
          type="range"
          min="1"
          max="20"
          step="0.1"
          value={ratio}
          onChange={(e) => setRatio(Number(e.target.value))}
        />
      </div>
    </>
  );
}
```

### Imperative Refs

For programmatic access to state, you can use refs:

```tsx
import { Compressor, CompressorHandle, Monitor } from '@mode-7/mod';
import { useRef, useEffect } from 'react';

function App() {
  const compressorRef = useRef<CompressorHandle>(null);
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  useEffect(() => {
    // Access current state
    if (compressorRef.current) {
      const state = compressorRef.current.getState();
      console.log('threshold:', state.threshold);
      console.log('knee:', state.knee);
      console.log('ratio:', state.ratio);
      console.log('attack:', state.attack);
      console.log('release:', state.release);
    }
  }, []);

  return (
    <>
      <SomeSource output={inputRef} />
      <Compressor
        ref={compressorRef}
        input={inputRef}
        output={outputRef}
      />
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
import { Compressor } from '@mode-7/mod';
import { useState } from 'react';

function App() {
  const [enabled, setEnabled] = useState(true);

  return (
    <Compressor
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
<Compressor input={input} output={output}>
  {({ enabled, setEnabled, threshold, setThreshold, ratio, setRatio, attack, setAttack, release, setRelease }) => (
    <div>
      <button onClick={() => setEnabled(!enabled)}>
        {enabled ? 'Bypass' : 'Enable'}
      </button>
      {/* Other controls */}
    </div>
  )}
</Compressor>
```

## Important Notes

### Threshold

- The level (in dB) at which compression begins
- Signals above this level are compressed
- Typical range: -30 dB to -10 dB
- Lower threshold = more compression

### Ratio

- How much the signal is reduced above the threshold
- 2:1 = gentle compression
- 4:1 = moderate compression
- 8:1+ = heavy compression
- 20:1 = limiting (brick wall)

### Knee

- Smoothness of the compression transition
- 0 dB = hard knee (abrupt)
- 10-20 dB = soft knee (gradual)
- Soft knee sounds more natural

### Attack Time

- How quickly compression activates after exceeding threshold
- Fast (0-5ms): Catches transients, can sound pumpy
- Medium (5-20ms): Natural, transparent
- Slow (20ms+): Lets transients through, more punch

### Release Time

- How quickly compression stops after signal drops below threshold
- Fast (50-100ms): Responsive, can sound pumpy
- Medium (100-300ms): Natural balance
- Slow (300ms+): Smooth, glue-like effect

### Default Values

- Threshold: -24 dB
- Knee: 30 dB
- Ratio: 12:1
- Attack: 3 ms (0.003s)
- Release: 250 ms (0.25s)

::: tip General Guidelines
- Start with a low ratio (2-4:1) and adjust
- Use fast attack for drums, slower for vocals
- Match release time to the rhythm of the music
- Use makeup gain (increase input gain) to compensate for level reduction
:::

## Related

- [Distortion](/api/processors/distortion) - Add harmonics and saturation
- [EQ](/api/processors/eq) - Shape frequency balance
- [Monitor](/api/output/monitor) - Control output levels
