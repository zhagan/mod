# LevelMeterCanvas

A canvas-based level meter visualization component for displaying audio levels with peak indicators, clipping detection, and optional dB scale markings.

## Features

- Real-time RMS level and peak level display
- Clipping detection with visual feedback
- Horizontal and vertical orientations
- Color gradient from green to red based on level
- Peak hold indicator
- Optional dB scale markings
- Glow effects on clipping
- Responsive sizing with device pixel ratio support
- Completely customizable via className and style props

## Import

```tsx
import { LevelMeterCanvas } from '@mode-7/mod';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `level` | `number` | Required | Current RMS level (0-1) |
| `peak` | `number` | Required | Peak level (0-1) |
| `isClipping` | `boolean` | Required | Whether audio is clipping |
| `width` | `number \| string` | `'100%'` | Canvas width |
| `height` | `number \| string` | `60` | Canvas height |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Meter orientation |
| `backgroundColor` | `string` | `'#0a0a0a'` | Canvas background color |
| `showScale` | `boolean` | `true` | Show dB scale markings |
| `className` | `string` | `''` | Additional CSS classes for container |
| `canvasClassName` | `string` | `''` | Additional CSS classes for canvas |

## Usage

### Basic Usage with LevelMeter Component

```tsx
import { LevelMeter, LevelMeterCanvas, useModStream } from '@mode-7/mod';

function AudioLevelDisplay() {
  const input = useModStream();

  return (
    <LevelMeter input={input}>
      {({ level, peak, isClipping }) => (
        <LevelMeterCanvas
          level={level}
          peak={peak}
          isClipping={isClipping}
        />
      )}
    </LevelMeter>
  );
}
```

### Horizontal Meter (Default)

```tsx
<LevelMeterCanvas
  level={level}
  peak={peak}
  isClipping={isClipping}
  orientation="horizontal"
  height={60}
/>
```

### Vertical Meter

```tsx
<LevelMeterCanvas
  level={level}
  peak={peak}
  isClipping={isClipping}
  orientation="vertical"
  width={40}
  height={200}
/>
```

### Without Scale

```tsx
<LevelMeterCanvas
  level={level}
  peak={peak}
  isClipping={isClipping}
  showScale={false}
/>
```

### Custom Size

```tsx
<LevelMeterCanvas
  level={level}
  peak={peak}
  isClipping={isClipping}
  width={600}
  height={80}
/>
```

### Custom Background

```tsx
<LevelMeterCanvas
  level={level}
  peak={peak}
  isClipping={isClipping}
  backgroundColor="#000000"
/>
```

## Complete Integration Example

```tsx
import {
  AudioProvider,
  ToneGenerator,
  LevelMeter,
  LevelMeterCanvas,
  Slider,
  useModStream
} from '@mode-7/mod';
import { useState } from 'react';

function AudioLevelMonitor() {
  const output = useModStream();
  const [gain, setGain] = useState(0.5);

  return (
    <AudioProvider>
      <div className="level-monitor">
        <ToneGenerator
          output={output}
          frequency={440}
          gain={gain}
          onGainChange={setGain}
        />

        <Slider
          value={gain}
          onChange={setGain}
          min={0}
          max={1}
          step={0.01}
          label="Gain"
        />

        <LevelMeter input={output}>
          {({ level, peak, isClipping }) => (
            <LevelMeterCanvas
              level={level}
              peak={peak}
              isClipping={isClipping}
            />
          )}
        </LevelMeter>
      </div>
    </AudioProvider>
  );
}
```

## CSS Classes

The LevelMeterCanvas component uses the following CSS classes:

- `.modui-level-meter` - Container element
- `.modui-level-meter-horizontal` - Applied for horizontal orientation
- `.modui-level-meter-vertical` - Applied for vertical orientation
- `.modui-level-meter-canvas` - Canvas element

## Styling Examples

### Custom Container

```css
.custom-meter {
  border: 2px solid #3949ab;
  border-radius: 8px;
  overflow: hidden;
}
```

### With Shadow

```css
.glowing-meter {
  box-shadow: 0 2px 12px rgba(0, 255, 136, 0.2);
  border-radius: 4px;
}
```

## Color Gradient

The level meter displays a color gradient based on the current level:

- **0% - 70%**: Green (#00ff00) → Yellow (#ffff00)
- **70% - 90%**: Yellow (#ffff00) → Orange (#ff8800)
- **90% - 100%**: Orange (#ff8800) → Red (#ff0000)

This provides clear visual feedback about signal levels and helps identify when levels are approaching clipping.

## Peak Indicator

The peak indicator:
- Shows as a white line at the peak level position
- Turns red when clipping is detected
- Has a glow effect when clipping
- Persists until the peak level decays

## Scale Markings

When `showScale={true}`, the meter displays dB markings at:
- **0%**: -∞ dB
- **25%**: Calculated dB value
- **50%**: Calculated dB value
- **75%**: Calculated dB value
- **100%**: 0 dB

The dB calculation uses: `20 * log10(level)`

## Data Source

The `level`, `peak`, and `isClipping` values come from the LevelMeter component which analyzes the audio stream:

```tsx
// Inside LevelMeter component
const analyser = audioContext.createAnalyser();
const dataArray = new Uint8Array(analyser.frequencyBinCount);

