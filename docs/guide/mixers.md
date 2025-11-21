# Mixers

Mixers combine multiple audio signals into one, allowing you to blend sounds and create complex arrangements.

## Mixer Component

Combines multiple input signals with individual level control for each channel.

**Inputs**: 2-16 channels  
**API**: [Mixer](/api/mixers/mixer)

### Basic Usage

```tsx
const ch1 = useModStream();
const ch2 = useModStream();
const ch3 = useModStream();
const master = useModStream();

<ToneGenerator output={ch1} frequency={220} />
<ToneGenerator output={ch2} frequency={330} />
<ToneGenerator output={ch3} frequency={440} />

<Mixer inputs={[ch1, ch2, ch3]} output={master}>
  {({ levels, setLevel }) => (
    <div>
      {levels.map((level, i) => (
        <div key={i}>
          <label>Channel {i + 1}: {(level * 100).toFixed(0)}%</label>
          <Slider
            value={level}
            onChange={v => setLevel(i, v)}
            min={0}
            max={1}
          />
        </div>
      ))}
    </div>
  )}
</Mixer>

<Monitor input={master} />
```

### Features

- **Individual channel gains**: Control each input's level
- **Master gain**: Overall output level control  
- **Dynamic inputs**: Add/remove channels at runtime

## CrossFade Component

Blends smoothly between two input signals.

**Inputs**: 2 (A and B)  
**Modes**: Linear, equal-power, equal-gain, exponential, DJ cut, smooth-step  
**API**: [CrossFade](/api/mixers/crossfade)

### Basic Usage

```tsx
const sourceA = useModStream();
const sourceB = useModStream();
const output = useModStream();

<ToneGenerator output={sourceA} frequency={220} />
<NoiseGenerator output={sourceB} type="pink" />

<CrossFade inputA={sourceA} inputB={sourceB} output={output}>
  {({ position, setPosition, mode, setMode }) => (
    <div>
      <Slider
        value={position}
        onChange={setPosition}
        min={0}
        max={1}
        label="Crossfade"
      />
      <Select
        value={mode}
        onChange={setMode}
        options={[
          { value: 'equal-power', label: 'Equal Power' },
          { value: 'linear', label: 'Linear' },
          { value: 'dj-cut', label: 'DJ Cut' },
        ]}
      />
    </div>
  )}
</CrossFade>

<Monitor input={output} />
```

### Crossfade Modes

- **equal-power** - Constant perceived loudness (default)
- **linear** - Simple linear fade
- **equal-gain** - Constant amplitude sum
- **exponential** - Exponential curve
- **dj-cut** - Quick transition in middle
- **smooth-step** - Smooth S-curve transition

## Common Patterns

### Layering Multiple Oscillators

```tsx
const osc1 = useModStream();
const osc2 = useModStream();
const osc3 = useModStream();
const mixed = useModStream();

<ToneGenerator output={osc1} frequency={110} type="sawtooth" />
<ToneGenerator output={osc2} frequency={110.5} type="sawtooth" />  // Slight detune
<ToneGenerator output={osc3} frequency={220} type="sine" />

<Mixer inputs={[osc1, osc2, osc3]} output={mixed}>
  {({ levels, setLevel }) => (
    <div>
      <Slider value={levels[0]} onChange={v => setLevel(0, v)} label="Saw 1" />
      <Slider value={levels[1]} onChange={v => setLevel(1, v)} label="Saw 2" />
      <Slider value={levels[2]} onChange={v => setLevel(2, v)} label="Sub" />
    </div>
  )}
</Mixer>
```

### DJ-Style Crossfader

```tsx
const deckA = useModStream();
const deckB = useModStream();
const output = useModStream();

<MP3Deck output={deckA}>
  {({ loadFile, play, pause }) => (
    <div>
      <FilePicker onFileSelect={loadFile} label="Deck A" />
      <Button onClick={play}>Play</Button>
    </div>
  )}
</MP3Deck>

<MP3Deck output={deckB}>
  {({ loadFile, play, pause }) => (
    <div>
      <FilePicker onFileSelect={loadFile} label="Deck B" />
      <Button onClick={play}>Play</Button>
    </div>
  )}
</MP3Deck>

<CrossFade inputA={deckA} inputB={deckB} output={output} mode="dj-cut">
  {({ position, setPosition }) => (
    <Slider
      value={position}
      onChange={setPosition}
      min={0}
      max={1}
      label="Crossfader"
    />
  )}
</CrossFade>
```

### Send/Return Effects Bus

```tsx
const dry1 = useModStream();
const dry2 = useModStream();
const dry3 = useModStream();
const dryMix = useModStream();
const reverbSend = useModStream();
const reverbReturn = useModStream();
const master = useModStream();

{/* Dry signals */}
<ToneGenerator output={dry1} frequency={220} />
<ToneGenerator output={dry2} frequency={330} />
<ToneGenerator output={dry3} frequency={440} />

{/* Mix dry signals */}
<Mixer inputs={[dry1, dry2, dry3]} output={dryMix} />

{/* Send to reverb */}
<Reverb input={dryMix} output={reverbReturn} />

{/* Mix dry + wet */}
<Mixer inputs={[dryMix, reverbReturn]} output={master}>
  {({ levels, setLevel }) => (
    <div>
      <Slider value={levels[0]} onChange={v => setLevel(0, v)} label="Dry" />
      <Slider value={levels[1]} onChange={v => setLevel(1, v)} label="Reverb" />
    </div>
  )}
</Mixer>
```

### Parallel Compression

```tsx
const source = useModStream();
const compressed = useModStream();
const mixed = useModStream();

<NoiseGenerator output={source} />

<Compressor input={source} output={compressed} ratio={4} threshold={-20} />

<Mixer inputs={[source, compressed]} output={mixed}>
  {({ levels, setLevel }) => (
    <div>
      <Slider value={levels[0]} onChange={v => setLevel(0, v)} label="Dry" />
      <Slider value={levels[1]} onChange={v => setLevel(1, v)} label="Compressed" />
    </div>
  )}
</Mixer>
```

## Next Steps

- Learn about [Output](/guide/output)  
- Explore the [Mixer API](/api/mixers/mixer)
- Explore the [CrossFade API](/api/mixers/crossfade)
