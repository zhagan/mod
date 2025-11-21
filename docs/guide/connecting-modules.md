# Connecting Modules

Learning how to connect mod components together is essential for building audio applications. This guide covers all the patterns for routing audio signals.

## Basic Connections

### The useModStream Hook

Create refs for audio connections using `useModStream()`:

```tsx
import { useModStream } from '@mode-7/mod';

function App() {
  const audioOut = useModStream();

  return (
    <>
      <ToneGenerator output={audioOut} />
      <Monitor input={audioOut} />
    </>
  );
}
```

### Simple Chain

Connect source → output:

```tsx
function SimpleChain() {
  const signal = useModStream();

  return (
    <>
      <ToneGenerator output={signal} />
      <Monitor input={signal} />
    </>
  );
}
```

Signal flow: **ToneGenerator → Monitor → Speakers**

### Adding Effects

Connect source → processor → output:

```tsx
function WithEffect() {
  const dry = useModStream();    // Unprocessed signal
  const wet = useModStream();    // Processed signal

  return (
    <>
      <ToneGenerator output={dry} />
      <Filter input={dry} output={wet} />
      <Monitor input={wet} />
    </>
  );
}
```

Signal flow: **ToneGenerator → Filter → Monitor → Speakers**

## Multiple Effects

Chain multiple processors together:

```tsx
function EffectsChain() {
  const source = useModStream();
  const filtered = useModStream();
  const delayed = useModStream();
  const final = useModStream();

  return (
    <>
      <ToneGenerator output={source} />
      <Filter input={source} output={filtered} />
      <Delay input={filtered} output={delayed} />
      <Reverb input={delayed} output={final} />
      <Monitor input={final} />
    </>
  );
}
```

Signal flow: **Tone → Filter → Delay → Reverb → Monitor**

## Parallel Connections

### Multiple Sources

Mix multiple sources together:

```tsx
function MultipleSources() {
  const tone1 = useModStream();
  const tone2 = useModStream();
  const mixed = useModStream();

  return (
    <>
      <ToneGenerator output={tone1} frequency={440} />
      <ToneGenerator output={tone2} frequency={554.37} />

      <Mixer inputs={[tone1, tone2]} output={mixed} />
      <Monitor input={mixed} />
    </>
  );
}
```

Signal flow:
```
Tone1 (A) ─┐
           ├─→ Mixer → Monitor
Tone2 (C#)─┘
```

### Parallel Effects

Send one source to multiple effects:

```tsx
function ParallelEffects() {
  const source = useModStream();
  const reverbed = useModStream();
  const distorted = useModStream();
  const mixed = useModStream();

  return (
    <>
      <NoiseGenerator output={source} />

      {/* Split to two effects */}
      <Reverb input={source} output={reverbed} />
      <Distortion input={source} output={distorted} />

      {/* Mix results */}
      <Mixer inputs={[reverbed, distorted]} output={mixed} />
      <Monitor input={mixed} />
    </>
  );
}
```

Signal flow:
```
           ┌─→ Reverb ────┐
Noise ─────┤              ├─→ Mixer → Monitor
           └─→ Distortion ┘
```

## Complex Routing

### Crossfading

Blend between two sources:

```tsx
function Crossfader() {
  const sourceA = useModStream();
  const sourceB = useModStream();
  const output = useModStream();

  return (
    <>
      <ToneGenerator output={sourceA} frequency={220} />
      <NoiseGenerator output={sourceB} type="white" />

      <CrossFade
        inputA={sourceA}
        inputB={sourceB}
        output={output}
      >
        {({ position, setPosition }) => (
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={position}
            onChange={e => setPosition(+e.target.value)}
          />
        )}
      </CrossFade>

      <Monitor input={output} />
    </>
  );
}
```

### Multi-Channel Mixer

Complex mixing with multiple channels:

```tsx
function MixerBoard() {
  const ch1 = useModStream();
  const ch2 = useModStream();
  const ch3 = useModStream();
  const ch4 = useModStream();
  const master = useModStream();

  return (
    <>
      {/* Sources */}
      <ToneGenerator output={ch1} frequency={220} />
      <ToneGenerator output={ch2} frequency={330} />
      <ToneGenerator output={ch3} frequency={440} />
      <ToneGenerator output={ch4} frequency={550} />

      {/* Mixer */}
      <Mixer inputs={[ch1, ch2, ch3, ch4]} output={master}>
        {({ levels, setLevel }) => (
          <div>
            {levels.map((level, i) => (
              <div key={i}>
                <label>Channel {i + 1}</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={level}
                  onChange={e => setLevel(i, +e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </Mixer>

      <Monitor input={master} />
    </>
  );
}
```

## Send/Return Effects

Create a send-return effect loop:

