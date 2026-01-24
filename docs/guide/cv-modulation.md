# CV Modulation

Control Voltage (CV) modulation allows you to dynamically control parameters using signals from CV generators like LFOs, envelopes, and sequencers. This is key to creating expressive, evolving sounds.

## What is CV?

CV (Control Voltage) is a signal used to control audio parameters. In hardware modular synths, CV is actual voltage controlling things like filter cutoff or oscillator pitch. In mod, it's an audio-rate signal that modulates parameters.

### Audio vs. CV

- **Audio signals**: Audible frequencies (20Hz - 20kHz), sent to speakers
- **CV signals**: Sub-audio or audio-rate control (0.01Hz - 20kHz+), control parameters

## Basic CV Modulation

Connect a CV generator's output to a processor's `cv`:

```tsx
import { ToneGenerator, LFO, Filter, Monitor, useModStream } from '@mode-7/mod';

function BasicModulation() {
  const audio = useModStream();
  const lfo = useModStream();
  const output = useModStream();

  return (
    <>
      <ToneGenerator output={audio} frequency={220} />
      <LFO output={lfo} frequency={2} />

      <Filter
        input={audio}
        output={output}
        cv={lfo}
        cvAmount={5000}
      />

      <Monitor input={output} />
    </>
  );
}
```

This creates an LFO that sweeps the filter cutoff.

## CV Targets

Different components expose different CV targets:

### Filter
- `frequency` - Cutoff frequency
- `Q` - Resonance

### Processors
- Most effect parameters can be modulated
- Check component API docs for available targets

## CV Amount

The `cvAmount` prop controls modulation depth:

```tsx
<Filter
  cv={lfo}
  cvAmount={5000}  // Modulates ±5000Hz
  frequency={1000} // Center frequency
/>
```

With this setup:
- Center: 1000Hz
- Min: 1000 - 5000 = -4000Hz (clamped to minimum)
- Max: 1000 + 5000 = 6000Hz

## LFO Modulation

Low Frequency Oscillators create cyclic modulation:

```tsx
function LFOExample() {
  const audio = useModStream();
  const lfo = useModStream();
  const filtered = useModStream();

  return (
    <>
      <NoiseGenerator output={audio} />

      <LFO output={lfo}>
        {({ frequency, setFrequency, amplitude, setAmplitude, waveform, setWaveform }) => (
          <div>
            <h3>LFO</h3>
            <label>
              Rate: {frequency} Hz
              <input
                type="range"
                min={0.01}
                max={20}
                step={0.01}
                value={frequency}
                onChange={e => setFrequency(+e.target.value)}
              />
            </label>
            <label>
              Depth: {amplitude}
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={amplitude}
                onChange={e => setAmplitude(+e.target.value)}
              />
            </label>
            <label>
              Waveform:
              <select value={waveform} onChange={e => setWaveform(e.target.value)}>
                <option value="sine">Sine</option>
                <option value="triangle">Triangle</option>
                <option value="square">Square</option>
                <option value="sawtooth">Sawtooth</option>
              </select>
            </label>
          </div>
        )}
      </LFO>

      <Filter
        input={audio}
        output={filtered}
        cv={lfo}
        cvAmount={8000}
        frequency={1000}
      />

      <Monitor input={filtered} />
    </>
  );
}
```

### LFO Waveforms

Different waveforms create different modulation patterns:

- **Sine**: Smooth, natural wobble
- **Triangle**: Linear sweep up/down
- **Square**: Abrupt on/off switching
- **Sawtooth**: Ramp up, instant reset

## Envelope Modulation

ADSR envelopes create one-shot modulation curves:

```tsx
function EnvelopeExample() {
  const audio = useModStream();
  const envelope = useModStream();
  const filtered = useModStream();

  return (
    <>
      <NoiseGenerator output={audio} />

      <ADSR output={envelope}>
        {({ trigger, attack, decay, sustain, release }) => (
          <div>
            <button onClick={trigger}>Trigger</button>
            {/* ADSR controls... */}
          </div>
        )}
      </ADSR>

      <Filter
        input={audio}
        output={filtered}
        cv={envelope}
        cvAmount={10000}
        frequency={100}
      />

      <Monitor input={filtered} />
    </>
  );
}
```

When triggered, the envelope:
1. **Attack**: Rises from 0 to 1
2. **Decay**: Falls to sustain level
3. **Sustain**: Holds at sustain level
4. **Release**: Falls back to 0 when released

## Multiple Modulators

Apply multiple CV sources to the same parameter by cascading:

