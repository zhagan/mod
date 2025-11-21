# SpectrumAnalyzerCanvas

A canvas-based spectrum analyzer visualization component for displaying audio frequency data in real-time with colorful gradient bars.

## Features

- Real-time frequency spectrum visualization
- Two color modes: gradient (frequency-based) and solid
- Customizable bar spacing and colors
- Glow effects for enhanced visuals
- Responsive sizing with device pixel ratio support
- Smooth canvas rendering
- Completely customizable via className and style props

## Import

```tsx
import { SpectrumAnalyzerCanvas } from '@mode-7/mod';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dataArray` | `Uint8Array` | Required | Frequency data from AnalyserNode |
| `bufferLength` | `number` | Required | Length of data array |
| `width` | `number \| string` | `'100%'` | Canvas width |
| `height` | `number \| string` | `150` | Canvas height |
| `barGap` | `number` | `2` | Gap between bars in pixels |
| `backgroundColor` | `string` | `'#0a0a0a'` | Canvas background color |
| `colorMode` | `'gradient' \| 'solid'` | `'gradient'` | Color mode for bars |
| `color` | `string` | `'#00ff88'` | Bar color (used in solid mode) |
| `className` | `string` | `''` | Additional CSS classes for container |
| `canvasClassName` | `string` | `''` | Additional CSS classes for canvas |

## Usage

### Basic Usage with SpectrumAnalyzer Component

```tsx
import { SpectrumAnalyzer, SpectrumAnalyzerCanvas, useModStream } from '@mode-7/mod';

function FrequencyDisplay() {
  const input = useModStream();

  return (
    <SpectrumAnalyzer input={input}>
      {({ dataArray, bufferLength }) => (
        <SpectrumAnalyzerCanvas
          dataArray={dataArray}
          bufferLength={bufferLength}
        />
      )}
    </SpectrumAnalyzer>
  );
}
```

### Gradient Mode (Default)

```tsx
<SpectrumAnalyzerCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  colorMode="gradient"
/>
```

In gradient mode, bars are colored based on their frequency position:
- **Low frequencies** (bass): Blue → Cyan
- **Mid frequencies**: Green → Yellow
- **High frequencies** (treble): Yellow → Red

### Solid Color Mode

```tsx
<SpectrumAnalyzerCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  colorMode="solid"
  color="#ff0088"
/>
```

### Custom Size

```tsx
<SpectrumAnalyzerCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  width={800}
  height={250}
/>
```

### Tighter Bars

```tsx
<SpectrumAnalyzerCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  barGap={1}
/>
```

### Wide Bars

```tsx
<SpectrumAnalyzerCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  barGap={4}
/>
```

### Custom Background

```tsx
<SpectrumAnalyzerCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  backgroundColor="#000000"
/>
```

## Complete Integration Example

```tsx
import {
  AudioProvider,
  ToneGenerator,
  SpectrumAnalyzer,
  SpectrumAnalyzerCanvas,
  useModStream
} from '@mode-7/mod';
import { useState } from 'react';

function AudioSpectrumVisualization() {
  const output = useModStream();
  const [frequency, setFrequency] = useState(440);

  return (
    <AudioProvider>
      <div className="visualization">
        <ToneGenerator
          output={output}
          frequency={frequency}
          onFrequencyChange={setFrequency}
          type="sawtooth"
        />

        <SpectrumAnalyzer input={output}>
          {({ dataArray, bufferLength }) => (
            <SpectrumAnalyzerCanvas
              dataArray={dataArray}
              bufferLength={bufferLength}
              height={200}
            />
          )}
        </SpectrumAnalyzer>
      </div>
    </AudioProvider>
  );
}
```

## CSS Classes

The SpectrumAnalyzerCanvas component uses the following CSS classes:

- `.modui-spectrum-analyzer` - Container element
- `.modui-spectrum-analyzer-canvas` - Canvas element

## Styling Examples

### Custom Container

```css
.custom-spectrum {
  border: 2px solid #3949ab;
  border-radius: 8px;
  overflow: hidden;
}
```

### With Shadow

```css
.glowing-spectrum {
  box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
  border-radius: 4px;
}
```

## Color Modes

### Gradient (Default)

Automatically colors bars based on frequency:

```tsx
<SpectrumAnalyzerCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  colorMode="gradient"
/>
```

Creates a rainbow-like effect from low to high frequencies using HSL color space.

### Solid Color

Single color for all bars:

```tsx
// Green
<SpectrumAnalyzerCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  colorMode="solid"
  color="#00ff88"
/>

// Blue
<SpectrumAnalyzerCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  colorMode="solid"
  color="#00aaff"
/>

// Purple
<SpectrumAnalyzerCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  colorMode="solid"
  color="#cc00ff"
/>
```

## Data Source

The `dataArray` and `bufferLength` props come from the Web Audio API's AnalyserNode:

```tsx
// Inside SpectrumAnalyzer component
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

// In animation frame
analyser.getByteFrequencyData(dataArray);
```

The SpectrumAnalyzer component handles this automatically when you use it with SpectrumAnalyzerCanvas.

## Performance

- **Device Pixel Ratio**: Automatically scales canvas for retina displays
- **Resize Handling**: Responds to window resize events
- **Optimized Rendering**: Uses requestAnimationFrame for smooth updates
- **Glow Effects**: Adds shadow blur to each bar for enhanced visuals

## Common Patterns

### Stereo Spectrum

```tsx
<div className="stereo-spectrum">
  <SpectrumAnalyzer input={leftChannel}>
    {({ dataArray, bufferLength }) => (
      <SpectrumAnalyzerCanvas
        dataArray={dataArray}
        bufferLength={bufferLength}
        colorMode="solid"
        color="#00ff88"
        height={120}
      />
    )}
  </SpectrumAnalyzer>

  <SpectrumAnalyzer input={rightChannel}>
    {({ dataArray, bufferLength }) => (
      <SpectrumAnalyzerCanvas
        dataArray={dataArray}
        bufferLength={bufferLength}
        colorMode="solid"
        color="#ff0088"
        height={120}
      />
    )}
  </SpectrumAnalyzer>
</div>
```

### With Label

```tsx
<div className="spectrum-panel">
  <h3>Frequency Spectrum</h3>
  <SpectrumAnalyzerCanvas
    dataArray={dataArray}
    bufferLength={bufferLength}
  />
</div>
```

### Compact Visualization

```tsx
<SpectrumAnalyzerCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  height={80}
  barGap={1}
/>
```

### Full Width Display

```tsx
<SpectrumAnalyzerCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  width="100%"
  height={300}
  barGap={3}
/>
```

## Gradient Color Calculation

In gradient mode, colors are calculated using HSL:

```javascript
// For each bar (i) out of total bars (bufferLength)
const hue = (i / bufferLength) * 120 + 120;
// Creates range from 120° (green) to 240° (blue)
```

This creates a smooth color transition across the frequency spectrum.

## Related

- [SpectrumAnalyzer](/api/visualizations/spectrum-analyzer) - Data component
- [OscilloscopeCanvas](/api/ui/visualizations/oscilloscope)
- [LevelMeterCanvas](/api/ui/visualizations/level-meter)
- [ModUI Overview](/api/ui/overview)
