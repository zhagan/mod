# LFO Modulation

Learn how to use LFOs to create movement and expression in your sounds.

## What We'll Build

A demonstration of various LFO modulation techniques:
- Filter cutoff modulation
- Amplitude modulation (tremolo)
- Pitch modulation (vibrato)
- Panning modulation

## Complete Code

```tsx
import {
  AudioProvider,
  ToneGenerator,
  LFO,
  Filter,
  Tremolo,
  Panner,
  Monitor,
  useModStream,
  Slider,
  Select,
  Knob
} from '@mode-7/mod';

function LFOModulation() {
  const audio = useModStream();
  const filterLFO = useModStream();
  const tremoloLFO = useModStream();
  const panLFO = useModStream();
  
  const step1 = useModStream();
  const step2 = useModStream();
  const step3 = useModStream();

  return (
    <AudioProvider>
      <div className="lfo-demo">
        <h1>LFO Modulation Examples</h1>

        {/* Sound source */}
        <div className="source">
          <h2>Sound Source</h2>
          <ToneGenerator output={audio}>
            {({ frequency, setFrequency, type, setType }) => (
              <div>
                <Slider
                  value={frequency}
                  onChange={setFrequency}
                  min={20}
                  max={2000}
                  label="Frequency"
                />
                <Select
                  value={type}
                  onChange={setType}
                  options={[
                    { value: 'sine', label: 'Sine' },
                    { value: 'sawtooth', label: 'Sawtooth' },
                    { value: 'square', label: 'Square' },
                  ]}
                />
              </div>
            )}
          </ToneGenerator>
        </div>

        {/* Filter Modulation */}
        <div className="modulation-section">
          <h2>Filter Modulation</h2>
          
          <LFO output={filterLFO}>
            {({ rate, setRate, waveform, setWaveform }) => (
              <div>
                <h3>Filter LFO</h3>
                <Knob
                  value={rate}
                  onChange={setRate}
                  min={0.1}
                  max={20}
                  step={0.1}
                  label="Rate (Hz)"
                />
                <Select
                  value={waveform}
                  onChange={setWaveform}
                  options={[
                    { value: 'sine', label: 'Sine' },
                    { value: 'triangle', label: 'Triangle' },
                    { value: 'square', label: 'Square' },
                    { value: 'sawtooth', label: 'Sawtooth' },
                  ]}
                />
              </div>
            )}
          </LFO>

          <Filter
            input={audio}
            output={step1}
            cvInput={filterLFO}
            cvTarget="frequency"
            cvAmount={5000}
          >
            {({ frequency, setFrequency, Q, setQ }) => (
              <div>
                <h3>Filter</h3>
                <Slider
                  value={frequency}
                  onChange={setFrequency}
                  min={200}
                  max={10000}
                  label="Center Freq"
                />
                <Slider
                  value={Q}
                  onChange={setQ}
                  min={0.1}
                  max={20}
                  step={0.1}
                  label="Resonance"
                />
              </div>
            )}
          </Filter>
        </div>

        {/* Tremolo (Amplitude Modulation) */}
        <div className="modulation-section">
          <h2>Tremolo (Amplitude)</h2>
          
          <LFO output={tremoloLFO}>
            {({ rate, setRate }) => (
              <div>
                <h3>Tremolo LFO</h3>
                <Knob
                  value={rate}
                  onChange={setRate}
                  min={0.5}
                  max={20}
                  step={0.1}
                  label="Rate (Hz)"
                />
              </div>
            )}
          </LFO>

          <Tremolo
            input={step1}
            output={step2}
            cvInput={tremoloLFO}
            cvTarget="depth"
          >
            {({ depth, setDepth }) => (
              <div>
                <h3>Tremolo</h3>
                <Slider
                  value={depth}
                  onChange={setDepth}
                  min={0}
                  max={1}
                  step={0.01}
                  label="Depth"
                />
              </div>
            )}
          </Tremolo>
        </div>

        {/* Auto-Pan */}
        <div className="modulation-section">
          <h2>Auto-Pan</h2>
          
          <LFO output={panLFO}>
            {({ rate, setRate }) => (
              <div>
                <h3>Pan LFO</h3>
                <Knob
                  value={rate}
                  onChange={setRate}
                  min={0.1}
                  max={10}
                  step={0.1}
                  label="Rate (Hz)"
                />
              </div>
            )}
          </LFO>

          <Panner
            input={step2}
            output={step3}
            cvInput={panLFO}
            cvTarget="pan"
            cvAmount={1}
          >
            {({ pan, setPan }) => (
              <div>
                <h3>Panner</h3>
                <Slider
                  value={pan}
                  onChange={setPan}
                  min={-1}
                  max={1}
                  step={0.01}
                  label="Center Pan"
                />
              </div>
            )}
          </Panner>
        </div>

        {/* Output */}
        <Monitor input={step3}>
          {({ gain, setGain }) => (
            <div className="master">
              <h2>Master</h2>
              <Slider
                value={gain}
                onChange={setGain}
                min={0}
                max={1}
                step={0.01}
                label="Volume"
              />
            </div>
          )}
        </Monitor>
      </div>
    </AudioProvider>
  );
}

export default LFOModulation;
```

## Signal Flow

```
                    Filter LFO (CV)
                          ↓
Tone → Filter → Tremolo → Panner → Monitor
                  ↓         ↓
            Tremolo LFO  Pan LFO
               (CV)       (CV)
```

## Key Concepts

### LFO Rate

The speed of modulation:
- **0.1-2 Hz**: Slow, sweeping effects
- **2-10 Hz**: Moderate, noticeable movement
- **10-20 Hz**: Fast, vibrato-like effects

### LFO Waveforms

Different shapes create different feels:
- **Sine**: Smooth, natural
- **Triangle**: Linear sweep
- **Square**: Abrupt switching
- **Sawtooth**: Ramp effect

### CV Amount

Controls the intensity of modulation. Start subtle and increase to taste.

## Variations

### Vibrato
```tsx
<LFO output={lfo} rate={5} />
<ToneGenerator
  output={audio}
  frequency={440}
  cvInput={lfo}
  cvTarget="frequency"
  cvAmount={10}  // ±10Hz wobble
/>
```

### Wah Effect
```tsx
<LFO output={lfo} rate={0.3} waveform="sine" />
<Filter
  input={audio}
  output={output}
  type="bandpass"
  cvInput={lfo}
  cvTarget="frequency"
  cvAmount={3000}
  frequency={1000}
  Q={10}
/>
```

## Next Steps

- Explore [CV Modulation guide](/guide/cv-modulation)
- Try [Rhythmic Patterns](/guide/examples/rhythmic-patterns)
- Learn about [CV Generators](/guide/cv-generators)
