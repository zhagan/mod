# XY Pad

A two-dimensional control surface for simultaneously controlling two parameters, perfect for effects modulation, spatial positioning, and creative parameter exploration.

## Features

- Simultaneous control of two parameters (X and Y axes)
- Visual grid lines for precise positioning
- Crosshair cursor with handle
- Independent min/max/step for each axis
- Custom value formatters for each axis
- Drag interaction with visual feedback
- Disabled state support
- Customizable size
- Full accessibility (ARIA attributes)
- Completely customizable via className props
- Event propagation control (won't drag parent modules)

## Import

```tsx
import { XYPad } from '@mode-7/mod';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `valueX` | `number` | Required | Current X-axis value |
| `valueY` | `number` | Required | Current Y-axis value |
| `onChangeX` | `(value: number) => void` | Required | X-axis change callback |
| `onChangeY` | `(value: number) => void` | Required | Y-axis change callback |
| `minX` | `number` | `0` | Minimum X-axis value |
| `maxX` | `number` | `100` | Maximum X-axis value |
| `minY` | `number` | `0` | Minimum Y-axis value |
| `maxY` | `number` | `100` | Maximum Y-axis value |
| `stepX` | `number` | `1` | X-axis step increment |
| `stepY` | `number` | `1` | Y-axis step increment |
| `labelX` | `string` | - | Label for X-axis |
| `labelY` | `string` | - | Label for Y-axis |
| `formatValueX` | `(value: number) => string` | - | Custom X value formatter |
| `formatValueY` | `(value: number) => string` | - | Custom Y value formatter |
| `size` | `number` | `200` | Pad size in pixels (width/height) |
| `disabled` | `boolean` | `false` | Disabled state |
| `className` | `string` | `''` | Additional CSS classes for container |
| `labelClassName` | `string` | `''` | Additional CSS classes for labels |
| `padClassName` | `string` | `''` | Additional CSS classes for pad surface |

## Usage

### Basic Usage

```tsx
import { XYPad } from '@mode-7/mod';
import { useState } from 'react';

function BasicXYPad() {
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);

  return (
    <XYPad
      valueX={x}
      valueY={y}
      onChangeX={setX}
      onChangeY={setY}
      labelX="X"
      labelY="Y"
    />
  );
}
```

### Filter Cutoff & Resonance

```tsx
function FilterControl() {
  const [cutoff, setCutoff] = useState(1000);
  const [resonance, setResonance] = useState(1);

  return (
    <XYPad
      valueX={cutoff}
      valueY={resonance}
      onChangeX={setCutoff}
      onChangeY={setResonance}
      minX={20}
      maxX={20000}
      minY={0.1}
      maxY={30}
      stepX={10}
      stepY={0.1}
      labelX="Cutoff"
      labelY="Resonance"
      formatValueX={(v) => `${v.toFixed(0)} Hz`}
      formatValueY={(v) => `${v.toFixed(1)} Q`}
    />
  );
}
```

### Delay Time & Feedback

```tsx
function DelayControl() {
  const [time, setTime] = useState(0.5);
  const [feedback, setFeedback] = useState(0.3);

  return (
    <XYPad
      valueX={time}
      valueY={feedback}
      onChangeX={setTime}
      onChangeY={setFeedback}
      minX={0}
      maxX={2}
      minY={0}
      maxY={0.95}
      stepX={0.01}
      stepY={0.01}
      labelX="Time"
      labelY="Feedback"
      formatValueX={(v) => `${(v * 1000).toFixed(0)} ms`}
      formatValueY={(v) => `${(v * 100).toFixed(0)}%`}
    />
  );
}
```

### Stereo Panning & Width

```tsx
function StereoControl() {
  const [pan, setPan] = useState(0);
  const [width, setWidth] = useState(100);

  return (
    <XYPad
      valueX={pan}
      valueY={width}
      onChangeX={setPan}
      onChangeY={setWidth}
      minX={-100}
      maxX={100}
      minY={0}
      maxY={100}
      labelX="Pan"
      labelY="Width"
      formatValueX={(v) => {
        if (v === 0) return 'Center';
        return v > 0 ? `${v}% R` : `${Math.abs(v)}% L`;
      }}
      formatValueY={(v) => `${v}%`}
    />
  );
}
```

### LFO Rate & Depth

```tsx
function LFOControl() {
  const [rate, setRate] = useState(1);
  const [depth, setDepth] = useState(50);

  return (
    <XYPad
      valueX={rate}
      valueY={depth}
      onChangeX={setRate}
      onChangeY={setDepth}
      minX={0.01}
      maxX={20}
      minY={0}
      maxY={100}
      stepX={0.01}
      stepY={1}
      labelX="Rate"
      labelY="Depth"
      formatValueX={(v) => `${v.toFixed(2)} Hz`}
      formatValueY={(v) => `${v}%`}
      size={250}
    />
  );
}
```

### Custom Size

```tsx
<XYPad
  valueX={x}
  valueY={y}
  onChangeX={setX}
  onChangeY={setY}
  size={300}
  labelX="X"
  labelY="Y"