```tsx
function SendReturn() {
  const source = useModStream();
  const send = useModStream();
  const return_ = useModStream();
  const mixed = useModStream();

  return (
    <>
      <ToneGenerator output={source} />

      {/* Main signal continues */}
      {/* But also sent to effect */}

      {/* Effect chain (send/return) */}
      <Reverb input={source} output={return_} />

      {/* Mix dry + wet */}
      <Mixer inputs={[source, return_]} output={mixed}>
        {({ levels, setLevel }) => (
          <div>
            <label>Dry</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={levels[0]}
              onChange={e => setLevel(0, +e.target.value)}
            />
            <label>Wet (Reverb)</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={levels[1]}
              onChange={e => setLevel(1, +e.target.value)}
            />
          </div>
        )}
      </Mixer>

      <Monitor input={mixed} />
    </>
  );
}
```

Signal flow:
```
         ┌─────────────────┐
Tone ────┼─→ Reverb ───┐   │
         │             ↓   ↓
         └──────────→ Mixer → Monitor
         (dry)       (wet)
```

## Visualizations

Connect visualizations to any point in your signal chain:

```tsx
function WithVisuals() {
  const source = useModStream();
  const processed = useModStream();

  return (
    <>
      <ToneGenerator output={source} />

      {/* Visualize source */}
      <Oscilloscope input={source}>
        {({ dataArray, bufferLength }) => (
          <OscilloscopeCanvas
            dataArray={dataArray}
            bufferLength={bufferLength}
          />
        )}
      </Oscilloscope>

      <Filter input={source} output={processed} />

      {/* Visualize after filter */}
      <SpectrumAnalyzer input={processed}>
        {({ dataArray, bufferLength }) => (
          <SpectrumAnalyzerCanvas
            dataArray={dataArray}
            bufferLength={bufferLength}
          />
        )}
      </SpectrumAnalyzer>

      <Monitor input={processed} />
    </>
  );
}
```

Visualizations don't affect the audio signal - they just observe it.

## Multiple Outputs

A single source can connect to multiple destinations:

```tsx
function MultipleOutputs() {
  const source = useModStream();
  const output1 = useModStream();
  const output2 = useModStream();

  return (
    <>
      <NoiseGenerator output={source} />

      {/* Same source to two different effects */}
      <Filter input={source} output={output1} type="lowpass" />
      <Filter input={source} output={output2} type="highpass" />

      {/* Monitor both */}
      <Monitor input={output1} />
      <Monitor input={output2} />
    </>
  );
}
```

Each processor gets the same input signal independently.

## Connection Patterns

### Linear Chain
```
A → B → C → D → Output
```

Use when: Sequential processing needed

### Parallel Processing
```
    ┌→ B ┐
A ──┼→ C ┼→ Mix → Output
    └→ D ┘
```

Use when: Splitting signal to multiple effects

### Layering
```
A ┐
B ├→ Mix → Output
C ┘
```

Use when: Combining multiple sources

### Send/Return
```
A ──┬───────→ Mix → Output
    └→ FX ──→┘
```

Use when: Blending dry/wet signals

## Best Practices

### Organize Your Refs

Use descriptive names:

```tsx
const oscillatorOut = useModStream();
const filteredSignal = useModStream();
const reverbedSignal = useModStream();
const masterOut = useModStream();
```

### Component Organization

Group related modules:

```tsx
function SynthVoice() {
  const voiceOut = useModStream();

  return (
    <>
      {/* Oscillators */}
      <ToneGenerator output={osc1} />
      <ToneGenerator output={osc2} />

      {/* Mixing */}
      <Mixer inputs={[osc1, osc2]} output={mixed} />

      {/* Filtering */}
      <Filter input={mixed} output={voiceOut} />
    </>
  );
}
```

### Avoid Circular Connections

```tsx
// ❌ DON'T: Creates feedback loop
<Filter input={signal} output={signal} />

// ✅ DO: Use separate refs
<Filter input={dry} output={wet} />
```

### Memory Management

Refs are automatically cleaned up, but be mindful of:

```tsx
// Components update → connections rebuild
// Keep connections stable when possible
const stableRef = useModStream(); // ✅ Created once

// Don't create refs conditionally
{condition && useModStream()} // ❌ Bad
```

## Debugging Connections

### Check Ref Contents

```tsx
const signal = useModStream();

useEffect(() => {
  console.log('Signal ref:', signal.current);
  // Shows: { audioNode, gain, context, metadata }
}, [signal]);
```

### Visualize Flow

Add temporary visualizations to debug:

```tsx
<Oscilloscope input={mysterySignal}>
  {({ dataArray }) => (
    <div>Is there signal? {dataArray.some(v => v !== 128) ? 'Yes' : 'No'}</div>
  )}
</Oscilloscope>
```

### Level Monitoring

Check signal levels:

```tsx
<LevelMeter input={signal}>
  {({ level, isClipping }) => (
    <div>
      Level: {level.toFixed(3)}
      {isClipping && ' ⚠️ CLIPPING!'}
    </div>
  )}
</LevelMeter>
```

## Next Steps

- Learn about [CV modulation](/guide/cv-modulation) for parameter automation
- Explore [module types](/guide/sources) in detail
- Build a [complete synthesizer](/guide/examples/simple-synth)
