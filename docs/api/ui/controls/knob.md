# Knob

A rotary control component that users can drag to adjust values, perfect for audio parameters like frequency, gain, and filters.

## Features

- Rotary control with intuitive mouse drag interaction
- 270° rotation range for precise control
- SVG-based rendering for crisp visuals
- Visual feedback with track, value arc, and indicator
- Customizable size and styling
- Label and formatted value display
- Disabled state support
- Full accessibility (ARIA attributes)
- Completely customizable via className props

## Import

```tsx
import { Knob } from '@mode-7/mod';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | Required | Current knob value |
| `onChange` | `(value: number) => void` | Required | Value change callback |
| `min` | `number` | `0` | Minimum value |
| `max` | `number` | `100` | Maximum value |
| `step` | `number` | `1` | Step increment |
| `label` | `string` | - | Optional label text |
| `unit` | `string` | `''` | Unit suffix (e.g., "Hz", "%") |
| `formatValue` | `(value: number) => string` | - | Custom value formatter |
| `size` | `number` | `60` | Size in pixels |
| `disabled` | `boolean` | `false` | Disable the knob |
| `className` | `string` | `''` | Container class |
| `labelClassName` | `string` | `''` | Label class |
| `valueClassName` | `string` | `''` | Value display class |
| `knobClassName` | `string` | `''` | Knob control class |

## Usage

### Basic Usage

```tsx
import { Knob } from '@mode-7/mod';
import { useState } from 'react';

function MyComponent() {
  const [volume, setVolume] = useState(75);

  return (
    <Knob
      value={volume}
      onChange={setVolume}
      min={0}
      max={100}
      label="Volume"
      unit="%"
    />
  );
}
```

### Custom Size

```tsx
<Knob
  value={frequency}
  onChange={setFrequency}
  min={20}
  max={20000}
  label="Frequency"
  formatValue={(v) => `${v.toFixed(0)} Hz`}
  size={100}
/>
```

### With Custom Formatting

```tsx
<Knob
  value={gain}
  onChange={setGain}
  min={-60}
  max={12}
  step={0.1}
  label="Gain"
  formatValue={(val) => `${val.toFixed(1)} dB`}
/>
```

### Multiple Knobs

```tsx
function FilterControls() {
  const [frequency, setFrequency] = useState(1000);
  const [resonance, setResonance] = useState(1);
  const [gain, setGain] = useState(0);

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <Knob
        value={frequency}
        onChange={setFrequency}
        min={20}
        max={20000}
        label="Frequency"
        formatValue={(v) => `${v.toFixed(0)} Hz`}
        size={80}
      />
      <Knob
        value={resonance}
        onChange={setResonance}
        min={0.1}
        max={20}
        step={0.1}
        label="Resonance"
        formatValue={(v) => v.toFixed(1)}
        size={60}
      />
      <Knob
        value={gain}
        onChange={setGain}
        min={-12}
        max={12}
        step={0.5}
        label="Gain"
        unit=" dB"
        size={60}
      />
    </div>
  );
}
```

### With Tailwind Styling

```tsx
<Knob
  value={value}
  onChange={setValue}
  label="Pan"
  className="p-2"
  labelClassName="text-blue-400 text-xs uppercase"
  valueClassName="text-blue-500 text-sm font-bold"
  knobClassName="hover:scale-110"
/>
```

### Disabled State

```tsx
<Knob
  value={value}
  onChange={setValue}
  label="Locked"
  disabled={true}
/>
```

## CSS Classes

The Knob component uses the following CSS classes:

- `.modui-knob` - Container element
- `.modui-knob-header` - Header with label
- `.modui-knob-label` - Label text
- `.modui-knob-value` - Value display
- `.modui-knob-control` - Knob control wrapper
- `.modui-knob-svg` - SVG element
- `.modui-knob-track` - Background arc
- `.modui-knob-value-arc` - Value indicator arc
- `.modui-knob-center` - Center circle
- `.modui-knob-indicator` - Indicator line
- `.modui-knob-dragging` - Applied while dragging
- `.modui-knob-disabled` - Applied when disabled

## Interaction

- **Drag up** - Increase value
- **Drag down** - Decrease value
- **Sensitivity** - 0.5 pixels per step
- **Visual feedback** - Hover and active states
- **Smooth rotation** - 270° range (-135° to +135°)

## Styling Examples

### Custom Theme

```css
.modui-knob-track {
  color: #1a1a2e;
}

.modui-knob-value-arc {
  color: #0f3460;
}

.modui-knob-center {
  color: #16213e;
}

.modui-knob-indicator {
  color: #e94560;
}
```

### Minimal Style

```css
.modui-knob-control {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.modui-knob-value-arc {
  filter: brightness(1.5);
}
```

## Accessibility

The Knob component includes:

- `role="slider"` for screen readers
- `aria-valuemin`, `aria-valuemax`, `aria-valuenow` attributes
- `aria-label` for accessibility
- Keyboard support (planned)
- Proper `disabled` state handling

## Related

- [Slider](/api/ui/controls/slider)
- [ModUI Overview](/api/ui/overview)
