# Select

A dropdown select component with zero dependencies, perfect for choosing between options like waveform types, filter modes, and device selection.

## Features

- **Zero dependencies** - Custom implementation, no Radix UI or external libraries
- Dropdown with visual checkmark for selected item
- Click-outside-to-close behavior
- Smooth animations
- Custom scrollbar styling
- Disabled state support
- Full accessibility (ARIA attributes)
- Completely customizable via className props

## Import

```tsx
import { Select } from '@mode-7/mod';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | Required | Currently selected value |
| `onChange` | `(value: string) => void` | Required | Selection change callback |
| `options` | `SelectOption[]` | Required | Array of options |
| `placeholder` | `string` | `'Select...'` | Placeholder text |
| `disabled` | `boolean` | `false` | Disabled state |
| `className` | `string` | `''` | Additional CSS classes |

### SelectOption Type

```tsx
interface SelectOption {
  value: string;
  label: string;
}
```

## Usage

### Basic Usage

```tsx
import { Select } from '@mode-7/mod';
import { useState } from 'react';

function WaveformSelector() {
  const [waveform, setWaveform] = useState('sine');

  return (
    <Select
      value={waveform}
      onChange={setWaveform}
      options={[
        { value: 'sine', label: 'Sine' },
        { value: 'square', label: 'Square' },
        { value: 'sawtooth', label: 'Sawtooth' },
        { value: 'triangle', label: 'Triangle' },
      ]}
      placeholder="Select Waveform"
    />
  );
}
```

### Filter Type Selection

```tsx
function FilterTypeSelect() {
  const [filterType, setFilterType] = useState('lowpass');

  return (
    <Select
      value={filterType}
      onChange={setFilterType}
      options={[
        { value: 'lowpass', label: 'Low Pass' },
        { value: 'highpass', label: 'High Pass' },
        { value: 'bandpass', label: 'Band Pass' },
        { value: 'lowshelf', label: 'Low Shelf' },
        { value: 'highshelf', label: 'High Shelf' },
        { value: 'peaking', label: 'Peaking' },
        { value: 'notch', label: 'Notch' },
        { value: 'allpass', label: 'All Pass' },
      ]}
    />
  );
}
```

### Device Selection

```tsx
function DeviceSelector({ devices }) {
  const [selectedDevice, setSelectedDevice] = useState('');

  return (
    <Select
      value={selectedDevice}
      onChange={setSelectedDevice}
      options={[
        { value: '', label: 'Default Device' },
        ...devices.map(device => ({
          value: device.id,
          label: device.name
        }))
      ]}
      placeholder="Select Audio Device"
    />
  );
}
```

### Crossfade Mode Selection

```tsx
function CrossfadeModeSelect() {
  const [mode, setMode] = useState('equal-power');

  return (
    <Select
      value={mode}
      onChange={setMode}
      options={[
        { value: 'linear', label: 'Linear' },
        { value: 'equal-power', label: 'Equal Power' },
        { value: 'equal-gain', label: 'Equal Gain' },
        { value: 'exponential', label: 'Exponential' },
        { value: 'dj-cut', label: 'DJ Cut' },
        { value: 'smooth-step', label: 'Smooth Step' },
      ]}
    />
  );
}
```

### Disabled State

```tsx
<Select
  value={value}
  onChange={setValue}
  options={options}
  disabled={true}
/>
```

### With Type Safety

```tsx
type FilterType = 'lowpass' | 'highpass' | 'bandpass';

