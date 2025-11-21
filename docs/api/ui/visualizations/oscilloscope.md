# OscilloscopeCanvas

A canvas-based oscilloscope visualization component for displaying audio waveforms in real-time.

## Features

- Real-time waveform visualization
- Customizable colors and styling
- Optional grid lines for reference
- Configurable line width and glow effects
- Responsive sizing with device pixel ratio support
- Smooth canvas rendering with shadow effects
- Completely customizable via className and style props

## Import

```tsx
import { OscilloscopeCanvas } from '@mode-7/mod';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dataArray` | `Uint8Array` | Required | Waveform data from AnalyserNode |
| `bufferLength` | `number` | Required | Length of data array |
| `width` | `number \| string` | `'100%'` | Canvas width |
| `height` | `number \| string` | `150` | Canvas height |
| `color` | `string` | `'#00ff88'` | Waveform line color |
| `lineWidth` | `number` | `2` | Waveform line width in pixels |
| `backgroundColor` | `string` | `'#0a0a0a'` | Canvas background color |
| `gridColor` | `string` | `'#1a1a1a'` | Grid line color |
| `showGrid` | `boolean` | `true` | Show grid lines |
| `className` | `string` | `''` | Additional CSS classes for container |
| `canvasClassName` | `string` | `''` | Additional CSS classes for canvas |

## Usage

### Basic Usage with Oscilloscope Component

```tsx
import { Oscilloscope, OscilloscopeCanvas, useModStream } from '@mode-7/mod';

function WaveformDisplay() {
  const input = useModStream();

  return (
    <Oscilloscope input={input}>
      {({ dataArray, bufferLength }) => (
        <OscilloscopeCanvas
          dataArray={dataArray}
          bufferLength={bufferLength}
        />
      )}
    </Oscilloscope>
  );
}
```

### Custom Colors

```tsx
<OscilloscopeCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  color="#ff0088"
  backgroundColor="#000000"
  gridColor="#222222"
/>
```

### Custom Size

```tsx
<OscilloscopeCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  width={600}
  height={200}
/>
```

### No Grid

```tsx
<OscilloscopeCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  showGrid={false}
/>
```

### Thick Line with Glow

```tsx
<OscilloscopeCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  lineWidth={4}
  color="#00ffff"
/>
```

### Responsive Width

```tsx
<OscilloscopeCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  width="100%"
  height={180}
/>
```

## Complete Integration Example

```tsx
import {
  AudioProvider,
  ToneGenerator,
  Oscilloscope,
  OscilloscopeCanvas,
  useModStream
} from '@mode-7/mod';
import { useState } from 'react';

function ToneVisualization() {
  const output = useModStream();
  const [frequency, setFrequency] = useState(440);

  return (
    <AudioProvider>
      <div className="visualization">
        <ToneGenerator
          output={output}
          frequency={frequency}
          onFrequencyChange={setFrequency}
          type="sine"
        />

        <Oscilloscope input={output}>
          {({ dataArray, bufferLength }) => (
            <OscilloscopeCanvas
              dataArray={dataArray}
              bufferLength={bufferLength}
              color="#00ff88"
              height={200}
            />
          )}
        </Oscilloscope>
      </div>
    </AudioProvider>
  );
}
```

## CSS Classes

The OscilloscopeCanvas component uses the following CSS classes:

- `.modui-oscilloscope` - Container element
- `.modui-oscilloscope-canvas` - Canvas element

## Styling Examples

### Custom Container

```css
.custom-oscilloscope {
  border: 2px solid #3949ab;
  border-radius: 8px;
  overflow: hidden;
}
```

### With Padding

```css
.padded-oscilloscope {
  padding: 16px;
  background: #0a0a0a;
}

.padded-oscilloscope .modui-oscilloscope-canvas {
  border-radius: 4px;
}
```

## Color Schemes

### Retro Green

```tsx
<OscilloscopeCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  color="#00ff00"
  backgroundColor="#001100"
  gridColor="#003300"
/>
```

### Blue Neon

```tsx
<OscilloscopeCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  color="#00ccff"
  backgroundColor="#000a0f"
  gridColor="#001a2e"
/>
```

### Purple Wave

```tsx
<OscilloscopeCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  color="#cc00ff"
  backgroundColor="#0a000f"
  gridColor="#1a001e"
/>
```

### Classic Amber

```tsx
<OscilloscopeCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  color="#ffaa00"
  backgroundColor="#0f0a00"
  gridColor="#1e1400"
/>
```

## Grid Configuration

The grid displays:
- **Horizontal lines**: 5 lines (0%, 25%, 50%, 75%, 100%)
- **Vertical lines**: 9 lines (0%, 12.5%, 25%, ..., 100%)

This provides a standard oscilloscope-style reference grid for amplitude and time divisions.

## Data Source

The `dataArray` and `bufferLength` props come from the Web Audio API's AnalyserNode:

```tsx
// Inside Oscilloscope component
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

// In animation frame
analyser.getByteTimeDomainData(dataArray);
```

The Oscilloscope component handles this automatically when you use it with OscilloscopeCanvas.

## Performance

- **Device Pixel Ratio**: Automatically scales canvas for retina displays
- **Resize Handling**: Responds to window resize events
- **Optimized Rendering**: Uses requestAnimationFrame for smooth updates
- **Shadow Effects**: Adds glow to waveform without significant performance impact

## Common Patterns

### Multiple Waveforms

```tsx
<div className="dual-scope">
  <Oscilloscope input={leftChannel}>
    {({ dataArray, bufferLength }) => (
      <OscilloscopeCanvas
        dataArray={dataArray}
        bufferLength={bufferLength}
        color="#00ff88"
        height={100}
      />
    )}
  </Oscilloscope>

  <Oscilloscope input={rightChannel}>
    {({ dataArray, bufferLength }) => (
      <OscilloscopeCanvas
        dataArray={dataArray}
        bufferLength={bufferLength}
        color="#ff0088"
        height={100}
      />
    )}
  </Oscilloscope>
</div>
```

### With Header

```tsx
<div className="scope-panel">
  <h3>Waveform</h3>
  <OscilloscopeCanvas
    dataArray={dataArray}
    bufferLength={bufferLength}
  />
</div>
```

### Minimal Style

```tsx
<OscilloscopeCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  showGrid={false}
  backgroundColor="transparent"
  lineWidth={1}
  height={60}
/>
```

## Related

- [Oscilloscope](/api/visualizations/oscilloscope) - Data component
- [SpectrumAnalyzerCanvas](/api/ui/visualizations/spectrum-analyzer)
- [LevelMeterCanvas](/api/ui/visualizations/level-meter)
- [ModUI Overview](/api/ui/overview)
