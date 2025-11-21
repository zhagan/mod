# Output

Output modules send audio to the speakers and provide monitoring capabilities.

## Monitor Component

The Monitor component connects audio to your speakers and provides master volume and mute controls.

**API**: [Monitor](/api/output/monitor)

### Basic Usage

```tsx
const audio = useModStream();

<ToneGenerator output={audio} />

<Monitor input={audio}>
  {({ gain, setGain, isMuted, setMuted }) => (
    <div>
      <Slider
        value={gain}
        onChange={setGain}
        min={0}
        max={2}
        label="Master Volume"
      />
      <Button
        active={isMuted}
        onClick={() => setMuted(!isMuted)}
        variant={isMuted ? 'danger' : 'default'}
      >
        {isMuted ? 'Unmuted' : 'Mute'}
      </Button>
    </div>
  )}
</Monitor>
```

### Features

- **Master gain control**: 0-2x volume (0-200%)
- **Mute function**: Instantly silence output
- **Automatic connection**: Connects to AudioContext destination (speakers)

## Multiple Monitors

You can have multiple Monitor components, but they all connect to the same output (speakers):

```tsx
const channelA = useModStream();
const channelB = useModStream();

<ToneGenerator output={channelA} />
<ToneGenerator output={channelB} />

<Monitor input={channelA} />
<Monitor input={channelB} />
```

Both signals will be mixed together at the output.

## Master Section Pattern

Create a master output section with level metering and visualization:

```tsx
const masterBus = useModStream();

<Mixer inputs={[ch1, ch2, ch3, ch4]} output={masterBus} />

<div className="master-section">
  <h2>Master Output</h2>

  {/* Level meter */}
  <LevelMeter input={masterBus}>
    {({ level, peak, isClipping }) => (
      <div>
        <LevelMeterCanvas
          level={level}
          peak={peak}
          isClipping={isClipping}
        />
        {isClipping && <div className="warning">CLIPPING!</div>}
      </div>
    )}
  </LevelMeter>

  {/* Spectrum analyzer */}
  <SpectrumAnalyzer input={masterBus}>
    {({ dataArray, bufferLength }) => (
      <SpectrumAnalyzerCanvas
        dataArray={dataArray}
        bufferLength={bufferLength}
      />
    )}
  </SpectrumAnalyzer>

  {/* Monitor controls */}
  <Monitor input={masterBus}>
    {({ gain, setGain, isMuted, setMuted }) => (
      <div className="master-controls">
        <Slider
          value={gain}
          onChange={setGain}
          min={0}
          max={2}
          step={0.01}
          label={`Master: ${(gain * 100).toFixed(0)}%`}
        />
        <Button
          onClick={() => setMuted(!isMuted)}
          active={isMuted}
          variant={isMuted ? 'danger' : 'success'}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </Button>
      </div>
    )}
  </Monitor>
</div>
```

## Limiter Protection

Add a limiter before the monitor to prevent clipping:

```tsx
const mixed = useModStream();
const limited = useModStream();

<Mixer inputs={[ch1, ch2, ch3]} output={mixed} />

<Limiter input={mixed} output={limited} threshold={-0.3} />

<Monitor input={limited} />
```

## Best Practices

### Always Have a Monitor

Every signal chain should end with a Monitor:

```tsx
// ✅ Good
<ToneGenerator output={signal} />
<Monitor input={signal} />

// ❌ Bad - No monitor, no sound!
<ToneGenerator output={signal} />
```

### Master Volume Control

Keep master gain reasonable (0-1 range typically):

```tsx
<Monitor input={signal}>
  {({ gain, setGain }) => (
    <Slider
      value={gain}
      onChange={setGain}
      min={0}
      max={1}  // Don't go above 1 unless needed
      step={0.01}
    />
  )}
</Monitor>
```

### Mute for Safety

Always provide a mute button for safety:

```tsx
<Button onClick={() => setMuted(true)} variant="danger">
  Emergency Mute
</Button>
```

## Next Steps

- Build a [simple synthesizer](/guide/examples/simple-synth)
- Learn about [visualizations](/api/visualizations/oscilloscope)
- Explore the [Monitor API](/api/output/monitor)