// Calculate RMS level
analyser.getByteTimeDomainData(dataArray);
const rms = calculateRMS(dataArray);

// Track peak with decay
if (rms > peak) {
  setPeak(rms);
} else {
  setPeak(peak * 0.95); // Decay
}

// Detect clipping
const isClipping = rms > 0.99;
```

The LevelMeter component handles all this automatically when you use it with LevelMeterCanvas.

## Performance

- **Device Pixel Ratio**: Automatically scales canvas for retina displays
- **Resize Handling**: Responds to window resize events
- **Optimized Rendering**: Smooth updates with requestAnimationFrame
- **Conditional Glow**: Only applies glow effect when clipping

## Common Patterns

### Stereo Level Meters

```tsx
<div className="stereo-meters">
  <div className="meter-label">L</div>
  <LevelMeter input={leftChannel}>
    {({ level, peak, isClipping }) => (
      <LevelMeterCanvas
        level={level}
        peak={peak}
        isClipping={isClipping}
        height={40}
      />
    )}
  </LevelMeter>

  <div className="meter-label">R</div>
  <LevelMeter input={rightChannel}>
    {({ level, peak, isClipping }) => (
      <LevelMeterCanvas
        level={level}
        peak={peak}
        isClipping={isClipping}
        height={40}
      />
    )}
  </LevelMeter>
</div>
```

### Vertical Meters Side-by-Side

```tsx
<div style={{ display: 'flex', gap: '16px' }}>
  <div>
    <div>L</div>
    <LevelMeterCanvas
      level={leftLevel}
      peak={leftPeak}
      isClipping={leftClipping}
      orientation="vertical"
      width={30}
      height={200}
    />
  </div>

  <div>
    <div>R</div>
    <LevelMeterCanvas
      level={rightLevel}
      peak={rightPeak}
      isClipping={rightClipping}
      orientation="vertical"
      width={30}
      height={200}
    />
  </div>
</div>
```

### Compact Meter (No Scale)

```tsx
<LevelMeterCanvas
  level={level}
  peak={peak}
  isClipping={isClipping}
  height={20}
  showScale={false}
/>
```

### Master Output Meter

```tsx
<div className="master-section">
  <h3>Master Output</h3>
  <LevelMeter input={masterOutput}>
    {({ level, peak, isClipping }) => (
      <>
        <LevelMeterCanvas
          level={level}
          peak={peak}
          isClipping={isClipping}
          height={80}
        />
        {isClipping && (
          <div className="clip-warning">CLIPPING!</div>
        )}
      </>
    )}
  </LevelMeter>
</div>
```

### With Numeric Display

```tsx
<LevelMeter input={input}>
  {({ level, peak, isClipping }) => (
    <div className="meter-with-display">
      <LevelMeterCanvas
        level={level}
        peak={peak}
        isClipping={isClipping}
      />
      <div className="level-display">
        <span>RMS: {(20 * Math.log10(level || 0.001)).toFixed(1)} dB</span>
        <span>Peak: {(20 * Math.log10(peak || 0.001)).toFixed(1)} dB</span>
      </div>
    </div>
  )}
</LevelMeter>
```

## Orientation Comparison

### Horizontal
- Best for: Single channel monitoring, master output, compact displays
- Default height: 60px
- Scale appears below the meter
- Fills left to right

### Vertical
- Best for: Channel strips, mixer panels, stereo pairs
- Common heights: 150-300px
- Scale appears on the right side
- Fills bottom to top

## Related

- [LevelMeter](/api/visualizations/level-meter) - Data component
- [OscilloscopeCanvas](/api/ui/visualizations/oscilloscope)
- [SpectrumAnalyzerCanvas](/api/ui/visualizations/spectrum-analyzer)
- [Monitor](/api/output/monitor)
- [ModUI Overview](/api/ui/overview)