/>
```

### Disabled State

```tsx
<XYPad
  valueX={x}
  valueY={y}
  onChangeX={setX}
  onChangeY={setY}
  disabled={true}
  labelX="X"
  labelY="Y"
/>
```

## CSS Classes

The XYPad component uses the following CSS classes:

- `.modui-xypad` - Container element
- `.modui-xypad-header` - Header containing labels
- `.modui-xypad-label` - Individual label
- `.modui-xypad-surface` - Pad surface
- `.modui-xypad-dragging` - Applied when dragging
- `.modui-xypad-disabled` - Applied when disabled
- `.modui-xypad-grid` - Grid container
- `.modui-xypad-grid-line` - Grid line
- `.modui-xypad-grid-line-v` - Vertical grid line
- `.modui-xypad-grid-line-h` - Horizontal grid line
- `.modui-xypad-crosshair` - Crosshair container
- `.modui-xypad-crosshair-h` - Horizontal crosshair line
- `.modui-xypad-crosshair-v` - Vertical crosshair line
- `.modui-xypad-handle` - Center handle/dot

## Styling Examples

### Custom Colors

```css
.custom-xypad .modui-xypad-surface {
  background: #0a0a0a;
  border-color: #3949ab;
}

.custom-xypad .modui-xypad-grid-line {
  background: #1a237e;
}

.custom-xypad .modui-xypad-handle {
  background: #7986cb;
  box-shadow: 0 0 12px rgba(121, 134, 203, 0.8);
}
```

### Custom Crosshair

```css
.custom-xypad .modui-xypad-crosshair-h,
.custom-xypad .modui-xypad-crosshair-v {
  background: rgba(76, 175, 80, 0.5);
}

.custom-xypad .modui-xypad-handle {
  background: #4CAF50;
  border: 2px solid #81C784;
  box-shadow: 0 0 16px rgba(76, 175, 80, 1);
}
```

### Larger Grid

```css
.custom-xypad .modui-xypad-surface::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 20%, rgba(255,255,255,0.05) 20%, rgba(255,255,255,0.05) calc(20% + 1px)),
    repeating-linear-gradient(90deg, transparent, transparent 20%, rgba(255,255,255,0.05) 20%, rgba(255,255,255,0.05) calc(20% + 1px));
  pointer-events: none;
}
```

## Behavior

### Coordinate System

- **X-axis**: Left to right (minX → maxX)
- **Y-axis**: Bottom to top (minY at bottom → maxY at top)
- Screen coordinates are inverted for Y (top of pad = maxY)

### Drag Interaction

1. Click/press on pad to set position
2. Drag to continuously update values
3. Release to complete interaction
4. Values snap to defined step increments

### Value Updates

- Values are clamped to min/max range
- Values snap to step increments
- Both axes update independently
- Callbacks only fire when values change

## Accessibility

The XYPad component includes:

- `role="slider"` for screen readers
- `aria-label` describing both controls
- `aria-valuemin`, `aria-valuemax`, `aria-valuenow` attributes
- `tabIndex` for keyboard focus
- Proper `disabled` state handling

## Common Patterns

### Effects Modulation

```tsx
<XYPad
  valueX={modRate}
  valueY={modDepth}
  onChangeX={setModRate}
  onChangeY={setModDepth}
  minX={0.1}
  maxX={20}
  minY={0}
  maxY={100}
  labelX="Rate"
  labelY="Depth"
/>
```

### Spatial Audio

```tsx
<XYPad
  valueX={azimuth}
  valueY={distance}
  onChangeX={setAzimuth}
  onChangeY={setDistance}
  minX={-180}
  maxX={180}
  minY={0}
  maxY={100}
  labelX="Azimuth"
  labelY="Distance"
/>
```

### EQ Control

```tsx
<XYPad
  valueX={frequency}
  valueY={gain}
  onChangeX={setFrequency}
  onChangeY={setGain}
  minX={20}
  maxX={20000}
  minY={-24}
  maxY={24}
  labelX="Frequency"
  labelY="Gain"
  formatValueX={(v) => `${v.toFixed(0)} Hz`}
  formatValueY={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`}
/>
```

## Related

- [Slider](/api/ui/controls/slider)
- [Knob](/api/ui/controls/knob)
- [Button](/api/ui/controls/button)
- [ModUI Overview](/api/ui/overview)
