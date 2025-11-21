# Oscilloscope

The `Oscilloscope` component visualizes audio signals in the time domain, displaying the waveform of the input audio stream.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `input` | `ModStreamRef` | Required | Reference to input audio signal to visualize |
| `fftSize` | `number` | `2048` | FFT size (must be power of 2 between 32-32768) |
| `children` | `function` | Required | Render prop function receiving visualization data |

## Render Props

When using the `children` render prop, the following data is provided:

| Property | Type | Description |
|----------|------|-------------|
| `dataArray` | `Uint8Array` | Time-domain audio data (waveform samples) |
| `bufferLength` | `number` | Length of the data array |
| `isActive` | `boolean` | Whether the oscilloscope is active and receiving data |

## Usage

### Basic Usage with Custom Canvas

```tsx
import { Oscilloscope } from '@mode-7/mod';
import { useRef, useEffect } from 'react';

function App() {
  const audioIn = useRef(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <>
      {/* Your audio source */}
      <ToneGenerator output={audioIn} />

      {/* Oscilloscope visualization */}
      <Oscilloscope input={audioIn}>
        {({ dataArray, bufferLength, isActive }) => {
          // Custom canvas drawing
          useEffect(() => {
            if (!isActive || !canvasRef.current) return;

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Clear canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw waveform
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 2;
            ctx.beginPath();

            const sliceWidth = canvas.width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
              const v = dataArray[i] / 255.0;
              const y = v * canvas.height;

              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }

              x += sliceWidth;
            }

            ctx.stroke();
          }, [dataArray, bufferLength, isActive]);

          return <canvas ref={canvasRef} width={800} height={200} />;
        }}
      </Oscilloscope>
    </>
  );
}
```

### Using ModUI OscilloscopeCanvas Component

MOD includes a pre-built `OscilloscopeCanvas` ModUI component that provides a styled, ready-to-use oscilloscope visualization:

```tsx
import { Oscilloscope, OscilloscopeCanvas } from '@mode-7/mod';

function App() {
  const audioIn = useRef(null);

  return (
    <>
      <ToneGenerator output={audioIn} />

      <Oscilloscope input={audioIn}>
        {({ dataArray, bufferLength, isActive }) => (
          isActive ? (
            <OscilloscopeCanvas
              dataArray={dataArray}
              bufferLength={bufferLength}
              height={150}
              color="#00ff88"
              lineWidth={2}
            />
          ) : (
            <div>No Signal</div>
          )
        )}
      </Oscilloscope>
    </>
  );
}
```

## OscilloscopeCanvas Props

The `OscilloscopeCanvas` ModUI component accepts the following props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dataArray` | `Uint8Array` | Required | Time-domain audio data from Oscilloscope |
| `bufferLength` | `number` | Required | Length of the data array |
| `width` | `number \| string` | `'100%'` | Canvas width (px or CSS string) |
| `height` | `number \| string` | `150` | Canvas height (px or CSS string) |
| `color` | `string` | `'#00ff88'` | Waveform line color |
| `lineWidth` | `number` | `2` | Waveform line thickness |
| `backgroundColor` | `string` | `'#0a0a0a'` | Canvas background color |
| `gridColor` | `string` | `'#1a1a1a'` | Grid lines color |
| `showGrid` | `boolean` | `true` | Show/hide grid lines |
| `className` | `string` | `''` | Additional CSS classes for container |
| `canvasClassName` | `string` | `''` | Additional CSS classes for canvas |

### Styling Examples

```tsx
// Custom colors
<OscilloscopeCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  color="#ff00ff"
  backgroundColor="#000000"
  gridColor="#333333"
/>

// No grid
<OscilloscopeCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  showGrid={false}
/>

// Custom size
<OscilloscopeCanvas
  dataArray={dataArray}
  bufferLength={bufferLength}
  width={600}
  height={200}
/>
```

## Notes

- The oscilloscope automatically adapts to changes in the audio source
- Higher `fftSize` values provide more detail but may impact performance
- The component uses `requestAnimationFrame` for smooth animations
- Works with any audio source (tone generators, microphones, audio files, etc.)