```tsx
function MultipleModulators() {
  const audio = useModStream();
  const lfo1 = useModStream();
  const lfo2 = useModStream();
  const mod1 = useModStream();
  const mod2 = useModStream();

  return (
    <>
      <ToneGenerator output={audio} />

      <LFO output={lfo1} frequency={0.5} />
      <LFO output={lfo2} frequency={5} />

      {/* First modulation */}
      <Filter
        input={audio}
        output={mod1}
        cv={lfo1}
        cvAmount={2000}
      />

      {/* Second modulation */}
      <Filter
        input={mod1}
        output={mod2}
        cv={lfo2}
        cvAmount={500}
      />

      <Monitor input={mod2} />
    </>
  );
}
```

## Sequencer Modulation

Sequencers create stepped patterns:

```tsx
function SequencerModulation() {
  const audio = useModStream();
  const seq = useModStream();
  const clock = useModStream();
  const output = useModStream();

  return (
    <>
      <ToneGenerator output={audio} frequency={110} />

      <Clock output={clock}>
        {({ start }) => <button onClick={start}>Start</button>}
      </Clock>

      <Sequencer output={seq} clock={clock}>
        {({ steps, setSteps }) => (
          <div>
            {steps.map((step, i) => (
              <input
                key={i}
                type="range"
                min={-12}
                max={12}
                step={1}
                value={step.value}
                onChange={(e) => {
                  const next = [...steps];
                  next[i] = { ...next[i], value: Number(e.target.value), active: true };
                  setSteps(next);
                }}
              />
            ))}
          </div>
        )}
      </Sequencer>

      <Filter
        input={audio}
        output={output}
        cv={seq}
        cvAmount={5000}
        frequency={500}
      />

      <Monitor input={output} />
    </>
  );
}
```

## Clock Synchronization

Use Clock to sync multiple modulators:

```tsx
function SyncedModulation() {
  const clock = useModStream();
  const lfo1 = useModStream();
  const lfo2 = useModStream();

  return (
    <>
      <Clock output={clock} bpm={120}>
        {({ start }) => <button onClick={start}>Start</button>}
      </Clock>

      {/* Both LFOs share the same tempo-derived rate */}
      <LFO output={lfo1} frequency={2} />
      <LFO output={lfo2} frequency={4} />

      {/* Use lfo1 and lfo2 for modulation... */}
    </>
  );
}
```

## Common Modulation Patterns

### Vibrato
Pitch modulation using LFO:

```tsx
<LFO output={lfo} frequency={5} />
<ToneGenerator
  output={audio}
  cv={lfo}
  cvAmount={10}  // ±10Hz wiggle
  frequency={440}
/>
```

### Tremolo
Amplitude modulation using LFO:

```tsx
<LFO output={lfo} frequency={4} />
<ToneGenerator output={audio} frequency={440} />
<Tremolo
  input={audio}
  output={output}
  cv={lfo}
  cvAmount={0.8}
/>
```

### Filter Sweep
Envelope-controlled filter:

```tsx
<ADSR output={env} attack={0.1} decay={0.3} sustain={0.2} release={0.5} />
<Filter
  input={audio}
  output={output}
  cv={env}
  cvAmount={8000}
  frequency={100}
/>
```

### Rhythmic Gating
Sequencer-controlled gain:

```tsx
<Clock output={clock}>
  {({ start }) => <button onClick={start}>Start</button>}
</Clock>
<Sequencer
  output={seq}
  clock={clock}
  steps={[0, 2, 4, 6].map((index) => ({
    active: true,
    value: index / 8,
    lengthPct: 80,
    slide: false,
    accent: false,
  }))}
/>
<Gate
  input={audio}
  output={output}
  cv={seq}
  cvAmount={-40}  // dB
/>
```

## Best Practices

1. **Start subtle**: Begin with small `cvAmount` values
2. **Match rates**: Keep LFO rates musical (divisions of tempo)
3. **Layer modulation**: Combine slow and fast modulators
4. **Visualize**: Use oscilloscope to see modulation
5. **Automate**: Use ADSR for dynamic changes

## Debugging CV

### Check CV Signal

```tsx
<Oscilloscope input={cvSignal}>
  {({ dataArray, bufferLength }) => (
    <OscilloscopeCanvas dataArray={dataArray} bufferLength={bufferLength} />
  )}
</Oscilloscope>
```

### Monitor Levels

```tsx
<LevelMeter input={cvSignal}>
  {({ level }) => <div>CV Level: {level.toFixed(3)}</div>}
</LevelMeter>
```

## Next Steps

- Explore [CV Generators](/guide/cv-generators) in detail
- Learn about [Processors](/guide/processors)
- Build [LFO Modulation example](/guide/examples/lfo-modulation)