function TypeSafeSelect() {
  const [filter, setFilter] = useState<FilterType>('lowpass');

  return (
    <Select
      value={filter}
      onChange={(v) => setFilter(v as FilterType)}
      options={[
        { value: 'lowpass', label: 'Low Pass' },
        { value: 'highpass', label: 'High Pass' },
        { value: 'bandpass', label: 'Band Pass' },
      ]}
    />
  );
}
```

## CSS Classes

The Select component uses the following CSS classes:

- `.modui-select` - Container element
- `.modui-select-open` - Applied when dropdown is open
- `.modui-select-disabled` - Applied when disabled
- `.modui-select-trigger` - Trigger button
- `.modui-select-value` - Selected value text
- `.modui-select-arrow` - Dropdown arrow icon
- `.modui-select-dropdown` - Dropdown container
- `.modui-select-list` - Options list
- `.modui-select-option` - Individual option
- `.modui-select-option-selected` - Selected option
- `.modui-select-checkmark` - Checkmark icon
- `.modui-select-option-label` - Option label text

## Styling Examples

### Custom Colors

```css
.custom-select .modui-select-trigger {
  background: #1a1a2e;
  border-color: #3949ab;
}

.custom-select .modui-select-trigger:hover:not(:disabled) {
  border-color: #5c6bc0;
}

.custom-select.modui-select-open .modui-select-trigger {
  border-color: #7986cb;
}
```

### Custom Dropdown

```css
.custom-select .modui-select-dropdown {
  background: #16213e;
  border-color: #3949ab;
  box-shadow: 0 8px 24px rgba(57, 73, 171, 0.3);
}

.custom-select .modui-select-option:hover {
  background: #1a237e;
}

.custom-select .modui-select-option-selected {
  background: rgba(121, 134, 203, 0.2);
  color: #7986cb;
}
```

### Compact Size

```css
.compact-select .modui-select-trigger {
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
}

.compact-select .modui-select-option {
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
}
```

## Behavior

### Click Outside

The dropdown automatically closes when clicking outside the component.

### Keyboard Navigation (Planned)

Future versions will support:
- Arrow keys to navigate options
- Enter to select
- Escape to close
- Type-ahead search

### Scrolling

Long option lists will scroll with a custom-styled scrollbar that matches the dark theme.

## Accessibility

The Select component includes:

- `role="listbox"` for the options list
- `role="option"` for each option
- `aria-haspopup="listbox"` for the trigger
- `aria-expanded` state
- `aria-selected` for options
- Proper `disabled` state handling

## Common Patterns

### Audio Parameter Selection

```tsx
<Select
  value={waveform}
  onChange={setWaveform}
  options={WAVEFORM_OPTIONS}
/>
```

### Conditional Options

```tsx
<Select
  value={output}
  onChange={setOutput}
  options={availableOutputs.map(out => ({
    value: out.id,
    label: out.name
  }))}
  disabled={availableOutputs.length === 0}
  placeholder={availableOutputs.length === 0 ? 'No outputs available' : 'Select output'}
/>
```

### With Default Value

```tsx
function SelectWithDefault() {
  const [mode, setMode] = useState('equal-power');

  return (
    <Select
      value={mode}
      onChange={setMode}
      options={CROSSFADE_MODES}
    />
  );
}
```

## Migration from Radix UI

If you're migrating from Radix UI Select:

```tsx
// Before (Radix UI)
<RadixSelect.Root value={value} onValueChange={onChange}>
  <RadixSelect.Trigger>
    <RadixSelect.Value />
  </RadixSelect.Trigger>
  <RadixSelect.Content>
    {options.map(opt => (
      <RadixSelect.Item value={opt.value}>
        {opt.label}
      </RadixSelect.Item>
    ))}
  </RadixSelect.Content>
</RadixSelect.Root>

// After (ModUI)
<Select
  value={value}
  onChange={onChange}
  options={options}
/>
```

Key differences:
- **Much simpler API** - Just pass value, onChange, and options
- **No dependencies** - Radix UI removed
- **Smaller bundle** - No external library overhead
- `onValueChange` → `onChange`

## Related

- [Button](/api/ui/controls/button)
- [Slider](/api/ui/controls/slider)
- [Knob](/api/ui/controls/knob)
- [ModUI Overview](/api/ui/overview)
